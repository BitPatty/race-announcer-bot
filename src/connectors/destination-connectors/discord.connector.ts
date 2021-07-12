import {
  ChatChannel,
  ChatServer,
  DestinationConnector,
  Race,
} from '../../domain/interfaces';
import {
  DestinationConnectorIdentifier,
  DestinationEvent,
  MessageChannelType,
} from '../../domain/enums';

import * as Discord from 'discord.js';
import * as Joi from 'joi';

import ChatMessage from '../../domain/interfaces/chat-message.interface';
import DestinationEventListenerMap from '../../domain/interfaces/destination-event-listener-map.interface';

import ConfigService from '../../infrastructure/config/config.service';
import MessageBuilderUtils from '../../utils/message-builder.utils';

class DiscordConnector
  implements DestinationConnector<DestinationConnectorIdentifier.DISCORD>
{
  private client?: Discord.Client;
  private _isReady = false;

  /**
   * The event listeners mapped to this connector
   */
  private _eventListeners: {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } = this.removeAllEventListeners();

  /**
   * Removes all event listeners from the connector
   * @returns The cleared event listener list
   */
  private removeAllEventListeners(): {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } {
    this._eventListeners = {
      [DestinationEvent.DISCONNECTED]: [],
      [DestinationEvent.COMMAND_RECEIVED]: [],
      [DestinationEvent.ERROR]: [],
    };

    return this._eventListeners;
  }

  public get isReady(): boolean {
    return this._isReady;
  }

  public get connectorType(): DestinationConnectorIdentifier.DISCORD {
    return DestinationConnectorIdentifier.DISCORD;
  }

  /**
   * Gets the listeners for the specified event type
   * @param type The event type
   * @returns The listeners mapped to the specified event
   */
  public getListeners<TEvent extends DestinationEvent>(
    type: TEvent,
  ): DestinationEventListenerMap[TEvent][] {
    return this._eventListeners[type] as DestinationEventListenerMap[TEvent][];
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
      this._eventListeners[type] = [];
      return;
    }

    const listeners = this.getListeners(type);
    if (listeners.includes(listener)) {
      listeners.splice(listeners.indexOf(listener), 1);
    }
  }

  /**
   * Parse the type of channel in which
   * the specifie message was posted
   * @param msg The message
   * @returns The channel type
   */
  private parseChannelType(msg: Discord.Message): MessageChannelType {
    switch (msg.channel.type) {
      case 'dm':
        return MessageChannelType.DIRECT_MESSAGE;
      case 'text':
        return MessageChannelType.CHANNEL_MESSAGE;
      default:
        return MessageChannelType.OTHER;
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
    if (!this.client) return null;
    const channel = await this.findTextChannel(channelId);
    if (!channel) return null;

    const [[, originalMessage]] = await channel.messages.fetch({
      around: messageId,
      limit: 1,
    });

    if (
      !originalMessage ||
      originalMessage.id !== messageId ||
      !(originalMessage instanceof Discord.Message)
    ) {
      return null;
    }

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
    if (!this.client) return null;
    const channel = await this.client.channels.fetch(channelId);
    if (!channel) return null;

    if (!(channel instanceof Discord.TextChannel)) {
      console.warn(`Found channel ${channelId}, but it is not a text channel`);
      return null;
    }

    return channel;
  }

  /**
   * Transforms a @see Discord.Message to a @see ChatMessage
   * @param msg The discord message
   * @returns The transformed chat message
   */
  private transformDiscordMessageToChatMessage(
    msg: Discord.Message,
  ): ChatMessage {
    return {
      identifier: msg.id,
      server: {
        identifier: msg.guild?.id,
        name: msg.guild?.name,
      },
      channel: {
        name: msg.channel.type !== 'dm' ? msg.channel.name : undefined,
        identifier: msg.channel.id,
        type: this.parseChannelType(msg),
      },
      author: {
        identifier: msg.author.id,
        displayName: msg.author.username,
        isBotOwner: false,
        canUseBotCommands: true,
      },
      isBotMention: msg.mentions.users.some(
        (m) => m.id === this.client?.user?.id,
      ),
      content: msg.content,
      cleanContent: msg.cleanContent,
    };
  }

  /**
   * Builds the embed for race updates on the
   * specified race
   * @param race The race
   * @returns The embed
   */
  private buildRaceEmbed(race: Race): Discord.MessageEmbed {
    let embed = new Discord.MessageEmbed()
      .setTitle(`Race room: ${race.identifier}`)
      .setColor(MessageBuilderUtils.getRaceStatusIndicatorColor(race.status))
      .addField(
        MessageBuilderUtils.getGameTitle(),
        MessageBuilderUtils.getGameText(race),
      )
      .addField(
        MessageBuilderUtils.getGoalTitle(),
        MessageBuilderUtils.getGoalText(race),
      )
      .setFooter(MessageBuilderUtils.getRaceStatusIndicatorText(race.status))
      .setTimestamp();

    // Only add the URL if it's a proper URL
    if (race.url && Joi.string().uri().validate(race.url).error == null)
      embed = embed.setURL(race.url);

    // Set the cover as thumbnail if it exists
    if (
      race.game.imageUrl &&
      Joi.string().uri().validate(race.game.imageUrl).error == null
    )
      embed = embed.setThumbnail(race.game.imageUrl);

    // List the entrants
    const entrantString =
      race.entrants.length === 0
        ? '-'
        : MessageBuilderUtils.sortEntrants(race.entrants ?? [])
            .map((e) =>
              MessageBuilderUtils.getEntrantStatusText(e).replace(
                e.displayName,
                `**${e.displayName}**`,
              ),
            )
            .join('\r\n');

    embed = embed.addField(
      MessageBuilderUtils.getEntrantsTitle(),
      entrantString,
    );

    return embed;
  }

  /**
   * Posts a race update to the specified channel
   * @param channel The channel in which the update should be posted
   * @param race The race
   * @returns The posted message
   */
  public async postRaceMessage(
    _: ChatServer,
    channel: ChatChannel,
    race: Race,
  ): Promise<ChatMessage | null> {
    if (!this.client) return null;

    const discordChannel = await this.findTextChannel(channel.identifier);
    if (!discordChannel) {
      console.error('Failed to fetch channel', discordChannel);
      return null;
    }

    const embed = this.buildRaceEmbed(race);
    const msg = await discordChannel.send(embed);
    return this.transformDiscordMessageToChatMessage(msg);
  }

  /**
   * Updates the specified race message
   * @param originalPost The original chat message
   * @param race The race
   * @returns The updated chat message
   */
  public async updateRaceMessage(
    originalPost: ChatMessage,
    race: Race,
  ): Promise<ChatMessage | null> {
    if (!this.client) return null;
    const originalMessage = await this.findMessage(
      originalPost.channel.identifier,
      originalPost.identifier,
    );

    if (!originalMessage) {
      console.error('Failed to fetch original message');
      return null;
    }

    const embed = this.buildRaceEmbed(race);
    const msg = await originalMessage.edit(embed);
    return this.transformDiscordMessageToChatMessage(msg);
  }

  /**
   * Reply to the specified chat message
   * @param to The message to reply to
   * @param msg The message content
   */
  public async reply(to: ChatMessage, msg: string): Promise<void> {
    const originalMessage = await this.findMessage(
      to.channel.identifier,
      to.identifier,
    );

    if (!originalMessage) {
      console.error('Failed to fetch original message');
      return;
    }

    await originalMessage.reply(msg);
  }

  /**
   * Connect the bot to the discord chat
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Discord.Client();
      this.client.on('ready', () => {
        this._isReady = true;
        resolve();
      });

      this.client.on('message', (msg) => {
        const eventContent = this.transformDiscordMessageToChatMessage(msg);

        this._eventListeners[DestinationEvent.COMMAND_RECEIVED].forEach((l) =>
          l(eventContent),
        );
      });

      this.client.on('disconnect', () => {
        this._isReady = false;
        this._eventListeners[DestinationEvent.DISCONNECTED].forEach((l) => l());
      });

      this.client.on('error', (err) => {
        console.log(`[Discord] error: ${err}`);
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
