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

import { Connection, Like } from 'typeorm';

import {
  AddTrackerCommand,
  DestinationConnector,
  HelpCommand,
  ListTrackersCommand,
  ReactionReply,
  RemoveTrackerCommand,
  TrackerListReply,
} from '../../../models/interfaces';

import {
  BotCommandType,
  DestinationConnectorIdentifier,
  DestinationEvent,
  ReactionType,
  ReplyType,
  TaskIdentifier,
  WorkerType,
} from '../../../models/enums';

import {
  CommunicationChannelEntity,
  GameEntity,
  TrackerEntity,
} from '../../../models/entities';

import ConfigService from '../../config/config.service';
import DatabaseService from '../../database/database-service';
import LoggerService from '../../logger/logger.service';
import RedisService from '../../redis/redis-service';
import TrackerService from './tracker.service';

import Worker from '../worker.interface';
import enabledWorkers from '../../../enabled-workers';

class ChatWorker<T extends DestinationConnectorIdentifier> implements Worker {
  private readonly connector: DestinationConnector<T>;
  private databaseConnection: Connection;
  private trackerService: TrackerService;

  public constructor(connector: T) {
    const worker = enabledWorkers.find((w) => {
      return w.connector === connector && w.types.includes(WorkerType.CHAT);
    });

    if (!worker) throw new Error(`Invalid chat connector ${connector}`);
    this.connector = new worker.ctor() as unknown as DestinationConnector<T>;
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
          name: channel.name ?? null,
          identifier: channel.identifier,
          serverIdentifier: channel.serverIdentifier,
          serverName: channel.serverName,
          connector: this.connector.connectorType,
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
      : await this.trackerService.findTrackersByChannel(
          cmd.message.channel.identifier,
        );

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
    const reply = await (async () => {
      switch (cmd.type) {
        case BotCommandType.ADD_TRACKER: {
          const tracker = await this.addTracker(cmd);
          return {
            type: ReplyType.REACTION,
            reaction:
              tracker == null ? ReactionType.NEGATIVE : ReactionType.POSITIVE,
          } as ReactionReply;
        }
        case BotCommandType.REMOVE_TRACKER: {
          await this.removeTracker(cmd);
          return {
            type: ReplyType.REACTION,
            reaction: ReactionType.POSITIVE,
          } as ReactionReply;
        }
        case BotCommandType.LIST_TRACKERS: {
          const trackers = cmd.serverIdentifier
            ? await this.trackerService.findTrackersByServer(
                cmd.serverIdentifier,
              )
            : await this.trackerService.findTrackersByChannel(
                cmd.channelIdentifier,
              );
          return {
            type: ReplyType.TRACKER_LIST,
            items: trackers,
          } as TrackerListReply;
        }
        case BotCommandType.HELP: {
          await this.connector.postHelpMessage(cmd.message);
          break;
        }
      }
    })();

    if (reply) await this.connector.reply(cmd.message, reply);
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
        LoggerService.log(`Received message: ${JSON.stringify(msg)}`);
        const reservedForCurrentInstance = await RedisService.tryReserveTask(
          TaskIdentifier.MESSAGE_HANDLER,
          `${this.connector.connectorType}_${msg.message.identifier}`,
          ConfigService.instanceUuid,
          3600,
        );

        if (reservedForCurrentInstance) await this.runCommand(msg);
      },
    );
    return this.connector.connect(true);
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
