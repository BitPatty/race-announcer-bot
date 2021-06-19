import RaceTimeEntrantStatus from '../enums/racetime-entrant-status.enum';

interface RaceTimeEntrant {
  user: {
    id: string;
    full_name: string;
    name: string;
    discriminator: string;
    url: string;
    avatar: string | null;
    pronouns: string | null;
    flair: string;
    twitch_name: string;
    twitch_display_name: string;
    twitch_channel: string;
    can_moderate: boolean;
  };
  status: {
    value: RaceTimeEntrantStatus;
    verbose_value: string;
    help_text: string;
  };
  finished_time: string | null;
  finished_at: Date | null;
  place: number | null;
  place_ordinal: string | null;
  score: number | null;
  score_change: number | null;
  comment: string | null;
  has_comment: boolean;
  stream_live: boolean;
  stream_override: boolean;
}

export default RaceTimeEntrant;
