import { DestinationConnector } from '../../domain/interfaces';
import { DestinationConnectorIdentifier } from '../../domain/enums';

import * as Discord from 'discord.js';
import ConfigService from '../../infrastructure/config/config.service';

class DiscordConnector
  implements DestinationConnector<DestinationConnectorIdentifier.DISCORD>
{
  private client?: Discord.Client;

  get connectorType(): DestinationConnectorIdentifier.DISCORD {
    return DestinationConnectorIdentifier.DISCORD;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Discord.Client();
      this.client.on('ready', () => {
        console.log('[Discord] ready');
        resolve();
      });

      this.client.on('message', (msg) => {
        console.log(`[Discord] message: ${msg}`);
      });

      this.client.on('error', (err) => {
        console.log(`[Discord] error: ${err}`);
        reject(err);
      });

      void this.client.login(ConfigService.discordToken);
    });
  }

  public dispose(): Promise<void> {
    if (!this.client) return Promise.resolve();
    this.client.destroy();
    this.client = undefined;
    return Promise.resolve();
  }
}

export default DiscordConnector;
