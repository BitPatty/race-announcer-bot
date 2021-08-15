import { DestinationEvent } from '../../enums';

import {
  AddTrackerCommand,
  HelpCommand,
  ListTrackersCommand,
  RemoveTrackerCommand,
} from '..';

interface DestinationEventListenerMap {
  [DestinationEvent.COMMAND_RECEIVED]: (
    command:
      | AddTrackerCommand
      | RemoveTrackerCommand
      | ListTrackersCommand
      | HelpCommand,
  ) => void;
  [DestinationEvent.DISCONNECTED]: () => void;
  [DestinationEvent.ERROR]: (msg: string) => void;
}

export default DestinationEventListenerMap;
