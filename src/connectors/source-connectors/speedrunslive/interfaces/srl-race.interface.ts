import SRLEntrant from './srl-entrant.interface';

interface SRLRace {
  id: string;
  game: {
    id: number;
    name: string;
    abbrev: string;
    popularity: string;
    popularityrank: number;
  };
  goal: string;
  time: number;
  state: number;
  statetext: string;
  filename: string;
  numentrants: number;
  entrants: {
    [_: string]: SRLEntrant;
  };
}

export default SRLRace;
