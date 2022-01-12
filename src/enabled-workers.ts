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

import { WorkerType } from './models/enums';

import DiscordConnector from './connectors/discord/discord.connector';
import RaceTimeGGConnector from './connectors/racetimegg/racetimegg.connector';
import SpeedRunsLiveConnector from './connectors/speedrunslive/speedrunslive.connector';

import DestinationConnectorIdentifier from './connectors/destination-connector-identifier.enum';
import SourceConnectorIdentifier from './connectors/source-connector-identifier.enum';

const enabledWorkers = [
  {
    name: 'Discord',
    types: [WorkerType.CHAT, WorkerType.ANNOUNCER],
    connector: DestinationConnectorIdentifier.DISCORD,
    ctor: DiscordConnector,
  },
  {
    name: 'RaceTimeGG',
    types: [WorkerType.SOURCE_SYNC],
    connector: SourceConnectorIdentifier.RACETIME_GG,
    ctor: RaceTimeGGConnector,
  },
  {
    name: 'SpeedRunsLive',
    types: [WorkerType.SOURCE_SYNC],
    connector: SourceConnectorIdentifier.SPEEDRUNSLIVE,
    ctor: SpeedRunsLiveConnector,
  },
];

export default enabledWorkers;
