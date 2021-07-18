import { DestinationEvent } from '../enums';
import ChatMessage from './chat-message.interface';

interface DestinationEventListenerMap {
  [DestinationEvent.COMMAND_RECEIVED]: (msg: ChatMessage) => void;
  [DestinationEvent.DISCONNECTED]: () => void;
  [DestinationEvent.ERROR]: (msg: string) => void;
}

export default DestinationEventListenerMap;
