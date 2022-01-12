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

import RaceTimeEntrantStatus from '../enums/racetime-entrant-status.enum';

interface RaceTimeEntrant {
  user: {
    id: string;
    full_name: string;
    name: string;
    discriminator: string;
    url: string;
    avatar: string | null;
    pronouns: string | null;
    flair: string;
    twitch_name: string;
    twitch_display_name: string;
    twitch_channel: string;
    can_moderate: boolean;
  };
  status: {
    value: RaceTimeEntrantStatus;
    verbose_value: string;
    help_text: string;
  };
  finish_time: string | null;
  finished_at: Date | null;
  place: number | null;
  place_ordinal: string | null;
  score: number | null;
  score_change: number | null;
  comment: string | null;
  has_comment: boolean;
  stream_live: boolean;
  stream_override: boolean;
}

export default RaceTimeEntrant;
