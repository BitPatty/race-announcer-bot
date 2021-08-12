import { Connection, MoreThan } from 'typeorm';
import { CronJob } from 'cron';

import {
  AnnouncementEntity,
  EntrantEntity,
  GameEntity,
  RaceEntity,
  TrackerEntity,
} from '../../models/entities';

import {
  ChatMessage,
  DestinationConnector,
  RaceInformation,
} from '../../models/interfaces';

import {
  DestinationConnectorIdentifier,
  RaceStatus,
  TaskIdentifier,
} from '../../models/enums';

import ConfigService from '../config/config.service';
import DatabaseService from '../database/database-service';
import LoggerService from '../logger/logger.service';
import RedisService from '../redis/redis-service';
import TrackerService from '../tracker/tracker.service';

import DateTimeUtils from '../../utils/date-time.utils';
import DiscordConnector from '../../connectors/discord/discord.connector';

import Worker from './worker.interface';

class AnnouncementWorker<T extends DestinationConnectorIdentifier>
  implements Worker
{
  private readonly connector: DestinationConnector<T>;
  private databaseConnection: Connection;
  private announcementSyncJob: CronJob;
  private trackerService: TrackerService;

  public constructor(connector: T) {
    switch (connector) {
      case DestinationConnectorIdentifier.DISCORD:
        this.connector =
          new DiscordConnector() as unknown as DestinationConnector<T>;
        return;
      default:
        throw new Error(`Invalid destination connector ${connector}`);
    }
  }

  private raceEntityToRaceInformation(
    race: RaceEntity,
    entrants: EntrantEntity[],
  ): RaceInformation {
    return {
      ...race,
      entrants: entrants.map((e) => ({
        ...e,
        displayName: e.racer.displayName,
      })),
    };
  }

  private getActiveRaces(): Promise<RaceEntity[]> {
    return this.databaseConnection.getRepository(RaceEntity).find({
      relations: [nameof<RaceEntity>((r) => r.game)],
      where: {
        lastSyncAt: MoreThan(DateTimeUtils.subtractHours(new Date(), 6)),
      },
    });
  }

  private getAnnouncementsForRace(
    race: RaceEntity,
  ): Promise<AnnouncementEntity[]> {
    return this.databaseConnection.getRepository(AnnouncementEntity).find({
      relations: [
        nameof<AnnouncementEntity>((a) => a.tracker),
        nameof<AnnouncementEntity>((a) => a.race),
      ],
      where: {
        race,
      },
    });
  }

  private getRaceEntrants(race: RaceEntity): Promise<EntrantEntity[]> {
    return this.databaseConnection.getRepository(EntrantEntity).find({
      relations: [nameof<EntrantEntity>((e) => e.racer)],
      where: {
        race,
      },
    });
  }

  private findTrackersForGame(game: GameEntity): Promise<TrackerEntity[]> {
    return this.databaseConnection.getRepository(TrackerEntity).find({
      relations: [nameof<TrackerEntity>((e) => e.channel)],
      where: {
        game,
        channel: {
          connector: this.connector.connectorType,
        },
      },
    });
  }

  private async updateAnnouncements(): Promise<void> {
    LoggerService.log(`Updating announcements`);
    const activeRaces = await this.getActiveRaces();

    LoggerService.log(`Scanning ${activeRaces.length} active races`);

    for (const activeRace of activeRaces) {
      const activeAnnouncements = await this.getAnnouncementsForRace(
        activeRace,
      );

      LoggerService.log(
        `Synching ${activeAnnouncements.length} announcements for ${activeRace.id}`,
      );

      const entrants = await this.getRaceEntrants(activeRace);

      for (const activeAnnouncement of activeAnnouncements) {
        LoggerService.log(`Synching announcement ${activeAnnouncement.id}`);

        if (activeAnnouncement.failedUpdateAttempts > 5) {
          LoggerService.debug(
            'Announcement sync exceeded max failed update attempts',
          );
          continue;
        }

        if (activeAnnouncement.changeCounter === activeRace.changeCounter) {
          LoggerService.debug(
            `Change counter unchanged, skipping announcement`,
          );
          continue;
        }

        try {
          LoggerService.debug(`Fetching original announcement`);
          const originalMessage: ChatMessage = JSON.parse(
            activeAnnouncement.previousMessage,
          );

          const botHasRequiredPermissions =
            await this.connector.botHasRequiredPermissions(
              originalMessage.channel,
            );

          if (!botHasRequiredPermissions) continue;

          const updatedMessage = await this.connector.updateRaceMessage(
            originalMessage,
            this.raceEntityToRaceInformation(activeRace, entrants),
          );

          activeAnnouncement.changeCounter = activeRace.changeCounter;
          activeAnnouncement.failedUpdateAttempts = 0;
          activeAnnouncement.previousMessage = JSON.stringify(updatedMessage);
          activeAnnouncement.lastUpdated = new Date();

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

      if (
        ![
          RaceStatus.ENTRY_OPEN,
          RaceStatus.ENTRY_CLOSED,
          RaceStatus.IN_PROGRESS,
        ].includes(activeRace.status)
      )
        continue;
      if (activeRace.changeCounter > 3) continue;

      const trackers = await this.findTrackersForGame(activeRace.game);
      const trackersWithoutAnnouncements = trackers.filter(
        (t) => !activeAnnouncements.some((a) => a.tracker.id === t.id),
      );

      for (const trackerWithoutAnnouncement of trackersWithoutAnnouncements) {
        try {
          const botHasRequiredPermissions =
            await this.connector.botHasRequiredPermissions(
              trackerWithoutAnnouncement.channel,
            );

          if (!botHasRequiredPermissions) continue;

          const postedAnnouncement = await this.connector.postRaceMessage(
            trackerWithoutAnnouncement.channel,
            this.raceEntityToRaceInformation(activeRace, entrants),
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

  private initAnnouncementSyncJob(): void {
    this.announcementSyncJob = new CronJob(
      ConfigService.announcementSyncInterval,
      async () => {
        try {
          LoggerService.log('Attempting to reserve announcement sync job');
          const reservedByCurrentInstance = await RedisService.tryReserveTask(
            TaskIdentifier.ANNOUNCEMENT_SYNC,
            this.connector.connectorType,
            ConfigService.instanceUuid,
            60,
          );

          if (!reservedByCurrentInstance) {
            LoggerService.log(`Could not reserve annoucement sync job`);
            return;
          }

          try {
            await this.updateAnnouncements();
          } catch (err) {
            LoggerService.error(err);
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

            throw err;
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
    this.trackerService = new TrackerService(this.databaseConnection);
    this.initAnnouncementSyncJob();
    this.announcementSyncJob.start();
    return this.connector.connect();
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
