import RaceTimeRaceStatus from '../enums/racetime-race-status.enum';

interface RaceTimeRace {
  name: string;
  status: {
    value: RaceTimeRaceStatus;
    verbose_value: string;
    help_text: string;
  };
  url: string;
  data_url: string;
  goal: {
    name: string;
    custom: boolean;
  };
  info: string;
  entrants_count: number;
  entrants_count_finished: number;
  entrants_count_inactive: number;
  opened_at: string;
  started_at: string;
  category: {
    name: string;
    short_name: string;
    slug: string;
    url: string;
    data_url: string;
    image: string;
  };
}

export default RaceTimeRace;
