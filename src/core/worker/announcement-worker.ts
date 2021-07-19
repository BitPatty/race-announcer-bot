import { Connection } from 'typeorm';
import { DestinationConnector } from '../../models/interfaces';
import { DestinationConnectorIdentifier } from '../../models/enums';
import DatabaseService from '../database/database-service';
import DiscordConnector from '../../connectors/discord/discord.connector';
import TrackerService from '../tracker/tracker.service';
import Worker from './worker.interface';

class AnnouncementWorker<T extends DestinationConnectorIdentifier>
  implements Worker
{
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
   * Starts the worker
   */
  public async start(): Promise<void> {
    this.databaseConnection = await DatabaseService.getConnection();
    this.trackerService = new TrackerService(this.databaseConnection);
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

export default AnnouncementWorker;
