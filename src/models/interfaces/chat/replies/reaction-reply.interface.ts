import { ReactionType, ReplyType } from '../../../enums';

interface ReactionReply {
  type: ReplyType.REACTION;
  reaction: ReactionType;
}

export default ReactionReply;
