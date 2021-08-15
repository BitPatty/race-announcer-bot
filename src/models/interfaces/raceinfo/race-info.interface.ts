import { RaceStatus } from '../../enums';
import EntrantInformation from './entrant-info.interface';
import GameInformation from './game-info.interface';

interface RaceInformation {
  identifier: string;
  game: GameInformation;
  goal?: string;
  url?: string;
  status: RaceStatus;
  entrants: EntrantInformation[];
}

export default RaceInformation;
