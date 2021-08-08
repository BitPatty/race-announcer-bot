import { CommandType } from '../../../enums';
import ChatMessage from '../chat-message.interface';

interface HelpCommand {
  type: CommandType.HELP;
  message: ChatMessage;
}

export default HelpCommand;
