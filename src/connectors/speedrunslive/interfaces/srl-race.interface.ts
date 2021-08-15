import SRLEntrant from './srl-entrant.interface';
import SRLGame from './srl-game.interface';

interface SRLRace {
  id: string;
  game: SRLGame;
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
