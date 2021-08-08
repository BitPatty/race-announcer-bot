import { EntrantStatus } from '../../enums';

interface EntrantInformation {
  displayName: string;
  status: EntrantStatus;
  finalTime: number | null;
}

export default EntrantInformation;
