import ChatChannel from './chat-channel.interface';
import ChatUser from './chat-user.interface';

interface ChatMessage {
  identifier: string;
  channel: ChatChannel;
  author: ChatUser;
  isBotMention: boolean;
  content: string;
  cleanContent: string;
}

export default ChatMessage;
