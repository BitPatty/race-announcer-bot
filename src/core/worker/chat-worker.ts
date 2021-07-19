import { Connection, Like } from 'typeorm';

import {
  AddTrackerCommand,
  DestinationConnector,
  ListTrackersCommand,
  RemoveTrackerCommand,
} from '../../models/interfaces';
import {
  CommandType,
  DestinationConnectorIdentifier,
  DestinationEvent,
  ReplyType,
} from '../../models/enums';
import {
  CommunicationChannelEntity,
  GameEntity,
  TrackerEntity,
} from '../../models/entities';

import DatabaseService from '../database/database-service';
import DiscordConnector from '../../connectors/discord/discord.connector';
import LoggerService from '../logger/logger.service';
import TrackerService from '../tracker/tracker.service';
import Worker from './worker.interface';

class ChatWorker<T extends DestinationConnectorIdentifier> implements Worker {
  private readonly connector: DestinationConnector<T>;
  private databaseConnection: Connection;

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

  private async addTracker(
    cmd: AddTrackerCommand,
  ): Promise<TrackerEntity | null> {
    const game = await this.databaseConnection
      .getRepository(GameEntity)
      .findOne({
        where: {
          abbreviation: Like(cmd.gameIdentifier),
          connector: Like(cmd.sourceIdentifier),
        },
      });

    if (!game) return null;

    const channel = await this.connector.findChannel(
      cmd.targetChannelIdentifier,
    );

    if (!channel) return null;

    const hasPermissions = await this.connector.botHasRequiredPermissions(
      channel,
    );

    const existingDatabaseChannel = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .findOne({
        where: {
          identifier: Like(cmd.targetChannelIdentifier),
          connector: Like(cmd.sourceIdentifier),
        },
      });

    const databaseChannel = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .save({
        ...(existingDatabaseChannel ?? {}),
        ...new CommunicationChannelEntity({
          identifier: channel.identifier,
          serverIdentifier: channel.serverIdentifier,
          connector: this.connector.connectorType,
          permissionCheckSuccessful: hasPermissions,
          isActive: true,
        }),
      });

    return this.trackerService.addTracker(databaseChannel, game);
  }

  private async removeTracker(cmd: RemoveTrackerCommand): Promise<void> {
    const trackers = await (() =>
      cmd.serverIdentifier
        ? this.trackerService.findTrackersByServer(cmd.serverIdentifier)
        : this.trackerService.findTrackersByChannel(cmd.channelIdentifier))();

    const tracker = trackers.find(
      (t) =>
        t.game.identifier.toLowerCase() === cmd.gameIdentifier.toLowerCase(),
    );

    if (tracker) {
      await this.trackerService.disableTracker(tracker.channel, tracker.game);
    }
  }

  private async runCommand(
    cmd: AddTrackerCommand | RemoveTrackerCommand | ListTrackersCommand,
  ): Promise<void> {
    switch (cmd.type) {
      case CommandType.ADD_TRACKER: {
        const tracker = await this.addTracker(cmd);
        await this.connector.reply(cmd.message, {
          type: ReplyType.TEXT,
          message:
            tracker == null
              ? 'Oops'
              : `Added a tracker for ${tracker.game.name}`,
        });
        break;
      }
      case CommandType.REMOVE_TRACKER: {
        await this.removeTracker(cmd);
        await this.connector.reply(cmd.message, {
          type: ReplyType.TEXT,
          message: 'ok',
        });
        break;
      }
      case CommandType.LIST_TRACKERS: {
        const trackers = cmd.serverIdentifier
          ? await this.trackerService.findTrackersByServer(cmd.serverIdentifier)
          : await this.trackerService.findTrackersByChannel(
              cmd.channelIdentifier,
            );
        await this.connector.reply(cmd.message, {
          type: ReplyType.TRACKER_LIST,
          items: trackers,
        });
      }
    }
  }

  public async start(): Promise<void> {
    this.databaseConnection = await DatabaseService.getConnection();
    this.trackerService = new TrackerService(this.databaseConnection);

    this.connector.addEventListener(
      DestinationEvent.COMMAND_RECEIVED,
      async (msg) => {
        LoggerService.log(`Received message: ${msg.message.content}`);
        await this.runCommand(msg);
      },
    );
    return this.connector.connect();
  }

  public dispose(): Promise<void> {
    return this.connector.dispose();
  }
}

export default ChatWorker;
