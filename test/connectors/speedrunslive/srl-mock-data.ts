import SRLGameList from '../../../src/connectors/speedrunslive/interfaces/srl-game-list.interface';
import SRLRaceList from '../../../src/connectors/speedrunslive/interfaces/srl-race-list.interface';

const srlGameMock: SRLGameList = {
  count: '5',
  games: [
    {
      id: 3,
      name: 'Super Metroid',
      abbrev: 'supermetroid',
      popularity: 791.0,
      popularityrank: 1,
    },
    {
      id: 7,
      name: 'Super Mario Sunshine',
      abbrev: 'sms',
      popularity: 773.0,
      popularityrank: 2,
    },
    {
      id: 6,
      name: 'Pokémon Red/Blue',
      abbrev: 'pkmnredblue',
      popularity: 706.0,
      popularityrank: 3,
    },
    {
      id: 2,
      name: 'The Legend of Zelda: Ocarina of Time',
      abbrev: 'oot',
      popularity: 630.0,
      popularityrank: 4,
    },
    {
      id: 1,
      name: 'Super Mario 64',
      abbrev: 'sm64',
      popularity: 445.0,
      popularityrank: 5,
    },
    {
      id: 8,
      name: 'Any',
      abbrev: 'newgame',
      popularity: 123,
      popularityrank: 0,
    },
  ],
};

const srlRaceMock: SRLRaceList = {
  count: '163',
  races: [
    {
      id: 'qtea6',
      game: srlGameMock.games[0],
      goal: '',
      time: 0,
      state: 1,
      statetext: 'Entry Open',
      filename: '',
      numentrants: 0,
      entrants: {},
    },
    {
      id: 'setrb',
      game: srlGameMock.games[1],
      goal: 'Trevor%',
      time: 0,
      state: 1,
      statetext: 'Entry Open',
      filename: '',
      numentrants: 0,
      entrants: {},
    },
    {
      id: 'f0r5z',
      game: srlGameMock.games[4],
      goal: 'any% glitchless no it',
      time: 1628863562,
      state: 3,
      statetext: 'In Progress',
      filename: '',
      numentrants: 5,
      entrants: {
        pinkish_princess: {
          displayname: 'pinkish_princess',
          place: 1,
          time: 6852,
          message: '2 igts and champ death',
          statetext: 'Finished',
          twitch: 'pinkish_princess',
          trueskill: '921',
        },
        Araya: {
          displayname: 'Araya',
          place: 2,
          time: 6907,
          message:
            'Amazing run til Fly split, then died to Gambler after not healing 8hp :/. Played bad afterwards',
          statetext: 'Finished',
          twitch: 'arayalol',
          trueskill: '1031',
        },
        pinkpanthr_: {
          displayname: 'pinkpanthr_',
          place: 3,
          time: 7425,
          message:
            'ugly ugly uglu, i need to focus on begining game manips better and get myself in gear lol',
          statetext: 'Finished',
          twitch: 'pinkpanthr_',
          trueskill: '0',
        },
        Abdalain: {
          displayname: 'Abdalain',
          place: 9994,
          time: -3,
          message: '',
          statetext: 'Ready',
          twitch: 'abdalain',
          trueskill: '567',
        },
        ric_is_bad_at_games: {
          displayname: 'ric_is_bad_at_games',
          place: 9998,
          time: -1,
          message: '',
          statetext: 'Forfeit',
          twitch: 'ric_is_bad_at_games',
          trueskill: '182',
        },
      },
    },
  ],
};

export { srlGameMock, srlRaceMock };
