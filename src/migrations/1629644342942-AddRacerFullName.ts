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

/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRacerFullName1629644342942 implements MigrationInterface {
  name = 'AddRacerFullName1629644342942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`racer\` ADD \`full_name\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`racer\` DROP COLUMN \`full_name\``);
  }
}
