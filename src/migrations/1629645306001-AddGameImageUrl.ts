/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameImageUrl1629645306001 implements MigrationInterface {
  name = 'AddGameImageUrl1629645306001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`game\` ADD \`image_url\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`game\` DROP COLUMN \`image_url\``);
  }
}
