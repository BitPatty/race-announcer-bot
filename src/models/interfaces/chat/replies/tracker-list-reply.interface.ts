import { TrackerEntity } from '../../../entities';
import ReplyType from '../../../enums/reply-type.enum';

interface TrackerListReply {
  type: ReplyType.TRACKER_LIST;
  items: TrackerEntity[];
}

export default TrackerListReply;
