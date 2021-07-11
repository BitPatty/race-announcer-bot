import ChatChannel from './chat-channel.interface';
import ChatServer from './chat-server.interface';
import ChatUser from './chat-user.interface';

interface ChatMessage {
  identifier: string;
  server: ChatServer;
  channel: ChatChannel;
  author: ChatUser;
  isBotMention: boolean;
  content: string;
  cleanContent: string;
}

export default ChatMessage;
