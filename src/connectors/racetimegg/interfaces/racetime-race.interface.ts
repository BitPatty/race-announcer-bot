/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2022 Matteias Collet <matteias.collet@bluewin.ch>
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

import RaceTimeCategory from './racetime-category.interface';
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
  category: RaceTimeCategory;
}

export default RaceTimeRace;
