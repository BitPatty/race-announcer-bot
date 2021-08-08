import { CommandType, SourceConnectorIdentifier } from '../../../enums';
import ChatMessage from '../chat-message.interface';

interface RemoveTrackerCommand {
  type: CommandType.REMOVE_TRACKER;
  sourceIdentifier: SourceConnectorIdentifier;
  channelIdentifier: string;
  serverIdentifier: string | null;
  gameIdentifier: string;
  message: ChatMessage;
}

export default RemoveTrackerCommand;
