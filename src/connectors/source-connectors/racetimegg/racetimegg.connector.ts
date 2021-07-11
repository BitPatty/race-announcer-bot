import {
  Entrant,
  Game,
  Race,
  SourceConnector,
} from '../../../domain/interfaces';
import {
  EntrantStatus,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../../../domain/enums';
import ConfigService from '../../../infrastructure/config/config.service';
import DateTimeUtils from '../../../utils/date-time.utils';
import RaceTimeEntrant from './interfaces/racetime-entrant.interface';
import RaceTimeEntrantStatus from './enums/racetime-entrant-status.enum';
import RaceTimeRace from './interfaces/racetime-race.interface';
import RaceTimeRaceDetail from './interfaces/race-time-race-detail.interface';
import RaceTimeRaceList from './interfaces/racetime-race-list.interface';
import RaceTimeRaceStatus from './enums/racetime-race-status.enum';
import axios from 'axios';

class RaceTimeGGConnector
  implements SourceConnector<SourceConnectorIdentifier.RACETIME_GG>
{
  private readonly baseUrl = 'https://racetime.gg';

  public get connectorType(): SourceConnectorIdentifier.RACETIME_GG {
    return SourceConnectorIdentifier.RACETIME_GG;
  }

  private raceTimeEntrantStateToStatus(
    state: RaceTimeEntrantStatus,
  ): EntrantStatus {
    switch (state) {
      case RaceTimeEntrantStatus.DONE:
        return EntrantStatus.DONE;
      case RaceTimeEntrantStatus.READY:
        return EntrantStatus.READY;
      case RaceTimeEntrantStatus.IN_PROGRESS:
        return EntrantStatus.READY;
      case RaceTimeEntrantStatus.NOT_READY:
        return EntrantStatus.ENTERED;
      case RaceTimeEntrantStatus.DID_NOT_FINISH:
        return EntrantStatus.FORFEIT;
      case RaceTimeEntrantStatus.DISQUALIFIED:
        return EntrantStatus.DISQUALIFIED;
      default:
        return EntrantStatus.UNKNOWN;
    }
  }

  private raceTimeRaceStateToStatus(state: RaceTimeRaceStatus): RaceStatus {
    switch (state) {
      case RaceTimeRaceStatus.CANCELLED:
        return RaceStatus.OVER;
      case RaceTimeRaceStatus.FINISHED:
        return RaceStatus.FINISHED;
      case RaceTimeRaceStatus.IN_PROGRESS:
        return RaceStatus.IN_PROGRESS;
      case RaceTimeRaceStatus.OPEN:
        return RaceStatus.ENTRY_OPEN;
      case RaceTimeRaceStatus.PENDING:
        return RaceStatus.ENTRY_CLOSED;
      default:
        return RaceStatus.UNKNOWN;
    }
  }

  private racetimeRaceToRace(racetimeRace: RaceTimeRace): Promise<Race | null> {
    return this.getRaceById(racetimeRace.name);
  }

  private racetimeEntrantToEntrant(racetimeEntrant: RaceTimeEntrant): Entrant {
    return {
      displayName: racetimeEntrant.user.name,
      status: this.raceTimeEntrantStateToStatus(racetimeEntrant.status.value),
      finalTime: DateTimeUtils.parseISOTimeSpanToSeconds(
        racetimeEntrant.finish_time,
      ),
    };
  }

  private raceTimeRaceDetailToRace(racetimeRace: RaceTimeRaceDetail): Race {
    return {
      identifier: racetimeRace.name,
      goal: racetimeRace.goal?.name,
      url: `${ConfigService.raceTimeBaseUrl}${racetimeRace.url}`,
      game: {
        identifier: racetimeRace.category.slug,
        name: racetimeRace.category.name,
        abbreviation: racetimeRace.category.short_name,
        imageUrl: racetimeRace.category.image,
      },
      status: this.raceTimeRaceStateToStatus(racetimeRace.status.value),
      entrants: racetimeRace.entrants.map((e) =>
        this.racetimeEntrantToEntrant(e),
      ),
    };
  }

  private async getRaceById(raceIdentifier: string): Promise<Race | null> {
    const { data } = await axios.get<RaceTimeRaceDetail>(
      `${this.baseUrl}/${raceIdentifier}/data`,
    );

    return this.raceTimeRaceDetailToRace(data);
  }

  public async getActiveRaces(): Promise<Race[]> {
    const { data } = await axios.get<RaceTimeRaceList>(
      `${this.baseUrl}/races/data`,
    );

    const res = await Promise.all(
      data.races.map((r) => this.racetimeRaceToRace(r)),
    );

    return res.filter((r) => r != null) as Race[];
  }

  public getRace(race: Race): Promise<Race | null> {
    return this.getRaceById(race.identifier);
  }

  public listGames(): Promise<Game[]> {
    return Promise.resolve([]);
  }
}

export default RaceTimeGGConnector;
