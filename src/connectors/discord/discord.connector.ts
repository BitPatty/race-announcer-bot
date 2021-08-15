import * as Discord from 'discord.js';
import * as Joi from 'joi';

import {
  ChatChannel,
  ChatMessage,
  DestinationConnector,
  EntrantInformation,
  RaceInformation,
  ReactionReply,
  TextReply,
  TrackerListReply,
} from '../../models/interfaces';
import DestinationEventListenerMap from '../../models/interfaces/connectors/destination-event-listener-map.interface';

import {
  DestinationConnectorIdentifier,
  DestinationEvent,
  MessageChannelType,
  ReactionType,
  ReplyType,
  SourceConnectorIdentifier,
} from '../../models/enums';

import { TrackerEntity } from '../../models/entities';

import ConfigService from '../../core/config/config.service';
import LoggerService from '../../core/logger/logger.service';
import MessageBuilderUtils from '../../utils/message-builder.utils';

import DiscordCommandParser from './discord-command-parser';
import DiscordEmoji from './discord-emoji.enum';

class DiscordConnector
  implements DestinationConnector<DestinationConnectorIdentifier.DISCORD>
{
  private client?: Discord.Client;
  private _isReady = false;

  private readonly entrantDisplayLimitTrigger = 15;
  private readonly entrantDisplayLimitVariance = 2;

  /**
   * The event listeners mapped to this connector
   */
  private eventListeners: {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } = this.removeAllEventListeners();

  /**
   * Removes all event listeners from the connector
   * @returns The cleared event listener list
   */
  private removeAllEventListeners(): {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } {
    this.eventListeners = {
      [DestinationEvent.DISCONNECTED]: [],
      [DestinationEvent.COMMAND_RECEIVED]: [],
    };

    return this.eventListeners;
  }

  public get isReady(): boolean {
    return this._isReady;
  }

  public get connectorType(): DestinationConnectorIdentifier.DISCORD {
    return DestinationConnectorIdentifier.DISCORD;
  }

  /**
   * Checks if the bot has the necessary permissions
   * to post messages in the specified channel
   * @param channel The channel
   * @returns True if the bot has the permissions
   */
  public async botHasRequiredPermissions(
    channel: ChatChannel,
  ): Promise<boolean> {
    if (!this.client?.user) throw new Error('Bot user not set');
    const discordChannel = await this.findTextChannel(channel.identifier);
    if (!discordChannel) return false;

    const permissions = discordChannel.permissionsFor(this.client.user);
    if (!permissions) throw new Error('Failed to load permissions');

    if (!permissions.has('READ_MESSAGE_HISTORY')) return false;
    if (!permissions.has('SEND_MESSAGES')) return false;
    if (!permissions.has('VIEW_CHANNEL')) return false;
    if (!permissions.has('ADD_REACTIONS')) return false;
    if (!permissions.has('EMBED_LINKS')) return false;

    return true;
  }

  /**
   * Checks if the user has the permissions to use
   * bot commands in their guild
   * @param user The guild member
   * @returns True if the user has administrative permission
   */
  private canUseBotCommands(user: Discord.GuildMember): boolean {
    return (
      user.permissions.has('ADMINISTRATOR') ||
      ConfigService.discordGlobalAdmins.includes(user.id)
    );
  }

  /**
   * Checks whether the message mentions the bot
   * @param msg The message
   * @returns True if the bot is mentioned
   */
  private isBotMention(msg: Discord.Message): boolean {
    return this.client?.user != null && msg.mentions.has(this.client.user);
  }

  /**
   * Gets the listeners for the specified event type
   * @param type The event type
   * @returns The listeners mapped to the specified event
   */
  public getListeners<TEvent extends DestinationEvent>(
    type: TEvent,
  ): DestinationEventListenerMap[TEvent][] {
    return this.eventListeners[type] as DestinationEventListenerMap[TEvent][];
  }

  /**
   * Adds the specified listener to for the specified event type
   * @param type The event type
   * @param listener The listener function
   */
  public addEventListener<TEvent extends DestinationEvent>(
    type: TEvent,
    listener: DestinationEventListenerMap[TEvent],
  ): void {
    const listeners = this.getListeners(type);
    if (!listeners.includes(listener)) listeners.push(listener);
  }

  /**
   * Removes the specified event listener
   * @param type The event type the listener is mapped to
   * @param listener The listener function
   */
  public removeEventListener<TEvent extends DestinationEvent>(
    type: TEvent,
    listener?: DestinationEventListenerMap[TEvent],
  ): void {
    if (!listener) {
      this.eventListeners[type] = [];
      return;
    }

    const listeners = this.getListeners(type);
    if (listeners.includes(listener)) {
      listeners.splice(listeners.indexOf(listener), 1);
    }
  }

  /**
   * Attempts to find the specified message
   * @param channelId The channel in which the message is located
   * @param messageId The message identifier
   * @returns The message or null if it fails to load the message
   */
  private async findMessage(
    channelId: string,
    messageId: string,
  ): Promise<Discord.Message | null> {
    LoggerService.log(`Looking up message ${messageId} in  ${channelId}`);
    if (!this.client) return null;

    // Find the channel containing the message
    const channel = await this.findTextChannel(channelId);
    if (!channel) return null;

    // Find the message in the channel
    LoggerService.debug(`Fetching message ${messageId}`);
    const originalMessage = await channel.messages.fetch(messageId);

    // Check if the response actually matches
    if (
      !originalMessage ||
      originalMessage.id !== messageId ||
      !(originalMessage instanceof Discord.Message)
    ) {
      LoggerService.error(`Message ${messageId} not found`);
      return null;
    }

    LoggerService.debug(`Found message: ${JSON.stringify(originalMessage)}`);
    return originalMessage;
  }

  /**
   * Attempts to find the specified text channel
   * @param channelId The channel identifier
   * @returns The channel or null if it fails to load the channel
   */
  private async findTextChannel(
    channelId: string,
  ): Promise<Discord.TextChannel | null> {
    LoggerService.debug(`Looking up channel ${channelId}`);
    if (!this.client) return null;
    const channel = await this.client.channels.fetch(channelId);

    if (!channel) {
      LoggerService.error(`Couldn't find channel ${channelId}`);
      return null;
    }

    if (!(channel instanceof Discord.TextChannel)) {
      LoggerService.warn(`Found channel ${channelId} is not a text channel`);
      return null;
    }

    return channel;
  }

  /**
   * Finds a channel by its id
   * @param channelIdentifier The channel id
   * @returns The channel with the specified id
   */
  public async findChannel(
    channelIdentifier: string,
  ): Promise<ChatChannel | null> {
    const channel = await this.findTextChannel(channelIdentifier);
    if (!channel) return null;

    return {
      identifier: channel.id,
      serverIdentifier: channel.guild.id,
      name: channel.name,
      type: MessageChannelType.TEXT_CHANNEL,
    };
  }

  /**
   * Builds the embed for race updates on the
   * specified race
   * @param race The race
   * @returns The embed
   */
  private buildRaceEmbed(race: RaceInformation): Discord.MessageEmbed {
    let embed = new Discord.MessageEmbed()
      .setTitle(`Race room: ${race.identifier}`)
      .setColor(
        MessageBuilderUtils.getRaceStatusIndicatorColor(
          race.status,
        ) as Discord.HexColorString,
      )
      .addField('Game', MessageBuilderUtils.getGameText(race))
      .addField('Goal', MessageBuilderUtils.getGoalText(race))
      .setFooter(MessageBuilderUtils.getRaceStatusIndicatorText(race.status))
      .setTimestamp();

    // Only add the URL if it's a proper URL
    if (race.url && Joi.string().uri().validate(race.url).error == null)
      embed = embed.setURL(race.url);

    // List the entrants
    const entrantString = this.buildEntrantList(race.entrants);
    embed = embed.addField('Entrants', entrantString);

    return embed;
  }

  /**
   * Builds the embed displaying the tracker list
   * @param items The tracker list
   * @returns The embed containing the tracker list
   */
  private buildTrackerListEmbed(items: TrackerEntity[]): Discord.MessageEmbed {
    const embed = new Discord.MessageEmbed().setTitle('Active Trackers');

    if (items.length === 0)
      return embed.setDescription('No tracker registered');

    const activeTrackerList = items
      .filter((i) => i.isActive)
      .map(
        (i) =>
          `${i.game.name} (${i.game.connector}) in <#${i.channel.identifier}>`,
      )
      .sort((prev, next) => (prev < next ? -1 : 1))
      .join('\r\n');

    // Avoid hitting the embed limits
    // @TODO Find a better solution
    if (activeTrackerList.length > 4000)
      return embed.setDescription('Too many trackers to display');

    return embed.setDescription(activeTrackerList);
  }

  private buildEntrantList(entrants: EntrantInformation[]): string {
    if (entrants.length === 0) return '-';

    const sortedEntrants = MessageBuilderUtils.sortEntrants(entrants);

    // Hide entrants to avoid hitting the content
    // length limit but at the same time stay
    // consistent with the max number of entrants
    // being displayed
    const totalEntrants = sortedEntrants.length;
    const hiddenEntrantCount = totalEntrants - this.entrantDisplayLimitTrigger;

    const entrantList = sortedEntrants
      .map((e, idx) => {
        if (
          hiddenEntrantCount > this.entrantDisplayLimitVariance &&
          idx >= this.entrantDisplayLimitTrigger
        )
          return '';

        const statusText = MessageBuilderUtils.getEntrantStatusText(e);
        return `**${e.displayName}**: ${statusText}`;
      })
      .join('\r\n')
      .trim();

    return hiddenEntrantCount > this.entrantDisplayLimitVariance
      ? `${entrantList}\r\n*+${hiddenEntrantCount} more..*`
      : entrantList;
  }

  /**
   * Posts a race update to the specified channel
   * @param channel The channel in which the update should be posted
   * @param race The race
   * @returns The posted message
   */
  public async postRaceMessage(
    channel: ChatChannel,
    race: RaceInformation,
  ): Promise<ChatMessage | null> {
    if (!this.client) return null;

    const discordChannel = await this.findTextChannel(channel.identifier);
    if (!discordChannel)
      throw new Error(`Failed to fetch channel ${channel.identifier}`);

    const msg = await discordChannel.send({
      embeds: [this.buildRaceEmbed(race)],
    });

    return DiscordCommandParser.transformDiscordMessageToChatMessage(
      msg,
      this.client,
    );
  }

  /**
   * Updates the specified race message
   * @param originalPost The original chat message
   * @param race The race
   * @param hasGameChanged Pass true if the game is no
   * longer associated with the tracker
   * @returns The updated chat message
   */
  public async updateRaceMessage(
    originalPost: ChatMessage,
    race: RaceInformation,
    hasGameChanged: boolean,
  ): Promise<ChatMessage | null> {
    if (!this.client) return null;

    // Find the original message
    const originalMessage = await this.findMessage(
      originalPost.channel.identifier,
      originalPost.identifier,
    );
    if (!originalMessage) throw new Error('Failed to fetch original message');

    // Dont include the race details if the
    // game is not being tracked by the current tracker
    if (hasGameChanged) {
      const msg = await originalMessage.edit({
        embeds: [
          new Discord.MessageEmbed()
            .setTitle(`Race room: ${race.identifier}`)
            .setDescription(`*Game changed to ${race.game.name}*`),
        ],
      });
      return DiscordCommandParser.transformDiscordMessageToChatMessage(
        msg,
        this.client,
      );
    }

    // Update the message content
    const msg = await originalMessage.edit({
      content: null,
      embeds: [this.buildRaceEmbed(race)],
    });

    return DiscordCommandParser.transformDiscordMessageToChatMessage(
      msg,
      this.client,
    );
  }

  /**
   * Adds a reaction to the specified message
   * @param message The message
   * @param reactionType The reaction type
   */
  private async react(
    message: Discord.Message,
    reactionType: ReactionType,
  ): Promise<void> {
    switch (reactionType) {
      case ReactionType.POSITIVE:
        await message.react(DiscordEmoji.WHITE_CHECKMARK);
        break;
      case ReactionType.NEGATIVE:
        await message.react(DiscordEmoji.RED_X);
        break;
      case ReactionType.UNKNOWN_ACTION:
        await message.react(DiscordEmoji.RED_QUESTIONMARK);
        break;
    }
  }

  /**
   * Reply to the specified chat message
   * @param to The message to reply to
   * @param msg The message content
   */
  public async reply(
    to: ChatMessage,
    content:
      | Discord.MessageEmbed
      | TextReply
      | TrackerListReply
      | ReactionReply,
  ): Promise<void> {
    const originalMessage = await this.findMessage(
      to.channel.identifier,
      to.identifier,
    );

    if (
      !(content instanceof Discord.MessageEmbed) &&
      content.type === ReplyType.REACTION
    ) {
      if (!originalMessage)
        LoggerService.error('Cannot react, original message not found');
      else await this.react(originalMessage, content.reaction);
      return;
    }

    const messageContent = ((): Discord.MessageOptions => {
      switch (content.type) {
        case ReplyType.TEXT:
          return {
            content: (content as TextReply).message,
          };
        case ReplyType.TRACKER_LIST:
          return {
            embeds: [
              this.buildTrackerListEmbed((content as TrackerListReply).items),
            ],
          };
        default:
          if (content instanceof Discord.MessageEmbed)
            return {
              embeds: [content],
            };
          throw new Error('Invalid message type');
      }
    })();

    if (originalMessage) {
      LoggerService.debug(`Replying to ${originalMessage.id}`);
      await originalMessage.reply(messageContent);
      return;
    }

    LoggerService.error('Failed to fetch original message => using mention');
    const channel = await this.findTextChannel(to.channel.identifier);
    if (!channel) {
      LoggerService.error('Failed to fetch channel');
      return;
    }

    await channel.send({
      ...messageContent,
      content: `<@${to.author.identifier}>\r\n${messageContent.content}`,
    });
  }

  /**
   * Posts the help text as reply to the specified message
   * @param replyTo The original message
   */
  public async postHelpMessage(replyTo: ChatMessage): Promise<void> {
    LoggerService.debug(`Replying to ${JSON.stringify(replyTo)}`);
    if (!this.client) return;

    const originalMessage = await this.findMessage(
      replyTo.channel.identifier,
      replyTo.identifier,
    );

    if (!originalMessage) return;

    const embed = new Discord.MessageEmbed()
      .setTitle('Race Announcer Help')
      .setColor('#0390fc')
      .addField(
        'General Info',
        `
        Only users with the 'Administrator' permission on the server can use bot commands.

        Available Providers:
        - ${SourceConnectorIdentifier.SPEEDRUNSLIVE} (SpeedRunsLive)
        - ${SourceConnectorIdentifier.RACETIME_GG} (RacetimeGG)
        `,
      )
      .addField(
        'Adding a Tracker',
        `
        \`<@Bot Mention> track <provider> <slug> <#channel mention>\`

        Example usage: 
        <@${this.client.user?.id}> track racetime sms <#${originalMessage.channel.id}>

        This would add a tracker for Super Mario Sunshine on racetime to <#${originalMessage.channel.id}>.
        For SRL simply substitute \`racetime\` with \`srl\`.
        Note that you cannot track the same game in multiple channels.
        `,
      )
      .addField(
        'Removing a Tracker',
        `
        \`<@Bot Mention> untrack <provider> <slug>\`

        Example usage: 
        <@${this.client.user?.id}> untrack racetime oot

        This would remove the racetime OOT tracker 
        `,
      )
      .addField(
        'More information',
        `
        For detailed instructions visit https://github.com/BitPatty/RaceAnnouncerBot/wiki/Race-Announcer-Bot-Wiki.
        `,
      );

    await this.reply(
      DiscordCommandParser.transformDiscordMessageToChatMessage(
        originalMessage,
        this.client,
      ),
      embed,
    );
  }

  /**
   * Connect the bot to the discord chati
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const intents = [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      ];

      LoggerService.debug(`Using intents: ${JSON.stringify(intents)}`);

      this.client = new Discord.Client({
        intents,
      });

      this.client.on('debug', (msg) => {
        LoggerService.debug(`[Discord] Debug: ${msg}`);
      });

      this.client.on('ready', () => {
        LoggerService.log('[Discord] Ready');
        this._isReady = true;
        resolve();
      });

      this.client.on('message', async (msg) => {
        LoggerService.debug('[Discord] Received message');
        LoggerService.debug(msg.content);

        if (
          !this.client ||
          !this.isBotMention(msg) ||
          !msg.member ||
          !this.canUseBotCommands(msg.member)
        )
          return;

        LoggerService.log(`Received message => ${msg.content}`);
        const commandKey = DiscordCommandParser.parseCommandKey(msg);

        if (!commandKey) {
          LoggerService.error(`Failed to parse command key ${msg}`);
          await this.react(msg, ReactionType.UNKNOWN_ACTION);
          return;
        }

        const command = DiscordCommandParser.parseCommand(msg, this.client);
        if (!command) {
          LoggerService.error(`Failed to parse command ${msg}`);
          await this.react(msg, ReactionType.NEGATIVE);
          return;
        }

        this.eventListeners[DestinationEvent.COMMAND_RECEIVED].forEach((l) =>
          l(command),
        );
      });

      this.client.on('disconnect', () => {
        LoggerService.log('[Discord] Disconnected');
        this._isReady = false;
        this.eventListeners[DestinationEvent.DISCONNECTED].forEach((l) => l());
      });

      this.client.on('warn', (msg) => {
        LoggerService.warn(`[Discord] warning: ${msg}`);
      });

      this.client.on('error', (err) => {
        LoggerService.error(`[Discord] error: ${err}`);
        reject(err);
      });

      void this.client.login(ConfigService.discordToken);
    });
  }

  /**
   * Destroy the connector and cleanup
   * the resources
   */
  public dispose(): Promise<void> {
    this.removeAllEventListeners();
    if (!this.client) return Promise.resolve();
    this.client.destroy();
    this.client = undefined;
    return Promise.resolve();
  }
}

export default DiscordConnector;
