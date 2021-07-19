import { Connection, In, Repository } from 'typeorm';

import {
  CommunicationChannelEntity,
  GameEntity,
  TrackerEntity,
} from '../../models/entities';

class TrackerService {
  private readonly trackerRepository: Repository<TrackerEntity>;

  public constructor(private readonly databaseConnection: Connection) {
    this.trackerRepository =
      this.databaseConnection.getRepository(TrackerEntity);
  }

  private readonly commonRelations = [
    nameof<TrackerEntity>((t) => t.game),
    nameof<TrackerEntity>((t) => t.channel),
  ];

  private async findTracker(
    channel: CommunicationChannelEntity,
    game: GameEntity,
  ): Promise<TrackerEntity | null> {
    const tracker = await this.trackerRepository.findOne({
      relations: this.commonRelations,
      where: {
        channel,
        game,
      },
    });

    return tracker ?? null;
  }

  public async addTracker(
    channel: CommunicationChannelEntity,
    game: GameEntity,
  ): Promise<TrackerEntity> {
    // Get the existing tracker on the same server
    const serverTracker: TrackerEntity | null = await (async () => {
      if (!channel.serverIdentifier) return null;
      const serverTrackers = await this.findTrackersByServer(
        channel.serverIdentifier,
      );

      return serverTrackers.find((t) => t.game.id === game.id) ?? null;
    })();

    // Add/Update the tracker
    const existingTracker = this.findTracker(channel, game);

    const tracker = (await this.trackerRepository.save({
      ...(existingTracker ?? {}),
      channel,
      game,
      isActive: true,
    })) as TrackerEntity;

    // Remove the previous tracker if it exists
    if (serverTracker && tracker.id !== serverTracker.id) {
      await this.trackerRepository.save({
        ...serverTracker,
        isActive: false,
      });
    }

    return this.trackerRepository.findOne(tracker.id, {
      relations: this.commonRelations,
    }) as Promise<TrackerEntity>;
  }

  public async findTrackersByChannel(
    channelIdentifier: string,
  ): Promise<TrackerEntity[]> {
    const channel = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .findOne({
        relations: this.commonRelations,
        where: {
          identifier: channelIdentifier,
        },
      });

    if (!channel) return [];
    return this.trackerRepository.find({
      where: { channel },
    });
  }

  public async findTrackersByServer(
    serverIdentifier: string,
  ): Promise<TrackerEntity[]> {
    const channels = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .find({
        where: {
          serverIdentifier,
        },
      });

    return this.trackerRepository.find({
      relations: this.commonRelations,
      where: {
        channel: In(channels.map((c) => c.id)),
      },
    });
  }

  public async disableTracker(
    channel: CommunicationChannelEntity,
    game: GameEntity,
  ): Promise<void> {
    const existingTracker = await this.findTracker(channel, game);

    if (existingTracker)
      await this.trackerRepository.save({
        ...existingTracker,
        isActive: false,
      });
  }

  public findTrackersByGame(game: GameEntity): Promise<TrackerEntity[]> {
    return this.trackerRepository.find({
      relations: [
        nameof<TrackerEntity>((t) => t.game),
        nameof<TrackerEntity>((t) => t.channel),
      ],
      where: {
        game,
      },
    });
  }
}

export default TrackerService;
