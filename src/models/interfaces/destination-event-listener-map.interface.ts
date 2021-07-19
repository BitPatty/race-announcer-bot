import { DestinationEvent } from '../enums';
import AddTrackerCommand from './add-tracker-command.interface';
import ListTrackersCommand from './list-trackers-command.interface';
import RemoveTrackerCommand from './remove-tracker-command.interface';

interface DestinationEventListenerMap {
  [DestinationEvent.COMMAND_RECEIVED]: (
    command: AddTrackerCommand | RemoveTrackerCommand | ListTrackersCommand,
  ) => void;
  [DestinationEvent.DISCONNECTED]: () => void;
  [DestinationEvent.ERROR]: (msg: string) => void;
}

export default DestinationEventListenerMap;
