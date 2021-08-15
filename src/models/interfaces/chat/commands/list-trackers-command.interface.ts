import { BotCommandType } from '../../../enums';
import ChatMessage from '../chat-message.interface';

interface ListTrackersCommand {
  type: BotCommandType.LIST_TRACKERS;
  channelIdentifier: string;
  serverIdentifier: string | null;
  message: ChatMessage;
}

export default ListTrackersCommand;
