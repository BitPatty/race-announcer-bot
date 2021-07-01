import { MessageChannelType } from '../enums';

interface ChatMessage {
  identifier: string;
  server: {
    identifier?: string;
    name?: string;
  };
  channel: {
    identifier: string;
    name?: string;
    type: MessageChannelType;
  };
  author: {
    identifier: string;
    displayName: string;
    isBotOwner: boolean;
    canUseBotCommands: boolean;
  };
  isBotMention: boolean;
  content: string;
  cleanContent: string;
}

export default ChatMessage;
