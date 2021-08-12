import { MessageChannelType } from '../../enums';

interface ChatChannel {
  identifier: string;
  serverIdentifier: string | null;
  name: string | null;
  type: MessageChannelType;
}

export default ChatChannel;
