import { DestinationConnector } from '../../domain/interfaces';
import {
  DestinationConnectorIdentifier,
  DestinationEvent,
  MessageChannelType,
} from '../../domain/enums';

import * as Discord from 'discord.js';
import ConfigService from '../../infrastructure/config/config.service';
import DestinationEventListenerMap from '../../domain/interfaces/destination-event-listener-map.interface';

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

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Discord.Client();
      this.client.on('ready', () => {
        this._isReady = true;
        resolve();
      });

      this.client.on('message', (msg) => {
        const eventContent = {
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
