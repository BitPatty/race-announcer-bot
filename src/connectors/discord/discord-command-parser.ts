import * as Discord from 'discord.js';

import {
  AddTrackerCommand,
  ChatMessage,
  HelpCommand,
  ListTrackersCommand,
  RemoveTrackerCommand,
} from '../../models/interfaces';

import {
  CommandType,
  MessageChannelType,
  SourceConnectorIdentifier,
} from '../../models/enums';

import { parseEnumValue } from '../../utils/enum.utils';
import LoggerService from '../../core/logger/logger.service';

import DiscordCommandKey from './discord-command-key.enum';

class DiscordCommandParser {
  /**
   * Parse the type of channel in which
   * the specifie message was posted
   * @param msg The message
   * @returns The channel type
   */
  public static parseChannelType(msg: Discord.Message): MessageChannelType {
    switch (msg.channel.type) {
      case 'DM':
        return MessageChannelType.DIRECT_MESSAGE;
      case 'GUILD_TEXT':
        return MessageChannelType.TEXT_CHANNEL;
      default:
        return MessageChannelType.OTHER;
    }
  }

  /**
   * Transforms a @see Discord.Message to a @see ChatMessage
   * @param msg The discord message
   * @returns The transformed chat message
   */
  public static transformDiscordMessageToChatMessage(
    msg: Discord.Message,
    client: Discord.Client,
  ): ChatMessage {
    return {
      identifier: msg.id,
      channel: {
        name: msg.channel.type !== 'DM' ? msg.channel.name : undefined,
        identifier: msg.channel.id,
        serverIdentifier: msg.guild?.id ?? null,
        type: this.parseChannelType(msg),
      },
      author: {
        identifier: msg.author.id,
        displayName: msg.author.username,
        isBotOwner: false,
        canUseBotCommands: true,
      },
      isBotMention: msg.mentions.users.some((m) => m.id === client.user?.id),
      content: msg.content,
      cleanContent: msg.cleanContent,
    };
  }

  /**
   * Removes all mentions from a raw discord message
   * @param msg The message content
   * @returns The message without mentions
   */
  private static removeMentions(msg: string): string {
    return msg
      .replace(/<(?:@!|#)[0-9]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parses the command key from a raw discord message
   * @param msg The message content
   * @returns The command key or NULL if it's not a valid key
   */
  public static parseCommandKey(
    msg: Discord.Message,
  ): DiscordCommandKey | null {
    const cleanMsg = this.removeMentions(msg.content);
    if (cleanMsg.split(' ').length === 0) return null;

    return parseEnumValue(
      DiscordCommandKey,
      cleanMsg.split(' ')[0],
    ) as DiscordCommandKey;
  }

  /**
   * Parses a tracker addition request
   * @param msg The message content
   * @param client The discord client
   * @returns The parsed request or NULL if it's not in a valid format
   */
  private static parseAddTrackerCommand(
    msg: Discord.Message,
    client: Discord.Client,
  ): AddTrackerCommand | null {
    if (msg.mentions.channels.size !== 1) return null;

    const channelMention = msg.mentions.channels.first() as Discord.TextChannel;

    const messageWithoutMentions = this.removeMentions(msg.content);
    if (messageWithoutMentions.split(' ').length !== 3) return null;

    const [, rawSourceIdentifier, gameIdentifier] =
      messageWithoutMentions.split(' ');

    const sourceIdentifier = parseEnumValue(
      SourceConnectorIdentifier,
      rawSourceIdentifier,
    ) as SourceConnectorIdentifier;

    if (!sourceIdentifier) return null;

    const cmd: AddTrackerCommand = {
      type: CommandType.ADD_TRACKER,
      gameIdentifier,
      sourceIdentifier: sourceIdentifier as SourceConnectorIdentifier,
      targetChannelIdentifier: channelMention.id,
      message: this.transformDiscordMessageToChatMessage(msg, client),
    };

    return cmd;
  }

  private static parseRemoveTrackerCommand(
    msg: Discord.Message,
    client: Discord.Client,
  ): RemoveTrackerCommand | null {
    const messageWithoutMentions = this.removeMentions(msg.content);
    if (messageWithoutMentions.split(' ').length !== 3) return null;

    const [, rawSourceIdentifier, gameIdentifier] =
      messageWithoutMentions.split(' ');

    const sourceIdentifier = parseEnumValue(
      SourceConnectorIdentifier,
      rawSourceIdentifier,
    ) as SourceConnectorIdentifier;

    if (!sourceIdentifier) return null;

    const cmd: RemoveTrackerCommand = {
      type: CommandType.REMOVE_TRACKER,
      gameIdentifier,
      sourceIdentifier: sourceIdentifier as SourceConnectorIdentifier,
      message: this.transformDiscordMessageToChatMessage(msg, client),
      channelIdentifier: msg.channel.id,
      serverIdentifier: msg.guild?.id ?? null,
    };

    return cmd;
  }

  public static parseListTrackersCommand(
    msg: Discord.Message,
    client: Discord.Client,
  ): ListTrackersCommand | null {
    const cmd: ListTrackersCommand = {
      type: CommandType.LIST_TRACKERS,
      message: this.transformDiscordMessageToChatMessage(msg, client),
      channelIdentifier: msg.channel.id,
      serverIdentifier: msg.guild?.id ?? null,
    };

    return cmd;
  }

  private static parseHelpCommand(
    msg: Discord.Message,
    client: Discord.Client,
  ): HelpCommand {
    return {
      type: CommandType.HELP,
      message: this.transformDiscordMessageToChatMessage(msg, client),
    };
  }

  public static parseCommand(
    msg: Discord.Message,
    client: Discord.Client,
  ):
    | AddTrackerCommand
    | RemoveTrackerCommand
    | ListTrackersCommand
    | HelpCommand
    | null {
    const commandKey = this.parseCommandKey(msg);
    LoggerService.log(`Parsing ${commandKey}`);

    switch (commandKey) {
      case DiscordCommandKey.HELP:
        return this.parseHelpCommand(msg, client);
      case DiscordCommandKey.ADD_TRACKER:
        return this.parseAddTrackerCommand(msg, client);
      case DiscordCommandKey.REMOVE_TRACKER:
        return this.parseRemoveTrackerCommand(msg, client);
      case DiscordCommandKey.LIST_TRACKERS:
        return this.parseListTrackersCommand(msg, client);
      default:
        return null;
    }
  }
}

export default DiscordCommandParser;
