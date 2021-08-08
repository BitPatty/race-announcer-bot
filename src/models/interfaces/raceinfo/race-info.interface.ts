import { RaceStatus } from '../../enums';
import EntrantInformation from './entrant-info.interface';

interface RaceInformation {
  identifier: string;
  game: {
    identifier: string;
    name: string;
    abbreviation?: string;
    imageUrl?: string;
  };
  goal?: string;
  url?: string;
  status: RaceStatus;
  entrants: EntrantInformation[];
}

export default RaceInformation;
