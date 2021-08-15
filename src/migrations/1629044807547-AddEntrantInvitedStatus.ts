/* eslint-disable */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntrantInvitedStatus1629044807547
  implements MigrationInterface
{
  name = 'AddEntrantInvitedStatus1629044807547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` CHANGE \`status\` \`status\` enum ('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified', 'invited') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` CHANGE \`status\` \`status\` enum ('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified') NOT NULL`,
    );
  }
}
