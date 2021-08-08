import { ReplyType } from '../../../enums';

interface TextReply {
  type: ReplyType.TEXT;
  message: string;
}

export default TextReply;
