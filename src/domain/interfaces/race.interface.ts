import { RaceStatus } from '../enums';
import Entrant from './entrant.interface';

interface Race {
  identifier: string;
  game: {
    identifier: string;
    name: string;
    abbreviation?: string;
  };
  status: RaceStatus;
  entrants: Entrant[];
}

export default Race;
