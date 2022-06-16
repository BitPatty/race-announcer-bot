/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2022 Matteias Collet <matteias.collet@bluewin.ch>
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

import { CronJob } from 'cron';
import { v4 } from 'uuid';

import {
  ChatChannel,
  ChatMessage,
  DestinationConnector,
  RaceInformation,
} from '../../models/interfaces';

import { TaskIdentifier, WorkerType } from '../../models/enums';

import DestinationConnectorIdentifier from '../../connectors/destination-connector-identifier.enum';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';
import RedisService from '../redis/redis-service';

import DateTimeUtils from '../../utils/date-time.utils';

import {
  Announcement,
  CommunicationChannel,
  Entrant,
  Game,
  PrismaClient,
  Race,
  RaceStatus,
  Racer,
  Tracker,
} from '@prisma/client';
import { prisma } from '../../prisma';

import Worker from './worker.interface';
import enabledWorkers from '../../enabled-workers';

class AnnouncementWorker<T extends DestinationConnectorIdentifier>
  implements Worker
{
  private readonly connector: DestinationConnector<T>;
  private prismaClient: PrismaClient;
  private announcementSyncJob: CronJob;

  public constructor(connector: T) {
    const worker = enabledWorkers.find((w) => {
      return (
        w.connector === connector && w.types.includes(WorkerType.ANNOUNCER)
      );
    });

    if (!worker) throw new Error(`Invalid announcement connector ${connector}`);
    this.connector = new worker.ctor() as unknown as DestinationConnector<T>;
    this.prismaClient = prisma;
  }

  private raceToRaceInformation(
    race: Awaited<ReturnType<typeof this.getActiveRaces>>[0],
  ): RaceInformation {
    return {
      identifier: race.identifier,
      game: {
        name: race.game.name,
        abbreviation: race.game.abbreviation,
        identifier: race.game.identifier,
        imageUrl: race.game.image_url,
        connector: race.game.connector,
      },
      url: race.url ?? undefined,
      goal: race.goal ?? undefined,
      status: race.status,
      // status: activeRace.status,
      entrants: race.entrants.map((e) => ({
        identifier: e.racer.identifier,
        displayName: e.racer.display_name,
        fullName: e.racer.full_name,
        finalTime: e.final_time,
        status: e.status,
      })),
    };
  }

  private channelToChatChannel(channel: CommunicationChannel): ChatChannel {
    return {
      identifier: channel.identifier,
      serverIdentifier: channel.server_identifier,
      name: channel.name,
      serverName: channel.server_name,
      type: channel.type,
    };
  }

  /**
   * Gets the list of races that have been synced within the last 6 hours
   *
   * @returns  The list of active races
   */
  private getActiveRaces(): Promise<
    (Race & {
      game: Game;
      entrants: (Entrant & { racer: Racer })[];
      announcements: (Announcement & {
        tracker:
          | (Tracker & {
              game: Game;
              communication_channel: CommunicationChannel;
            })
          | null;
      })[];
    })[]
  > {
    return this.prismaClient.race.findMany({
      where: {
        last_sync_at: {
          gt: DateTimeUtils.subtractHours(new Date(), 6),
        },
      },
      include: {
        game: true,
        entrants: {
          include: {
            racer: true,
          },
        },
        announcements: {
          include: {
            tracker: {
              include: {
                game: true,
                communication_channel: true,
              },
            },
          },
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
      LoggerService.debug(
        `Synching ${activeRace.announcements.length} announcements for ${activeRace.id}`,
      );

      for (const announcement of activeRace.announcements) {
        LoggerService.debug(`Synching announcement ${announcement.id}`);

        // Must have a tracker
        if (!announcement.tracker) {
          LoggerService.error(
            `No tracker assigned to announcement with id ${announcement.id}`,
          );
          continue;
        }

        // Consider updates to no longer work if the they failed the previous 5 times
        if (announcement.failed_update_attempts > 5) {
          LoggerService.warn(
            `Announcement sync for id ${announcement.id} exceeded max failed update attempts`,
          );
          continue;
        }

        // Don't update the announcement if the race hasn't changed
        if (announcement.change_counter === activeRace.change_counter) {
          LoggerService.debug(
            `Change counter unchanged, skipping announcement`,
          );
          continue;
        }

        try {
          LoggerService.debug(`Updating announcement ${announcement.id}`);
          const originalMessage: ChatMessage = JSON.parse(
            announcement.previous_message,
          );

          // Don't even try to update a post if the bot is missing the permissions
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
            this.raceToRaceInformation(activeRace),
            activeRace.game.id !== announcement.tracker.game.id,
          );

          await this.prismaClient.announcement.update({
            where: {
              id: announcement.id,
            },
            data: {
              change_counter: activeRace.change_counter,
              failed_update_attempts: 0,
              previous_message: JSON.stringify(updatedMessage),
              last_updated: new Date(),
            },
          });
        } catch (err) {
          LoggerService.error(err);
          await this.prismaClient.announcement.update({
            where: {
              id: announcement.id,
            },
            data: {
              failed_update_attempts: announcement.failed_update_attempts + 1,
            },
          });
        }
      }

      // Don't announce races that are already finished or in an unknown state
      const disabledStates: RaceStatus[] = [
        'entry_open',
        'entry_closed',
        'invitational',
        'in_progress',
      ];
      if (disabledStates.includes(activeRace.status)) continue;

      // Races should be picked up within the first 3 updates by the announcer. This is just to prevent
      // announcements to be spammed in case  there's an oversight in the logic and/or network issue below
      // @TODO Add a transition state to either redis or mysql
      if (activeRace.change_counter > 3) continue;

      // Lookup which trackers still need an announcement
      const trackers = await this.prismaClient.tracker.findMany({
        where: {
          is_active: true,
          gameId: activeRace.game.id,
        },
        include: {
          communication_channel: true,
        },
      });

      const trackersWithoutAnnouncements = trackers.filter(
        (t) =>
          !activeRace.announcements.some(
            (a) => a.tracker != null && a.tracker.id === t.id,
          ),
      );

      // identifier: string;
      // serverIdentifier: string | null;
      // name: string | null;
      // serverName: string | null;
      // type: MessageChannelType;

      // Post announcements for the trackers
      for (const trackerWithoutAnnouncement of trackersWithoutAnnouncements) {
        try {
          const botHasRequiredPermissions =
            await this.connector.botHasRequiredPermissions(
              this.channelToChatChannel(
                trackerWithoutAnnouncement.communication_channel,
              ),
            );

          if (!botHasRequiredPermissions) continue;

          const postedAnnouncement = await this.connector.postRaceMessage(
            this.channelToChatChannel(
              trackerWithoutAnnouncement.communication_channel,
            ),
            this.raceToRaceInformation(activeRace),
          );

          await this.prismaClient.announcement.create({
            data: {
              uuid: v4(),
              change_counter: activeRace.change_counter,
              trackerId: trackerWithoutAnnouncement.id,
              previous_message: JSON.stringify(postedAnnouncement),
              failed_update_attempts: 0,
              last_updated: new Date(),
              raceId: activeRace.id,
            },
          });
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

          // Keep the job reserved for the specified time to ensure it's going to be released again
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
            // Remove the reservation for the announcement sync after 10 seconds
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
    this.initAnnouncementSyncJob();
    this.announcementSyncJob.start();
    await this.connector.connect(false);
  }

  /**
   * Frees used ressources and shuts down the tasks
   */
  public async dispose(): Promise<void> {
    await this.connector.dispose();
  }
}

export default AnnouncementWorker;
