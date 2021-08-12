import { BotCommandType } from '../../../enums';
import ChatMessage from '../chat-message.interface';

interface HelpCommand {
  type: BotCommandType.HELP;
  message: ChatMessage;
}

export default HelpCommand;
