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

import { EntrantInformation, RaceInformation } from '../models/interfaces';
import { EntrantStatus, RaceStatus } from '../models/enums';
import LoggerService from '../core/logger/logger.service';

class MessageBuilderUtils {
  private static readonly raceStatusIndicatorColor: {
    [key in RaceStatus]: string;
  } = {
    [RaceStatus.UNKNOWN]: '#D3D3D3',
    [RaceStatus.ENTRY_OPEN]: '#008000',
    [RaceStatus.ENTRY_CLOSED]: '#FFA500',
    [RaceStatus.IN_PROGRESS]: '#FFA500',
    [RaceStatus.FINISHED]: '#FF0000',
    [RaceStatus.OVER]: '#FF0000',
    [RaceStatus.CANCELLED]: '#FF0000',
    [RaceStatus.INVITATIONAL]: '#0092A6',
  };

  private static readonly raceStatusIndicatorText: {
    [key in RaceStatus]: string;
  } = {
    [RaceStatus.UNKNOWN]: 'Unknown',
    [RaceStatus.ENTRY_OPEN]: 'Entry Open',
    [RaceStatus.ENTRY_CLOSED]: 'Entry Closed',
    [RaceStatus.IN_PROGRESS]: 'Race In Progress',
    [RaceStatus.FINISHED]: 'Race Finished',
    [RaceStatus.OVER]: 'Race Over',
    [RaceStatus.CANCELLED]: 'Race Cancelled',
    [RaceStatus.INVITATIONAL]: 'Invitational',
  };

  private static readonly entrantStatusIndicatorText: {
    [key in EntrantStatus]: string;
  } = {
    [EntrantStatus.UNKNOWN]: 'Unknown',
    [EntrantStatus.ENTERED]: 'Entered',
    [EntrantStatus.READY]: 'Ready',
    [EntrantStatus.FORFEIT]: 'Forfeit',
    [EntrantStatus.DONE]: 'Finished',
    [EntrantStatus.DISQUALIFIED]: 'DQ',
    [EntrantStatus.INVITED]: 'Invited',
  };

  public static getRaceStatusIndicatorColor(status: RaceStatus): string {
    return this.raceStatusIndicatorColor[status];
  }

  public static getRaceStatusIndicatorText(status: RaceStatus): string {
    return this.raceStatusIndicatorText[status];
  }

  public static getGoalText(race: RaceInformation): string {
    return race.goal && race.goal.trim().length > 0 ? race.goal : '-';
  }

  public static formatFinalTime(timeInSeconds: number): string {
    const seconds = Math.floor(timeInSeconds % 60);
    const minutes = Math.floor((timeInSeconds / 60) % 60);
    const hours = Math.floor((timeInSeconds / 3600) % 60);
    const pad = (num: number): string => (num < 10 ? `0${num}` : `${num}`);
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  public static sortEntrants(
    entrants: EntrantInformation[],
  ): EntrantInformation[] {
    const entrantList: EntrantInformation[] = [];

    entrantList.push(
      ...entrants
        .filter((e) => e.status === EntrantStatus.DONE && e.finalTime != null)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .sort((a, b) => a.finalTime! - b.finalTime!), // NOSONAR
    );

    const sortByDisplayName = (prev, next): -1 | 1 =>
      prev.displayName.toLowerCase() < next.displayName.toLowerCase() ? -1 : 1;

    entrantList.push(
      ...entrants
        .filter((e) => e.status === EntrantStatus.READY)
        .sort(sortByDisplayName),
    );

    entrantList.push(
      ...entrants
        .filter((e) => !entrantList.includes(e))
        .sort(sortByDisplayName),
    );
    return entrantList;
  }

  public static getEntrantStatusText(entrant: EntrantInformation): string {
    const additionalContext =
      entrant.status === EntrantStatus.DONE
        ? ` (${this.formatFinalTime(entrant.finalTime ?? 0)})`
        : '';

    return `${
      this.entrantStatusIndicatorText[entrant.status]
    }${additionalContext}`;
  }

  public static getGameText(race: RaceInformation): string {
    return `${race.game.name}`;
  }

  public static getDomainName(url: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      return u.hostname;
    } catch (e) {
      LoggerService.warn(`Cannot parse URL ${url}`);
      return null;
    }
  }
}

export default MessageBuilderUtils;
