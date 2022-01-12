import SRLGameList from '../../../src/connectors/speedrunslive/interfaces/srl-game-list.interface';
import SRLRaceList from '../../../src/connectors/speedrunslive/interfaces/srl-race-list.interface';

const srlGameMock: SRLGameList = {
  count: '5',
  data: [
    {
      gameName: 'Super Metroid',
      gameAbbrev: 'supermetroid',
      gamePopularity: 791.0,
    },
    {
      gameName: 'Super Mario Sunshine',
      gameAbbrev: 'sms',
      gamePopularity: 773.0,
    },
    {
      gameName: 'Pokémon Red/Blue',
      gameAbbrev: 'pkmnredblue',
      gamePopularity: 706.0,
    },
    {
      gameName: 'The Legend of Zelda: Ocarina of Time',
      gameAbbrev: 'oot',
      gamePopularity: 630.0,
    },
    {
      gameName: 'Super Mario 64',
      gameAbbrev: 'sm64',
      gamePopularity: 445.0,
    },
    {
      gameName: 'Any',
      gameAbbrev: 'newgame',
      gamePopularity: 123,
    },
  ],
};

const srlRaceMock: SRLRaceList = {
  data: [
    {
      currentRaceId: 'qtea6',
      game: srlGameMock.data[0],
      currentRaceGoal: '',
      elapsedTime: 0,
      currentRaceState: 1,
      currentRaceStateText: 'Entry Open',
      currentRaceFilename: '',
      entrants: {},
    },
    {
      currentRaceId: 'setrb',
      game: srlGameMock.data[1],
      currentRaceGoal: 'Trevor%',
      elapsedTime: 0,
      currentRaceState: 1,
      currentRaceStateText: 'Entry Open',
      currentRaceFilename: '',
      entrants: {},
    },
    {
      currentRaceId: 'f0r5z',
      game: srlGameMock.data[4],
      currentRaceGoal: 'any% glitchless no it',
      elapsedTime: 1628863562,
      currentRaceState: 3,
      currentRaceStateText: 'In Progress',
      currentRaceFilename: '',
      entrants: {
        pinkish_princess: {
          currentRacePlayerName: 'pinkish_princess',
          place: 1,
          time: 6852,
          message: '2 igts and champ death',
        },
        Araya: {
          currentRacePlayerName: 'Araya',
          place: 2,
          time: 6907,
          message:
            'Amazing run til Fly split, then died to Gambler after not healing 8hp :/. Played bad afterwards',
        },
        pinkpanthr_: {
          currentRacePlayerName: 'pinkpanthr_',
          place: 3,
          time: 7425,
          message:
            'ugly ugly uglu, i need to focus on begining game manips better and get myself in gear lol',
        },
        Abdalain: {
          currentRacePlayerName: 'Abdalain',
          place: 9994,
          time: -3,
          message: '',
        },
        ric_is_bad_at_games: {
          currentRacePlayerName: 'ric_is_bad_at_games',
          place: 9998,
          time: -1,
          message: '',
        },
      },
    },
  ],
};

export { srlGameMock, srlRaceMock };
