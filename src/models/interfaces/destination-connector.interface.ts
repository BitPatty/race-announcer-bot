import { DestinationConnectorIdentifier, DestinationEvent } from '../enums';
import ChatChannel from './chat-channel.interface';
import ChatMessage from './chat-message.interface';
import ChatServer from './chat-server.interface';
import DestinationEventListenerMap from './destination-event-listener-map.interface';
import Race from './race.interface';
import TextReply from './text-reply.interface';
import TrackerListReply from './tracker-list-reply.interface';

interface DestinationConnector<T extends DestinationConnectorIdentifier> {
  get connectorType(): T;

  get isReady(): boolean;

  reply(to: ChatMessage, content: TextReply | TrackerListReply): Promise<void>;

  postRaceMessage(
    server: ChatServer,
    channel: ChatChannel,
    race: Race,
  ): Promise<ChatMessage | null>;

  updateRaceMessage(
    originalMessage: ChatMessage,
    race: Race,
  ): Promise<ChatMessage | null>;

  getListeners<TEvent extends DestinationEvent>(
    type: TEvent,
  ): DestinationEventListenerMap[TEvent][];

  addEventListener<TEvent extends DestinationEvent>(
    type: TEvent,
    listener: DestinationEventListenerMap[TEvent],
  ): void;

  removeEventListener<TEvent extends DestinationEvent>(
    type: TEvent,
    listener?: DestinationEventListenerMap[TEvent],
  ): void;

  findChannel(channelIdentifier: string): Promise<ChatChannel | null>;

  botHasRequiredPermissions(channel: ChatChannel): Promise<boolean>;

  connect(): Promise<void>;

  dispose(): Promise<void>;
}

export default DestinationConnector;
