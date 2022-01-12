import { GameEntity } from '../../../src/models/entities';
import { MOCK_SRL_API_BASE_URL_PORT } from '../../test-environment';
import { srlGameMock, srlRaceMock } from './srl-mock-data';
import DatabaseService from '../../../src/core/database/database-service';
import MockAPIServer from '../../utils/mock-api-server';
import RedisService from '../../../src/core/redis/redis-service';
import SourceWorker from '../../../src/core/worker/source-worker';
import clearDatabase from '../../utils/clear-database';

import SourceConnectorIdentifier from '../../../src/connectors/source-connector-identifier.enum';

describe('SRL Source Worker', () => {
  let srlMockServer: MockAPIServer;
  let worker: SourceWorker<SourceConnectorIdentifier.SPEEDRUNSLIVE>;

  beforeAll(async (): Promise<void> => {
    srlMockServer = new MockAPIServer([
      {
        path: '/games',
        body: JSON.stringify(srlGameMock),
      },
      {
        path: '/currentraces',
        body: JSON.stringify(srlRaceMock),
      },
    ]);

    await srlMockServer.start(MOCK_SRL_API_BASE_URL_PORT);
    await RedisService.connect();
  });

  beforeEach(async (): Promise<void> => {
    await clearDatabase();
    worker = new SourceWorker(SourceConnectorIdentifier.SPEEDRUNSLIVE);
    worker['databaseConnection'] = await DatabaseService.getConnection();
  });

  afterAll(async (): Promise<void> => {
    await srlMockServer.dispose();
    await DatabaseService.closeConnection();
    await RedisService.dispose();
  });

  describe('Game Sync', () => {
    test('Game count matches', async () => {
      const gameList = await worker['connector'].listGames();
      expect(gameList.length).toBe(srlGameMock.data.length - 1);
    });

    test('Does not include unlisted games', async () => {
      const gameList = await worker['connector'].listGames();
      const newgameMatch = gameList.some((g) => g.abbreviation === 'newgame');
      expect(newgameMatch).toBe(false);
    });

    test('Persists game data', async () => {
      await worker['syncGames']();

      const games = await worker['databaseConnection']
        .getRepository(GameEntity)
        .find();

      expect(games.length).toBe(srlGameMock.data.length - 1);

      for (const gameMock of srlGameMock.data) {
        if (gameMock.gameAbbrev === 'newgame') continue;
        const gameMatch = games.find(
          (g) =>
            g.connector === worker['connector'].connectorType &&
            g.abbreviation === gameMock.gameAbbrev,
        );

        expect(gameMatch).toBeTruthy();
        expect(gameMatch?.name).toBe(gameMock.gameName);
      }
    });
  });
});
