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
  RaceStatus,
} from '../../domain/enums';

import * as Discord from 'discord.js';
import ConfigService from '../../infrastructure/config/config.service';
import DestinationEventListenerMap from '../../domain/interfaces/destination-event-listener-map.interface';
import ChatMessage from '../../domain/interfaces/chat-message.interface';
import MessageBuilderUtils from '../../utils/message-builder.utils';
import * as Joi from 'joi';

class DiscordConnector
  implements DestinationConnector<DestinationConnectorIdentifier.DISCORD>
{
  private client?: Discord.Client;
  private _isReady = false;

  private _eventListeners: {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } = this.removeAllEventListeners();

  private removeAllEventListeners(): {
    [key in keyof DestinationEventListenerMap]: DestinationEventListenerMap[key][];
  } {
    return {
      [DestinationEvent.DISCONNECTED]: [],
      [DestinationEvent.COMMAND_RECEIVED]: [],
      [DestinationEvent.ERROR]: [],
    };
  }

  public get isReady(): boolean {
    return this._isReady;
  }

  public get connectorType(): DestinationConnectorIdentifier.DISCORD {
    return DestinationConnectorIdentifier.DISCORD;
  }

  public getListeners<TEvent extends DestinationEvent>(
    type: TEvent,
  ): DestinationEventListenerMap[TEvent][] {
    return this._eventListeners[type] as DestinationEventListenerMap[TEvent][];
  }

  public addEventListener<TEvent extends DestinationEvent>(
    type: TEvent,
    listener: DestinationEventListenerMap[TEvent],
  ): void {
    const listeners = this.getListeners(type);
    if (!listeners.includes(listener)) listeners.push(listener);
  }

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

  private async findMessage(
    channelId: string,
    messageId: string,
  ): Promise<Discord.Message | null> {
    if (!this.client) return null;
    const channel = await this.findTextChannel(channelId);
    if (!channel) return null;

    const [[_, originalMessage]] = await channel.messages.fetch({
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

    if (race.url && Joi.string().uri().validate(race.url).error == null)
      embed = embed.setURL(race.url);

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

  public async reply(to: ChatMessage, msg: string): Promise<void> {
    const originalMessage = await this.findMessage(
      to.channel.identifier,
      to.identifier,
    );

    if (!originalMessage) {
      console.error('Failed to fetch original message');
      return;
    }

    originalMessage.reply(msg);
  }

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

  public dispose(): Promise<void> {
    this.removeAllEventListeners();
    if (!this.client) return Promise.resolve();
    this.client.destroy();
    this.client = undefined;
    return Promise.resolve();
  }
}

export default DiscordConnector;
