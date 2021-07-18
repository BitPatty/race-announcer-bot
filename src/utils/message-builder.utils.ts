import { Entrant, Race } from '../models/interfaces';
import { EntrantStatus, RaceStatus } from '../models/enums';

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
  };

  private static readonly raceStatusIndicatorText: {
    [key in RaceStatus]: string;
  } = {
    [RaceStatus.UNKNOWN]: 'Unknown',
    [RaceStatus.ENTRY_OPEN]: 'Entry Open',
    [RaceStatus.ENTRY_CLOSED]: 'Entry Closed',
    [RaceStatus.IN_PROGRESS]: 'In Progress',
    [RaceStatus.FINISHED]: 'Finished',
    [RaceStatus.OVER]: 'Over',
    [RaceStatus.CANCELLED]: 'Cancelled',
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
  };

  public static getRaceStatusIndicatorColor(status: RaceStatus): string {
    return this.raceStatusIndicatorColor[status];
  }

  public static getRaceStatusIndicatorText(status: RaceStatus): string {
    return this.raceStatusIndicatorText[status];
  }

  public static getGoalTitle(): string {
    return 'Goal';
  }

  public static getGoalText(race: Race): string {
    return race.goal && race.goal.trim().length > 0 ? race.goal : '-';
  }

  public static getEntrantsTitle(): string {
    return 'Entrants';
  }

  private static formatFinalTime(timeInSeconds: number): string {
    const seconds = Math.floor(timeInSeconds % 60);
    const minutes = Math.floor((timeInSeconds / 60) % 60);
    const hours = Math.floor((timeInSeconds / 3600) % 60);
    const pad = (num: number): string => (num < 10 ? `0${num}` : `${num}`);
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  public static sortEntrants(entrants: Entrant[]): Entrant[] {
    const entrantList: Entrant[] = [];

    entrantList.push(
      ...entrants
        .filter((e) => e.status === EntrantStatus.DONE && e.finalTime != null)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .sort((a, b) => a.finalTime! - b.finalTime!),
    );

    entrantList.push(
      ...entrants.filter((e) => e.status === EntrantStatus.READY),
    );

    entrantList.push(...entrants.filter((e) => !entrantList.includes(e)));
    return entrantList;
  }

  public static getEntrantStatusText(entrant: Entrant): string {
    const additionalContext =
      entrant.status === EntrantStatus.DONE
        ? ` (${this.formatFinalTime(entrant.finalTime ?? 0)})`
        : '';

    return `${entrant.displayName}: ${
      this.entrantStatusIndicatorText[entrant.status]
    }${additionalContext}`;
  }

  public static getGameTitle(): string {
    return 'Game';
  }

  public static getGameText(race: Race): string {
    return `${race.game.name}`;
  }
}

export default MessageBuilderUtils;
