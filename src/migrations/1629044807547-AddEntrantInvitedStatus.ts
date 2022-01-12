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

/* eslint-disable */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntrantInvitedStatus1629044807547
  implements MigrationInterface
{
  name = 'AddEntrantInvitedStatus1629044807547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`entrant\` CHANGE \`status\` \`status\` enum ('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified', 'invited') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`entrant\` CHANGE \`status\` \`status\` enum ('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified') NOT NULL`,
    );
  }
}
