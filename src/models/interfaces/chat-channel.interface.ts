import { MessageChannelType } from '../enums';

interface ChatChannel {
  identifier: string;
  name?: string;
  type: MessageChannelType;
}

export default ChatChannel;
