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
