import {
  EntrantInformation,
  GameInformation,
  RaceInformation,
  SourceConnector,
} from '../../models/interfaces';

import RaceTimeCategory from './interfaces/racetime-category.interface';
import RaceTimeCategoryList from './interfaces/racetime-category-list.interface';
import RaceTimeEntrant from './interfaces/racetime-entrant.interface';
import RaceTimeRace from './interfaces/racetime-race.interface';
import RaceTimeRaceDetail from './interfaces/racetime-race-detail.interface';
import RaceTimeRaceList from './interfaces/racetime-race-list.interface';

import {
  EntrantStatus,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../../models/enums';
import RaceTimeEntrantStatus from './enums/racetime-entrant-status.enum';
import RaceTimeRaceStatus from './enums/racetime-race-status.enum';

import ConfigService from '../../core/config/config.service';
import DateTimeUtils from '../../utils/date-time.utils';
import axios from 'axios';

class RaceTimeGGConnector
  implements SourceConnector<SourceConnectorIdentifier.RACETIME_GG>
{
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

  private racetimeCategoryToGame(category: RaceTimeCategory): GameInformation {
    return {
      identifier: category.slug,
      name: category.name,
      abbreviation: category.short_name,
    };
  }

  private racetimeRaceToRace(
    racetimeRace: RaceTimeRace,
  ): Promise<RaceInformation | null> {
    return this.getRaceById(racetimeRace.name);
  }

  private racetimeEntrantToEntrant(
    racetimeEntrant: RaceTimeEntrant,
  ): EntrantInformation {
    return {
      displayName: racetimeEntrant.user.name,
      status: this.raceTimeEntrantStateToStatus(racetimeEntrant.status.value),
      finalTime: DateTimeUtils.parseISOTimeSpanToSeconds(
        racetimeEntrant.finish_time,
      ),
    };
  }

  private raceTimeRaceDetailToRace(
    racetimeRace: RaceTimeRaceDetail,
  ): RaceInformation {
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

  private async getRaceById(
    raceIdentifier: string,
  ): Promise<RaceInformation | null> {
    const { data } = await axios.get<RaceTimeRaceDetail>(
      `${ConfigService.raceTimeBaseUrl}/${raceIdentifier}/data`,
    );

    return this.raceTimeRaceDetailToRace(data);
  }

  public async getActiveRaces(): Promise<RaceInformation[]> {
    const { data } = await axios.get<RaceTimeRaceList>(
      `${ConfigService.raceTimeBaseUrl}/races/data`,
    );

    const res = await Promise.all(
      data.races.map((r) => this.racetimeRaceToRace(r)),
    );

    return res.filter((r) => r != null) as RaceInformation[];
  }

  public getRace(race: RaceInformation): Promise<RaceInformation | null> {
    return this.getRaceById(race.identifier);
  }

  public async listGames(): Promise<GameInformation[]> {
    const { data } = await axios.get<RaceTimeCategoryList>(
      `${ConfigService.raceTimeBaseUrl}/categories/data`,
    );
    return data.categories
      .filter((c) => c.name && c.name.length > 0 && c.short_name !== '')
      .map((c) => this.racetimeCategoryToGame(c));
  }
}

export default RaceTimeGGConnector;
