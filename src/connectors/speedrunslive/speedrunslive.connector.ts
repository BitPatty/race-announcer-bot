/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
 * Official Repository: https://github.com/BitPatty/RaceAnnouncerBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

import { EntrantStatus, RaceStatus } from '../../models/enums';

import ConfigService from '../../core/config/config.service';

import SourceConnectorIdentifier from '../source-connector-identifier.enum';

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
      identifier: srlEntrant.currentRacePlayerName.toLowerCase(),
      displayName: srlEntrant.currentRacePlayerName,
      fullName: srlEntrant.currentRacePlayerName,
      status: this.numericEntrantStateToStatus(srlEntrant.time),
      finalTime: srlEntrant.time > 0 ? srlEntrant.time : null,
    };
  }

  private formatGoal(goal: string): string {
    if (!goal) return '-';
    return goal.replace(/&amp;/g, '&');
  }

  private srlRaceToRace(srlRace: SRLRace): RaceInformation {
    return {
      identifier: srlRace.currentRaceId.toString(),
      url: `${ConfigService.speedRunsLiveBaseUrl}/currentraces/${srlRace.currentRaceId}`,
      game: this.srlGameToGame(srlRace.game),
      goal: this.formatGoal(srlRace.currentRaceGoal),
      status: this.numericRaceStateToStatus(srlRace.currentRaceState),
      entrants: Object.values(srlRace.entrants).map((e) =>
        this.srlEntrantToEntrant(e),
      ),
    };
  }

  private srlGameToGame(srlGame: SRLGame): GameInformation {
    return {
      identifier: srlGame.gameAbbrev.toString(),
      name: srlGame.gameName,
      abbreviation: srlGame.gameAbbrev,
      // This is actually how the SRL website builds the URL,
      // no matter whether the image actually exists
      imageUrl: `https://cdn.speedrunslive.com/images/games/${srlGame.gameAbbrev}.jpg`,
    };
  }

  public async getActiveRaces(): Promise<RaceInformation[]> {
    const { data } = await axios.get<SRLRaceList>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/currentraces?pageSize=1000`,
    );
    return data.data.map((r) => this.srlRaceToRace(r));
  }

  public async getRaceById(
    identifier: string,
  ): Promise<RaceInformation | null> {
    const { data } = await axios.get<SRLRace>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/currentraces/${identifier}`,
    );

    // SRL returns an empty object ({}) on races that
    // that are no longer listed
    return data && data.currentRaceId ? this.srlRaceToRace(data) : null;
  }

  public async listGames(): Promise<GameInformation[]> {
    const { data } = await axios.get<SRLGameList>(
      `${ConfigService.speedRunsLiveApiBaseUrl}/games?pageSize=10000`,
    );
    return data.data
      .filter(
        (g) =>
          g.gameName && g.gameName.length > 0 && g.gameAbbrev !== 'newgame',
      )
      .map((g) => this.srlGameToGame(g));
  }
}

export default SpeedRunsLiveConnector;
