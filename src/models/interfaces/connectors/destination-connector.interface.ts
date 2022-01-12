/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2022 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { DestinationEvent } from '../../enums';

import DestinationConnectorIdentifier from '../../../connectors/destination-connector-identifier.enum';
import DestinationEventListenerMap from './destination-event-listener-map.interface';

import {
  ChatChannel,
  ChatMessage,
  RaceInformation,
  TextReply,
  TrackerListReply,
} from '..';
import { ReactionReply } from '../chat';

interface DestinationConnector<T extends DestinationConnectorIdentifier> {
  get connectorType(): T;

  get isReady(): boolean;

  reply(
    to: ChatMessage,
    content: TextReply | TrackerListReply | ReactionReply,
  ): Promise<void>;

  postRaceMessage(
    channel: ChatChannel,
    race: RaceInformation,
  ): Promise<ChatMessage | null>;

  updateRaceMessage(
    originalMessage: ChatMessage,
    race: RaceInformation,
    hasGameChanged: boolean,
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

  postHelpMessage(originalMessage: ChatMessage): Promise<void>;

  botHasRequiredPermissions(channel: ChatChannel): Promise<boolean>;

  connect(isMessageHandler: boolean): Promise<void>;

  dispose(): Promise<void> | void;
}

export default DestinationConnector;
