import RaceTimeEntrant from './racetime-entrant.interface';
import RaceTimeRace from './racetime-race.interface';

interface RaceTimeRaceDetail extends RaceTimeRace {
  entrants: RaceTimeEntrant[];
}

export default RaceTimeRaceDetail;
