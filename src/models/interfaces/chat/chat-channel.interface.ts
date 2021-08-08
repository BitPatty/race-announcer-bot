import { MessageChannelType } from '../../enums';

interface ChatChannel {
  identifier: string;
  serverIdentifier: string | null;
  name?: string;
  type: MessageChannelType;
}

export default ChatChannel;
