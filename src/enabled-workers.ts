import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerType,
} from './models/enums';

import DiscordConnector from './connectors/discord/discord.connector';
import RaceTimeGGConnector from './connectors/racetimegg/racetimegg.connector';
import SpeedRunsLiveConnector from './connectors/speedrunslive/speedrunslive.connector';

const enabledWorkers = [
  {
    types: [WorkerType.CHAT, WorkerType.ANNOUNCER],
    connector: DestinationConnectorIdentifier.DISCORD,
    ctor: DiscordConnector,
  },
  {
    types: [WorkerType.SOURCE_SYNC],
    connector: SourceConnectorIdentifier.RACETIME_GG,
    ctor: RaceTimeGGConnector,
  },
  {
    types: [WorkerType.SOURCE_SYNC],
    connector: SourceConnectorIdentifier.SPEEDRUNSLIVE,
    ctor: SpeedRunsLiveConnector,
  },
];

export default enabledWorkers;
