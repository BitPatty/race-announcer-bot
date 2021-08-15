/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationalRaceStatus1628805563151
  implements MigrationInterface
{
  name = 'AddInvitationalRaceStatus1628805563151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`race\` CHANGE \`status\` \`status\` enum ('unknown', 'entry_open', 'entry_closed', 'in_progress', 'finished', 'over', 'cancelled', 'invitational') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`race\` CHANGE \`status\` \`status\` enum ('unknown', 'entry_open', 'entry_closed', 'in_progress', 'finished', 'over', 'cancelled') NOT NULL`,
    );
  }
}
