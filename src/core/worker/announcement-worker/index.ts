/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Connection, MoreThan } from 'typeorm';
import { CronJob } from 'cron';

import {
  AnnouncementEntity,
  EntrantEntity,
  GameEntity,
  RaceEntity,
  TrackerEntity,
} from '../../../models/entities';

import {
  ChatMessage,
  DestinationConnector,
  RaceInformation,
} from '../../../models/interfaces';

import {
  DestinationConnectorIdentifier,
  RaceStatus,
  TaskIdentifier,
  WorkerType,
} from '../../../models/enums';

import ConfigService from '../../config/config.service';
import DatabaseService from '../../database/database-service';
import LoggerService from '../../logger/logger.service';
import RedisService from '../../redis/redis-service';

import DateTimeUtils from '../../../utils/date-time.utils';

import Worker from '../worker.interface';
import enabledWorkers from '../../../enabled-workers';

class AnnouncementWorker<T extends DestinationConnectorIdentifier>
  implements Worker
{
  private readonly connector: DestinationConnector<T>;
  private databaseConnection: Connection;
  private announcementSyncJob: CronJob;

  public constructor(connector: T) {
    const worker = enabledWorkers.find((w) => {
      return (
        w.connector === connector && w.types.includes(WorkerType.ANNOUNCER)
      );
    });

    if (!worker) throw new Error(`Invalid announcement connector ${connector}`);
    this.connector = new worker.ctor() as unknown as DestinationConnector<T>;
  }

  /**
   * Transforms the speicfied race to its {@link RaceInformation} representation
   *
   * @param race      The race
   * @param entrants  The races entrants
   * @returns         The transformed race details
   */
  private raceEntityToRaceInformation(
    race: RaceEntity,
    entrants: EntrantEntity[],
  ): RaceInformation {
    return {
      ...race,
      entrants: entrants.map((e) => ({
        ...e,
        identifier: e.racer.identifier,
        displayName: e.racer.displayName,
        fullName: e.racer.fullName,
      })),
    };
  }

  /**
   * Gets the list of races that have been synced within the last 6 hours
   *
   * @returns  The list of active races
   */
  private getActiveRaces(): Promise<RaceEntity[]> {
    return this.databaseConnection.getRepository(RaceEntity).find({
      relations: [nameof<RaceEntity>((r) => r.game)],
      where: {
        lastSyncAt: MoreThan(DateTimeUtils.subtractHours(new Date(), 6)),
      },
    });
  }

  /**
   * Gets the posted announcements for the specified race
   *
   * @param race  The race
   * @returns     The list of posted announcements
   */
  private getAnnouncementsForRace(
    race: RaceEntity,
  ): Promise<AnnouncementEntity[]> {
    return this.databaseConnection.getRepository(AnnouncementEntity).find({
      relations: [
        nameof<AnnouncementEntity>((a) => a.race),
        nameof<AnnouncementEntity>((a) => a.tracker),
        `${nameof<AnnouncementEntity>(
          (a) => a.tracker,
        )}.${nameof<TrackerEntity>((t) => t.game)}`,
      ],
      where: {
        race,
      },
    });
  }

  /**
   * Gets the list of entrants for the specified race
   *
   * @param race  The race
   * @returns     The list of entrants with their racer information
   */
  private getRaceEntrants(race: RaceEntity): Promise<EntrantEntity[]> {
    return this.databaseConnection.getRepository(EntrantEntity).find({
      relations: [nameof<EntrantEntity>((e) => e.racer)],
      where: {
        race,
      },
    });
  }

  /**
   * Finds all active trackers mapped to the specified game where the channel is the
   * current connector
   *
   * @param game  The game
   * @returns     The list of active trackers for the specified game mapped to this
   *              connector
   */
  private findActiveTrackersForGame(
    game: GameEntity,
  ): Promise<TrackerEntity[]> {
    return this.databaseConnection.getRepository(TrackerEntity).find({
      relations: [nameof<TrackerEntity>((e) => e.channel)],
      where: {
        isActive: true,
        game,
        channel: {
          connector: this.connector.connectorType,
        },
      },
    });
  }

  /**
   * Creates and updates announcements for the current connector
   */
  private async updateAnnouncements(): Promise<void> {
    LoggerService.log(`Updating announcements`);
    const activeRaces = await this.getActiveRaces();

    LoggerService.log(`Scanning ${activeRaces.length} active races`);

    for (const activeRace of activeRaces) {
      // Get existing announcements for the race
      const activeAnnouncements = await this.getAnnouncementsForRace(
        activeRace,
      );
      LoggerService.debug(
        `Synching ${activeAnnouncements.length} announcements for ${activeRace.id}`,
      );

      // Get races entrants
      const raceEntrants = await this.getRaceEntrants(activeRace);

      for (const activeAnnouncement of activeAnnouncements) {
        LoggerService.debug(`Synching announcement ${activeAnnouncement.id}`);

        // Consider updates to no longer work
        // if the they failed the previous 5 times
        if (activeAnnouncement.failedUpdateAttempts > 5) {
          LoggerService.warn(
            `Announcement sync for id ${activeAnnouncement.id} exceeded max failed update attempts`,
          );
          continue;
        }

        // Don't update the announcement if the
        // race hasn't changed
        if (activeAnnouncement.changeCounter === activeRace.changeCounter) {
          LoggerService.debug(
            `Change counter unchanged, skipping announcement`,
          );
          continue;
        }

        try {
          LoggerService.debug(`Updating announcement ${activeAnnouncement.id}`);
          const originalMessage: ChatMessage = JSON.parse(
            activeAnnouncement.previousMessage,
          );

          // Don't even try to update a post if the
          // bot is missing the permissions
          const botHasRequiredPermissions =
            await this.connector.botHasRequiredPermissions(
              originalMessage.channel,
            );
          if (!botHasRequiredPermissions) {
            LoggerService.warn(
              `Missing permission in channel ${originalMessage.channel.identifier}`,
            );
            continue;
          }

          // Update the announcement
          LoggerService.debug(`Updating post`);
          const updatedMessage = await this.connector.updateRaceMessage(
            originalMessage,
            this.raceEntityToRaceInformation(activeRace, raceEntrants),
            activeRace.game.id !== activeAnnouncement.tracker.game.id,
          );

          activeAnnouncement.changeCounter = activeRace.changeCounter;
          activeAnnouncement.failedUpdateAttempts = 0;
          activeAnnouncement.previousMessage = JSON.stringify(updatedMessage);
          activeAnnouncement.lastUpdated = new Date();

          // Persist the update
          await this.databaseConnection
            .getRepository(AnnouncementEntity)
            .save(activeAnnouncement);
        } catch (err) {
          LoggerService.error(err);
          activeAnnouncement.failedUpdateAttempts++;
          await this.databaseConnection
            .getRepository(AnnouncementEntity)
            .save(activeAnnouncement);
        }
      }

      // Don't announce races that are already
      // finished or in an unknown state
      if (
        ![
          RaceStatus.ENTRY_OPEN,
          RaceStatus.INVITATIONAL,
          RaceStatus.ENTRY_CLOSED,
          RaceStatus.IN_PROGRESS,
        ].includes(activeRace.status)
      )
        continue;

      // Races should be picked up within the first 3
      // updates by the announcer. This is just to prevent
      // announcements to be spammed in case  there's
      // an oversight in the logic and/or network issue below
      // @TODO Add a transition state to either redis or mysql
      if (activeRace.changeCounter > 3) continue;

      // Lookup which trackers still need an announcement
      const trackers = await this.findActiveTrackersForGame(activeRace.game);
      const trackersWithoutAnnouncements = trackers.filter(
        (t) => !activeAnnouncements.some((a) => a.tracker.id === t.id),
      );

      // Post announcements for the trackers
      for (const trackerWithoutAnnouncement of trackersWithoutAnnouncements) {
        try {
          const botHasRequiredPermissions =
            await this.connector.botHasRequiredPermissions(
              trackerWithoutAnnouncement.channel,
            );

          if (!botHasRequiredPermissions) continue;

          const postedAnnouncement = await this.connector.postRaceMessage(
            trackerWithoutAnnouncement.channel,
            this.raceEntityToRaceInformation(activeRace, raceEntrants),
          );

          await this.databaseConnection.getRepository(AnnouncementEntity).save(
            new AnnouncementEntity({
              changeCounter: activeRace.changeCounter,
              tracker: trackerWithoutAnnouncement,
              previousMessage: JSON.stringify(postedAnnouncement),
              failedUpdateAttempts: 0,
              lastUpdated: new Date(),
              race: activeRace,
            }),
          );
        } catch (err) {
          LoggerService.error(err);
        }
      }
    }
  }

  /**
   * Initializes the cronjob that syncs the announcements
   *
   * @param lockTimeInSeconds  Max time for the job lock to
   *                           be held by this worker
   */
  private initAnnouncementSyncJob(lockTimeInSeconds = 60): void {
    this.announcementSyncJob = new CronJob(
      ConfigService.announcementSyncInterval,
      async () => {
        try {
          LoggerService.log('Attempting to reserve announcement sync job');

          // Keep the job reserved for the specified time
          // to ensure it's going to be released again
          const reservedByCurrentInstance = await RedisService.tryReserveTask(
            TaskIdentifier.ANNOUNCEMENT_SYNC,
            this.connector.connectorType,
            ConfigService.instanceUuid,
            lockTimeInSeconds,
          );

          if (!reservedByCurrentInstance) {
            LoggerService.log(`Could not reserve annoucement sync job`);
            return;
          }

          try {
            await this.updateAnnouncements();
          } catch (err) {
            LoggerService.error(err);
            throw err;
          } finally {
            // Remove the reservation for the
            // announcement sync after 10 seconds
            await new Promise<void>((resolve) =>
              setTimeout(async () => {
                await RedisService.freeTask(
                  TaskIdentifier.ANNOUNCEMENT_SYNC,
                  this.connector.connectorType,
                  ConfigService.instanceUuid,
                );
                resolve();
              }, 10000),
            );
          }
        } catch (err) {
          LoggerService.error(`Failed to sync announcements`, err);
        }
      },
    );
  }

  /**
   * Starts the worker
   */
  public async start(): Promise<void> {
    this.databaseConnection = await DatabaseService.getConnection();
    this.initAnnouncementSyncJob();
    this.announcementSyncJob.start();
    return this.connector.connect(false);
  }

  /**
   * Frees used ressources and shuts down the tasks
   */
  public async dispose(): Promise<void> {
    await DatabaseService.closeConnection();
    return this.connector.dispose();
  }
}

export default AnnouncementWorker;
