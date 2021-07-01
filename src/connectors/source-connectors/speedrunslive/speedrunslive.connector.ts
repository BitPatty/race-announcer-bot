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

import SRLEntrant from './interfaces/srl-entrant.interface';
import SRLGame from './interfaces/srl-game.interface';
import SRLGameList from './interfaces/srl-game-list.interface';
import SRLRace from './interfaces/srl-race.interface';
import SRLRaceList from './interfaces/srl-race-list.interface';

import axios from 'axios';

class SpeedRunsLiveConnector
  implements SourceConnector<SourceConnectorIdentifier.SPEEDRUNSLIVE>
{
  private readonly baseUrl = 'https://api.speedrunslive.com';

  public get connectorType(): SourceConnectorIdentifier.SPEEDRUNSLIVE {
    return SourceConnectorIdentifier.SPEEDRUNSLIVE;
  }

  private numericRaceStateToStatus = (state: number): RaceStatus => {
    switch (state) {
      case 1:
        return RaceStatus.ENTRY_OPEN;
      case 2:
        return RaceStatus.ENTRY_CLOSED;
      case 3:
        return RaceStatus.IN_PROGRESS;
      case 4:
        return RaceStatus.FINISHED;
      case 6:
        return RaceStatus.OVER;
      default:
        return RaceStatus.UNKNOWN;
    }
  };

  private numericEntrantStateToStatus = (time: number): EntrantStatus => {
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

  private srlEntrantToEntrant(srlEntrant: SRLEntrant): Entrant {
    return {
      displayName: srlEntrant.displayname,
      status: this.numericEntrantStateToStatus(srlEntrant.time),
      finalTime: srlEntrant.time > 0 ? srlEntrant.time : null,
    };
  }

  private srlRaceToRace(srlRace: SRLRace): Race {
    return {
      identifier: srlRace.id.toString(),
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

  private srlGameToGame(srlGame: SRLGame): Game {
    return {
      identifier: srlGame.id.toString(),
      name: srlGame.name,
      abbreviation: srlGame.abbrev,
    };
  }

  public async getActiveRaces(): Promise<Race[]> {
    const { data } = await axios.get<SRLRaceList>(`${this.baseUrl}/races`);
    return data.races.map((r) => this.srlRaceToRace(r));
  }

  public async getRace(race: Race): Promise<Race | null> {
    const { data } = await axios.get<SRLRace>(
      `${this.baseUrl}/races/${race.identifier}`,
    );
    return data && data.id ? this.srlRaceToRace(data) : null;
  }

  public async listGames(): Promise<Game[]> {
    const { data } = await axios.get<SRLGameList>(`${this.baseUrl}/games`);
    return data.games.map((g) => this.srlGameToGame(g));
  }
}

export default SpeedRunsLiveConnector;
