import { CommandType, SourceConnectorIdentifier } from '../enums';
import ChatMessage from './chat-message.interface';

interface AddTrackerCommand {
  type: CommandType.ADD_TRACKER;
  sourceIdentifier: SourceConnectorIdentifier;
  gameIdentifier: string;
  targetChannelIdentifier: string;
  message: ChatMessage;
}

export default AddTrackerCommand;
