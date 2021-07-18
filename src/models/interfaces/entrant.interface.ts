import { EntrantStatus } from '../enums';

interface Entrant {
  displayName: string;
  status: EntrantStatus;
  finalTime: number | null;
}

export default Entrant;
