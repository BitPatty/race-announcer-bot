import { BotCommandType, SourceConnectorIdentifier } from '../../../enums';
import ChatMessage from '../chat-message.interface';

interface RemoveTrackerCommand {
  type: BotCommandType.REMOVE_TRACKER;
  sourceIdentifier: SourceConnectorIdentifier;
  channelIdentifier: string;
  serverIdentifier: string | null;
  gameIdentifier: string;
  message: ChatMessage;
}

export default RemoveTrackerCommand;
