-- CreateTable
CREATE TABLE `announcement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `last_updated` DATETIME(0) NOT NULL,
    `change_counter` INTEGER NOT NULL,
    `failed_update_attempts` INTEGER NOT NULL,
    `previous_message` VARCHAR(4000) NOT NULL,
    `tracker` INTEGER NULL,
    `race` INTEGER NULL,

    UNIQUE INDEX `IDX_9163ed60c490f03694aa0fa70b`(`uuid`),
    INDEX `FK_b7e350bbf051f5d657ea529665d`(`tracker`),
    INDEX `FK_f5c002ddb504f23295532a16d81`(`race`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communication_channel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `identifier` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `server_identifier` VARCHAR(255) NULL,
    `type` ENUM('direct_message', 'text_channel', 'other') NOT NULL,
    `connector` ENUM('discord') NOT NULL,
    `server_name` VARCHAR(255) NULL,

    UNIQUE INDEX `IDX_bddc15eedaa6345cb741002cb9`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entrant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `status` ENUM('unknown', 'entered', 'ready', 'forfeit', 'done', 'disqualified', 'invited') NOT NULL,
    `final_time` INTEGER NULL,
    `racer` INTEGER NOT NULL,
    `race` INTEGER NOT NULL,

    UNIQUE INDEX `IDX_9b498f93d1d677fc927be899c7`(`uuid`),
    INDEX `FK_83ca39d3fcff0a8ae495dcad3eb`(`racer`),
    INDEX `FK_eff95102124964982bdc36efd1a`(`race`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `name` VARCHAR(255) NOT NULL,
    `identifier` VARCHAR(255) NOT NULL,
    `connector` ENUM('SRL', 'racetime') NOT NULL,
    `abbreviation` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(255) NULL,

    UNIQUE INDEX `IDX_6ee95d182173a211ff700a021b`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `race` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `goal` VARCHAR(1000) NULL,
    `url` VARCHAR(255) NULL,
    `identifier` VARCHAR(255) NOT NULL,
    `connector` ENUM('SRL', 'racetime') NOT NULL,
    `status` ENUM('unknown', 'entry_open', 'entry_closed', 'in_progress', 'finished', 'over', 'cancelled', 'invitational') NOT NULL,
    `last_sync_at` DATETIME(0) NULL,
    `change_counter` INTEGER NOT NULL,
    `game` INTEGER NOT NULL,

    UNIQUE INDEX `IDX_b4cf9023727c1c302858d1bf32`(`uuid`),
    INDEX `FK_31381c0f44bafb11dce63a33954`(`game`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `racer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `identifier` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `connector` ENUM('SRL', 'racetime') NOT NULL,
    `full_name` VARCHAR(255) NULL,

    UNIQUE INDEX `IDX_c215f7b49a703f633480f377f9`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `channel` INTEGER NOT NULL,
    `game` INTEGER NOT NULL,

    UNIQUE INDEX `IDX_41304884f7bc06a1af5f1a9a5e`(`uuid`),
    INDEX `FK_4e47e0fcf025f3e8ff0b93e50c0`(`game`),
    INDEX `FK_9a7e70bc7f2ffaa6672fa41bd09`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `announcement` ADD CONSTRAINT `FK_f5c002ddb504f23295532a16d81` FOREIGN KEY (`race`) REFERENCES `race`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `announcement` ADD CONSTRAINT `FK_b7e350bbf051f5d657ea529665d` FOREIGN KEY (`tracker`) REFERENCES `tracker`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `entrant` ADD CONSTRAINT `FK_eff95102124964982bdc36efd1a` FOREIGN KEY (`race`) REFERENCES `race`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `entrant` ADD CONSTRAINT `FK_83ca39d3fcff0a8ae495dcad3eb` FOREIGN KEY (`racer`) REFERENCES `racer`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `race` ADD CONSTRAINT `FK_31381c0f44bafb11dce63a33954` FOREIGN KEY (`game`) REFERENCES `game`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tracker` ADD CONSTRAINT `FK_9a7e70bc7f2ffaa6672fa41bd09` FOREIGN KEY (`channel`) REFERENCES `communication_channel`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tracker` ADD CONSTRAINT `FK_4e47e0fcf025f3e8ff0b93e50c0` FOREIGN KEY (`game`) REFERENCES `game`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
