import { Connection, Like } from 'typeorm';

import {
  AddTrackerCommand,
  DestinationConnector,
  HelpCommand,
  ListTrackersCommand,
  RemoveTrackerCommand,
} from '../../models/interfaces';
import {
  CommandType,
  DestinationConnectorIdentifier,
  DestinationEvent,
  ReplyType,
  TaskIdentifier,
} from '../../models/enums';
import {
  CommunicationChannelEntity,
  GameEntity,
  TrackerEntity,
} from '../../models/entities';

import ConfigService from '../config/config.service';
import DatabaseService from '../database/database-service';
import DiscordConnector from '../../connectors/discord/discord.connector';
import LoggerService from '../logger/logger.service';
import RedisService from '../redis/redis-service';
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

  /**
   * Registers/Updates a tracker for the specified server/channel
   * @param cmd The tracker specification
   * @returns The newly created tracker or NULL if a condition failed
   */
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
          connector: Like(this.connector.connectorType),
        },
      });

    const databaseChannel = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .save({
        ...new CommunicationChannelEntity({
          identifier: channel.identifier,
          serverIdentifier: channel.serverIdentifier,
          connector: this.connector.connectorType,
          permissionCheckSuccessful: hasPermissions,
          isActive: true,
          type: channel.type,
        }),
        ...(existingDatabaseChannel ?? {}),
      });

    return this.trackerService.addTracker(databaseChannel, game);
  }

  /**
   * Removes (disables) a tracker if there is a match on the specified
   * server or in the current channel
   * @param cmd The removal command
   */
  private async removeTracker(cmd: RemoveTrackerCommand): Promise<void> {
    // Get all trackers available in the current context
    const trackers = cmd.serverIdentifier
      ? await this.trackerService.findTrackersByServer(cmd.serverIdentifier)
      : await this.trackerService.findTrackersByChannel(cmd.channelIdentifier);

    // Find a tracker which matches the conditions
    const tracker = trackers.find(
      (t) =>
        t.isActive &&
        t.game.abbreviation?.toLowerCase() ===
          cmd.gameIdentifier.toLowerCase() &&
        t.game.connector === cmd.sourceIdentifier,
    );

    LoggerService.log(
      `Disabling tracker with id ${tracker?.id} ${
        trackers.length
      } ${JSON.stringify(trackers)}`,
    );

    // If the tracker exists, disable it
    if (tracker) await this.trackerService.disableTracker(tracker);
  }

  private async runCommand(
    cmd:
      | AddTrackerCommand
      | RemoveTrackerCommand
      | ListTrackersCommand
      | HelpCommand,
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
        break;
      }
      case CommandType.HELP: {
        await this.connector.postHelpMessage(cmd.message);
        break;
      }
    }
  }

  /**
   * Starts the worker
   */
  public async start(): Promise<void> {
    this.databaseConnection = await DatabaseService.getConnection();
    this.trackerService = new TrackerService(this.databaseConnection);

    this.connector.addEventListener(
      DestinationEvent.COMMAND_RECEIVED,
      async (msg) => {
        LoggerService.log(`Received message: ${msg.message.content}`);
        const reservedForCurrentInstance = await RedisService.tryReserveTask(
          TaskIdentifier.MESSAGE_HANDLER,
          msg.message.identifier,
          ConfigService.instanceUuid,
          3600,
        );

        if (reservedForCurrentInstance) await this.runCommand(msg);
      },
    );
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

export default ChatWorker;
