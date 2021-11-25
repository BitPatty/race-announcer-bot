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

import { Connection, In, Repository } from 'typeorm';

import {
  CommunicationChannelEntity,
  GameEntity,
  TrackerEntity,
} from '../../../models/entities';

class TrackerService {
  private readonly trackerRepository: Repository<TrackerEntity>;

  public constructor(private readonly databaseConnection: Connection) {
    this.trackerRepository =
      this.databaseConnection.getRepository(TrackerEntity);
  }

  /**
   * Relations that should always be joined when returning trackers
   */
  private readonly commonRelations = [
    nameof<TrackerEntity>((t) => t.game),
    nameof<TrackerEntity>((t) => t.channel),
  ];

  /**
   * Looks up a tracker mapped to the specified channel and game
   *
   * @param channel  The channel
   * @param game     The game
   * @returns        The first match or null if there is no match
   */
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

  /**
   * Adds a new tracker for the specified game and channel
   *
   * @param channel  The target channel
   * @param game     The target game
   * @returns        The created tracker
   */
  public async addTracker(
    channel: CommunicationChannelEntity,
    game: GameEntity,
  ): Promise<TrackerEntity> {
    // Get an existing tracker on the same server if it exists
    const existingTrackerOnSameServer: TrackerEntity | null =
      await (async () => {
        if (!channel.serverIdentifier) return null;
        const serverTrackers = await this.findTrackersByServer(
          channel.serverIdentifier,
        );

        return serverTrackers.find((t) => t.game.id === game.id) ?? null;
      })();

    // Add/Update the tracker
    const existingTrackerOnSameChannel =
      existingTrackerOnSameServer ?? (await this.findTracker(channel, game));
    const tracker = (await this.trackerRepository.save({
      ...(existingTrackerOnSameChannel ?? {}),
      channel,
      game,
      isActive: true,
    })) as TrackerEntity;

    return this.trackerRepository.findOne(tracker.id, {
      relations: this.commonRelations,
    }) as Promise<TrackerEntity>;
  }

  /**
   * Finds all trackers mapped to the specified channel
   *
   * @param channelIdentifier  The channel identifier
   * @returns                  The list of trackers mapped to the channel
   */
  public async findTrackersByChannel(
    channelIdentifier: string,
  ): Promise<TrackerEntity[]> {
    const channel = await this.databaseConnection
      .getRepository(CommunicationChannelEntity)
      .findOne({
        where: {
          identifier: channelIdentifier,
        },
      });

    if (!channel) return [];
    return this.trackerRepository.find({
      relations: this.commonRelations,
      where: { channel },
    });
  }

  /**
   * Finds all trackers mapped to the specified server
   *
   * @param serverIdentifier  The server identifier
   * @returns                 The list of trackers mapped to the server
   */
  public async findTrackersByServer(
    serverIdentifier: string,
  ): Promise<TrackerEntity[]> {
    // Since the server identifier is an optional
    // attribute better don't look up all matches
    if (!serverIdentifier) return [];

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
        channel: {
          id: In(channels.map((c) => c.id)),
        },
      },
    });
  }

  /**
   * Disables the specified tracker
   *
   * @param tracker  The tracker to disable
   */
  public async disableTracker(tracker: TrackerEntity): Promise<void> {
    const existingTracker = await this.trackerRepository.findOne(tracker.id);

    if (existingTracker)
      await this.trackerRepository.save({
        ...existingTracker,
        isActive: false,
      });
  }
}

export default TrackerService;
