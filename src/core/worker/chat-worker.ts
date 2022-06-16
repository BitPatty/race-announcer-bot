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

import { v4 } from 'uuid';

import {
  AddTrackerCommand,
  DestinationConnector,
  HelpCommand,
  ListTrackersCommand,
  ReactionReply,
  RemoveTrackerCommand,
  TextReply,
  TrackerListReply,
} from '../../models/interfaces';

import {
  BotCommandType,
  DestinationEvent,
  MessageChannelType,
  ReactionType,
  ReplyType,
  TaskIdentifier,
  WorkerType,
} from '../../models/enums';

import DestinationConnectorIdentifier from '../../connectors/destination-connector-identifier.enum';

import ConfigService from '../config/config.service';
import LoggerService from '../logger/logger.service';
import RedisService from '../redis/redis-service';

import {
  CommunicationChannel,
  Game,
  PrismaClient,
  Tracker,
} from '@prisma/client';
import { prisma } from '../../prisma';

import Worker from './worker.interface';
import enabledWorkers from '../../enabled-workers';

class ChatWorker<T extends DestinationConnectorIdentifier> implements Worker {
  private readonly connector: DestinationConnector<T>;
  private prismaClient: PrismaClient;

  public constructor(connector: T) {
    const worker = enabledWorkers.find((w) => {
      return w.connector === connector && w.types.includes(WorkerType.CHAT);
    });

    if (!worker) throw new Error(`Invalid chat connector ${connector}`);
    this.connector = new worker.ctor() as unknown as DestinationConnector<T>;
    this.prismaClient = prisma;
  }

  private async createOrUpdateChannel(channel: {
    name: string | null;
    identifier: string;
    serverIdentifier: string | null;
    serverName: string | null;
    type: MessageChannelType;
  }): Promise<[CommunicationChannel | null, CommunicationChannel]> {
    const existingDatabaseChannel =
      await this.prismaClient.communicationChannel.findFirst({
        where: {
          identifier: channel.identifier,
          connector: this.connector.connectorType,
        },
      });

    if (existingDatabaseChannel) {
      return [
        existingDatabaseChannel,
        await this.prismaClient.communicationChannel.update({
          where: {
            id: existingDatabaseChannel.id,
          },
          data: {
            name: channel.name ?? null,
            identifier: channel.identifier,
            server_identifier: channel.serverIdentifier,
            server_name: channel.serverName,
            connector: this.connector.connectorType,
            is_active: true,
            type: channel.type,
          },
        }),
      ];
    }

    return [
      existingDatabaseChannel,
      await this.prismaClient.communicationChannel.create({
        data: {
          uuid: v4(),
          name: channel.name ?? null,
          identifier: channel.identifier,
          server_identifier: channel.serverIdentifier,
          server_name: channel.serverName,
          connector: this.connector.connectorType,
          is_active: true,
          type: channel.type,
        },
      }),
    ];
  }

  /**
   * Registers/Updates a tracker for the specified server/channel
   *
   * @param cmd  The tracker specification
   * @returns    The newly created tracker or NULL if a condition failed
   */
  private async addTracker(cmd: AddTrackerCommand): Promise<Tracker | null> {
    const game = await this.prismaClient.game.findFirst({
      where: {
        abbreviation: cmd.gameIdentifier,
        connector: cmd.sourceIdentifier,
      },
    });

    if (!game) return null;

    const sourceChannel = await this.connector.findChannel(
      cmd.targetChannelIdentifier,
    );
    if (!sourceChannel) return null;

    const [, channel] = await this.createOrUpdateChannel({
      name: sourceChannel.name,
      identifier: sourceChannel.identifier,
      serverIdentifier: sourceChannel.serverIdentifier,
      serverName: sourceChannel.serverName,
      type: sourceChannel.type,
    });

    const existingTrackerOnSameServer =
      await this.prismaClient.tracker.findFirst({
        where: {
          communication_channel: {
            server_identifier: sourceChannel.serverIdentifier,
          },
          gameId: game.id,
        },
      });

    if (existingTrackerOnSameServer) {
      // If the tracker is already active on this channel, return
      if (
        existingTrackerOnSameServer.channelId === channel.id &&
        existingTrackerOnSameServer.is_active
      )
        return existingTrackerOnSameServer;

      // Else if the tracker is disabled, enable it
      if (existingTrackerOnSameServer.channelId === channel.id)
        return this.prismaClient.tracker.update({
          where: {
            id: existingTrackerOnSameServer.id,
          },
          data: {
            is_active: true,
          },
        });

      // Else disable it
      await this.prismaClient.tracker.update({
        where: {
          id: existingTrackerOnSameServer.id,
        },
        data: {
          is_active: false,
        },
      });
    }

    // Create a new tracker
    return this.prismaClient.tracker.create({
      data: {
        uuid: v4(),
        channelId: channel.id,
        gameId: game.id,
        is_active: true,
      },
    });
  }

  private listTrackersByIdentifier(
    identifier: string,
    server = true,
  ): Promise<
    (Tracker & {
      game: Game;
      communication_channel: CommunicationChannel;
    })[]
  > {
    return this.prismaClient.tracker.findMany({
      where: {
        communication_channel: server
          ? {
              server_identifier: identifier,
            }
          : {
              identifier,
            },
      },
      include: {
        game: true,
        communication_channel: true,
      },
    });
  }

  /**
   * Removes (disables) a tracker if there is a match on the specified
   * server or in the current channel
   *
   * @param cmd  The removal command
   */
  private async removeTracker(cmd: RemoveTrackerCommand): Promise<void> {
    // Get all trackers available in the current context
    const trackers = await this.listTrackersByIdentifier(
      cmd.serverIdentifier ?? cmd.message.channel.identifier,
      cmd.serverIdentifier != null,
    );

    // Find a tracker which matches the conditions
    const tracker = trackers.find(
      (t) =>
        t.is_active &&
        t.game.abbreviation?.toLowerCase() ===
          cmd.gameIdentifier.toLowerCase() &&
        t.game.connector === cmd.sourceIdentifier,
    );

    if (!tracker) {
      LoggerService.error(
        `Could not find a tracker matching the server_identifier ${cmd.serverIdentifier} / channel identifier ${cmd.message.channel.identifier}`,
      );
      return;
    }

    LoggerService.log(
      `Disabling tracker with id ${tracker?.id} ${
        trackers.length
      } ${JSON.stringify(trackers)}`,
    );

    await this.prismaClient.tracker.update({
      where: {
        id: tracker.id,
      },
      data: {
        is_active: false,
      },
    });
  }

  /**
   * Executes a chat command
   *
   * @param cmd  The command
   */
  private async executeCommand(
    cmd:
      | AddTrackerCommand
      | RemoveTrackerCommand
      | ListTrackersCommand
      | HelpCommand,
  ): Promise<void> {
    const reply = await (async (): Promise<
      TextReply | ReactionReply | TrackerListReply | void
    > => {
      switch (cmd.type) {
        case BotCommandType.ADD_TRACKER: {
          const tracker = await this.addTracker(cmd);

          if (tracker) {
            return {
              type: ReplyType.REACTION,
              reaction: ReactionType.POSITIVE,
            };
          }

          return {
            type: ReplyType.TEXT,
            message: `Could not add a tracker. Verify that the game with the slug '${cmd.gameIdentifier}' exists and try again.`,
          };
        }
        case BotCommandType.REMOVE_TRACKER: {
          await this.removeTracker(cmd);
          return {
            type: ReplyType.REACTION,
            reaction: ReactionType.POSITIVE,
          };
        }
        case BotCommandType.LIST_TRACKERS: {
          const trackers = await this.listTrackersByIdentifier(
            cmd.serverIdentifier ?? cmd.channelIdentifier,
            cmd.serverIdentifier != null,
          );

          return {
            type: ReplyType.TRACKER_LIST,
            items: trackers,
          };
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

        if (reservedForCurrentInstance) await this.executeCommand(msg);
      },
    );

    await this.connector.connect(true);
  }

  /**
   * Frees used ressources and shuts down the tasks
   */
  public async dispose(): Promise<void> {
    await this.connector.dispose();
  }
}

export default ChatWorker;
