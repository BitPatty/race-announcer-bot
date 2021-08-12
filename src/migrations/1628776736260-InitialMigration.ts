/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1628776736260 implements MigrationInterface {
  name = 'InitialMigration1628776736260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`game\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`identifier\` varchar(255) NOT NULL, \`connector\` enum ('SRL', 'racetime') NOT NULL, \`abbreviation\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_6ee95d182173a211ff700a021b\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`race\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`goal\` varchar(1000) NULL, \`url\` varchar(255) NULL, \`identifier\` varchar(255) NOT NULL, \`connector\` enum ('SRL', 'racetime') NOT NULL, \`status\` enum ('unknown', 'entry_open', 'entry_closed', 'in_progress', 'finished', 'over', 'cancelled') NOT NULL, \`last_sync_at\` datetime NULL, \`change_counter\` int NOT NULL, \`game\` int NOT NULL, UNIQUE INDEX \`IDX_b4cf9023727c1c302858d1bf32\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`communication_channel\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`is_active\` tinyint NOT NULL DEFAULT 0, \`identifier\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`server_identifier\` varchar(255) NULL, \`type\` enum ('direct_message', 'text_channel', 'other') NOT NULL, \`connector\` enum ('discord') NOT NULL, UNIQUE INDEX \`IDX_bddc15eedaa6345cb741002cb9\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`tracker\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`is_active\` tinyint NOT NULL DEFAULT 0, \`channel\` int NOT NULL, \`game\` int NOT NULL, UNIQUE INDEX \`IDX_41304884f7bc06a1af5f1a9a5e\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`announcement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`last_updated\` datetime NOT NULL, \`change_counter\` int NOT NULL, \`failed_update_attempts\` int NOT NULL, \`previous_message\` varchar(4000) NOT NULL, \`tracker\` int NULL, \`race\` int NULL, UNIQUE INDEX \`IDX_9163ed60c490f03694aa0fa70b\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`racer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`identifier\` varchar(255) NOT NULL, \`display_name\` varchar(255) NOT NULL, \`connector\` enum ('SRL', 'racetime') NOT NULL, UNIQUE INDEX \`IDX_c215f7b49a703f633480f377f9\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`development\`.\`entrant\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` char(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`status\` enum ('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified') NOT NULL, \`final_time\` int NULL, \`racer\` int NOT NULL, \`race\` int NOT NULL, UNIQUE INDEX \`IDX_9b498f93d1d677fc927be899c7\` (\`uuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`race\` ADD CONSTRAINT \`FK_31381c0f44bafb11dce63a33954\` FOREIGN KEY (\`game\`) REFERENCES \`development\`.\`game\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`tracker\` ADD CONSTRAINT \`FK_9a7e70bc7f2ffaa6672fa41bd09\` FOREIGN KEY (\`channel\`) REFERENCES \`development\`.\`communication_channel\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`tracker\` ADD CONSTRAINT \`FK_4e47e0fcf025f3e8ff0b93e50c0\` FOREIGN KEY (\`game\`) REFERENCES \`development\`.\`game\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`announcement\` ADD CONSTRAINT \`FK_b7e350bbf051f5d657ea529665d\` FOREIGN KEY (\`tracker\`) REFERENCES \`development\`.\`tracker\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`announcement\` ADD CONSTRAINT \`FK_f5c002ddb504f23295532a16d81\` FOREIGN KEY (\`race\`) REFERENCES \`development\`.\`race\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` ADD CONSTRAINT \`FK_83ca39d3fcff0a8ae495dcad3eb\` FOREIGN KEY (\`racer\`) REFERENCES \`development\`.\`racer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` ADD CONSTRAINT \`FK_eff95102124964982bdc36efd1a\` FOREIGN KEY (\`race\`) REFERENCES \`development\`.\`race\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` DROP FOREIGN KEY \`FK_eff95102124964982bdc36efd1a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`entrant\` DROP FOREIGN KEY \`FK_83ca39d3fcff0a8ae495dcad3eb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`announcement\` DROP FOREIGN KEY \`FK_f5c002ddb504f23295532a16d81\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`announcement\` DROP FOREIGN KEY \`FK_b7e350bbf051f5d657ea529665d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`tracker\` DROP FOREIGN KEY \`FK_4e47e0fcf025f3e8ff0b93e50c0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`tracker\` DROP FOREIGN KEY \`FK_9a7e70bc7f2ffaa6672fa41bd09\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`development\`.\`race\` DROP FOREIGN KEY \`FK_31381c0f44bafb11dce63a33954\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9b498f93d1d677fc927be899c7\` ON \`development\`.\`entrant\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`entrant\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c215f7b49a703f633480f377f9\` ON \`development\`.\`racer\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`racer\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9163ed60c490f03694aa0fa70b\` ON \`development\`.\`announcement\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`announcement\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_41304884f7bc06a1af5f1a9a5e\` ON \`development\`.\`tracker\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`tracker\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_bddc15eedaa6345cb741002cb9\` ON \`development\`.\`communication_channel\``,
    );
    await queryRunner.query(
      `DROP TABLE \`development\`.\`communication_channel\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b4cf9023727c1c302858d1bf32\` ON \`development\`.\`race\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`race\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6ee95d182173a211ff700a021b\` ON \`development\`.\`game\``,
    );
    await queryRunner.query(`DROP TABLE \`development\`.\`game\``);
  }
}
