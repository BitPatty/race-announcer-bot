import axios from 'axios';

import {
  EntrantInformation,
  GameInformation,
  RaceInformation,
  SourceConnector,
} from '../../models/interfaces';

import SRLEntrant from './interfaces/srl-entrant.interface';
import SRLGame from './interfaces/srl-game.interface';
import SRLGameList from './interfaces/srl-game-list.interface';
import SRLRace from './interfaces/srl-race.interface';
import SRLRaceList from './interfaces/srl-race-list.interface';

import {
  EntrantStatus,
  RaceStatus,
  SourceConnectorIdentifier,
} from '../../models/enums';

import ConfigService from '../../core/config/config.service';

class SpeedRunsLiveConnector
  implements SourceConnector<SourceConnectorIdentifier.SPEEDRUNSLIVE>
{
  public get connectorType(): SourceConnectorIdentifier.SPEEDRUNSLIVE {
    return SourceConnectorIdentifier.SPEEDRUNSLIVE;
  }

  private readonly numericRaceStateToStatus = (state: number): RaceStatus => {
    switch (state) {
      case 1:
        return RaceStatus.ENTRY_OPEN;
      case 2:
        return RaceStatus.ENTRY_CLOSED;
      case 3:
        return RaceStatus.IN_PROGRESS;
      case 4:
        return RaceStatus.FINISHED;
      case 5:
        return RaceStatus.OVER;
      default:
        return RaceStatus.UNKNOWN;
    }
  };

  private readonly numericEntrantStateToStatus = (
    time: number,
  ): EntrantStatus => {
    switch (time) {
      case -3:
        return EntrantStatus.READY;
      case -2:
        return EntrantStatus.DISQUALIFIED;
      case -1:
        return EntrantStatus.FORFEIT;
      case 0:
        return EntrantStatus.ENTERED;
      default:
        return time > 0 ? EntrantStatus.DONE : EntrantStatus.UNKNOWN;
    }
  };

  private srlEntrantToEntrant(srlEntrant: SRLEntrant): EntrantInformation {
    return {
      displayName: srlEntrant.displayname,
      status: this.numericEntrantStateToStatus(srlEntrant.time),
      finalTime: srlEntrant.time > 0 ? srlEntrant.time : null,
    };
  }

  private srlRaceToRace(srlRace: SRLRace): RaceInformation {
    return {
      identifier: srlRace.id.toString(),
      url: `${ConfigService.speedRunsLiveBaseUrl}/race/?id=${srlRace.id}`,
      game: {
        identifier: srlRace.game.id.toString(),
        name: srlRace.game.name,
        abbreviation: srlRace.game.abbrev,
      },
      goal: srlRace.goal,
      status: this.numericRaceStateToStatus(srlRace.state),
      entrants: Object.values(srlRace.entrants).map((e) =>
        this.srlEntrantToEntrant(e),
      ),
    };
  }

  private srlGameToGame(srlGame: SRLGame): GameInformation {
    return {
      identifier: srlGame.id.toString(),
      name: srlGame.name,
      abbreviation: srlGame.abbrev,
    };
  }

  public async getActiveRaces(): Promise<RaceInformation[]> {
    const { data } = await axios.get<SRLRaceList>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/races`,
    );
    return data.races.map((r) => this.srlRaceToRace(r));
  }

  public async getRaceById(
    identifier: string,
  ): Promise<RaceInformation | null> {
    const { data } = await axios.get<SRLRace>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/races/${identifier}`,
    );

    // SRL returns an empty object ({}) on races that
    // that are no longer listed
    return data && data.id ? this.srlRaceToRace(data) : null;
  }

  public async listGames(): Promise<GameInformation[]> {
    const { data } = await axios.get<SRLGameList>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/games`,
    );
    return data.games
      .filter((g) => g.name && g.name.length > 0 && g.abbrev !== 'newgame')
      .map((g) => this.srlGameToGame(g));
  }
}

export default SpeedRunsLiveConnector;
