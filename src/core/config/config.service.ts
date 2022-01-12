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

import * as Joi from 'joi';
import { ConnectionOptions } from 'typeorm';
import { join as joinPaths } from 'path';
import { v4 as uuidV4 } from 'uuid';

import LogLevel from '../logger/log-level.enum';

import { getEnumValues } from '../../utils/enum.utils';

class ConfigService {
  /**
   * The validated environment configuration
   */
  private static readonly environmentConfiguration =
    ConfigService.validateEnv();

  private static readonly _instanceUuid: string = uuidV4();

  /**
   * Load the database configuration from the current enviroment
   */
  public static get databaseConfiguration(): ConnectionOptions {
    return {
      database: this.environmentConfiguration.DATABASE_NAME,
      type: this.environmentConfiguration.DATABASE_TYPE,
      host: this.environmentConfiguration.DATABASE_HOST,
      port: this.environmentConfiguration.DATABASE_PORT,
      username: this.environmentConfiguration.DATABASE_USER,
      password: this.environmentConfiguration.DATABASE_PASSWORD,
      synchronize: Boolean(this.environmentConfiguration.DATABASE_SYNCHRONIZE),
      charset: 'utf8mb4_unicode_ci',
      entities: [
        joinPaths(
          __dirname,
          '..',
          '..',
          'models',
          'entities',
          '*.entity.{ts,js}',
        ),
      ],
      migrations: [joinPaths(__dirname, '..', '..', 'migrations', '*.{js,ts}')],
      logging: this.environmentConfiguration.DATABASE_LOGGING,
    } as ConnectionOptions;
  }

  public static get redisConfiguration(): {
    host: string;
    password: string;
    port: number;
  } {
    return {
      host: this.environmentConfiguration.REDIS_HOST,
      port: +this.environmentConfiguration.REDIS_PORT,
      password: this.environmentConfiguration.REDIS_PASSWORD,
    };
  }

  // Connector configurations

  public static get discordToken(): string {
    return this.environmentConfiguration.DISCORD_BOT_TOKEN;
  }

  public static get discordClientId(): string {
    return this.environmentConfiguration.DISCORD_CLIENT_ID;
  }

  public static get discordGlobalAdmins(): string[] {
    return (
      (this.environmentConfiguration.DISCORD_GLOBAL_ADMINS as string) ?? ''
    )
      .split(',')
      .filter((a) => a.length > 3);
  }

  public static get speedRunsLiveBaseUrl(): string {
    return this.environmentConfiguration.SRL_BASE_URL;
  }

  public static get speedRunsLiveApiBaseUrl(): string {
    return this.environmentConfiguration.SRL_API_BASE_URL;
  }

  public static get raceTimeBaseUrl(): string {
    return this.environmentConfiguration.RACETIME_BASE_URL;
  }

  public static get raceSyncInterval(): string {
    return this.environmentConfiguration.RACE_SYNC_INTERVAL;
  }

  public static get gameSyncInterval(): string {
    return this.environmentConfiguration.GAME_SYNC_INTERVAL;
  }

  public static get announcementSyncInterval(): string {
    return this.environmentConfiguration.ANNOUNCEMENT_SYNC_INTERVAL;
  }

  public static get logLevel(): LogLevel {
    return this.environmentConfiguration.LOG_LEVEL as LogLevel;
  }

  public static get instanceUuid(): string {
    return this._instanceUuid;
  }

  public static get workerHealthCheckInterval(): string {
    return this.environmentConfiguration.WORKER_HEALTH_CHECK_INTERVAL;
  }

  /**
   * Gets the elasticsearch configuration
   */
  public static get elasticsearchConfiguration(): {
    url: string | null;
    index: string;
    version: number;
    useDataStream: boolean;
  } {
    return {
      url: this.environmentConfiguration.ELASTICSEARCH_URL || null,
      index: this.environmentConfiguration.ELASTICSEARCH_INDEX,
      version: +this.environmentConfiguration.ELASTICSEARCH_VERSION,
      useDataStream: Boolean(
        this.environmentConfiguration.ELASTICSEARCH_USE_DATASTREAM,
      ),
    };
  }

  /**
   * Validates the environment configuration
   * @returns The validate environment configuration
   */
  private static validateEnv(): { [_: string]: string } {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
      APP_NAME: Joi.string().default('Race-Announcer-Bot'),
      DATABASE_HOST: Joi.string().required(),
      DATABASE_USER: Joi.string().required(),
      DATABASE_PASSWORD: Joi.string().required(),
      DATABASE_NAME: Joi.string().required(),
      DATABASE_TYPE: Joi.valid('mysql', 'mariadb').default('mysql'),
      DATABASE_PORT: Joi.number().default(3306),
      DATABASE_LOGGING: Joi.string().default(LogLevel.INFO),
      DATABASE_SYNCHRONIZE: Joi.boolean()
        .truthy('1', 'true', 1)
        .falsy('', 'false', '0', 0)
        .default(false),
      DISCORD_BOT_TOKEN: Joi.string().required(),
      DISCORD_CLIENT_ID: Joi.string().required(),
      DISCORD_GLOBAL_ADMINS: Joi.string().default(null),
      SRL_BASE_URL: Joi.string().uri().default('https://speedrunslive.com'),
      SRL_API_BASE_URL: Joi.string()
        .uri()
        .default('https://www.speedrunslive.com/api'),
      RACETIME_BASE_URL: Joi.string().uri().default('https://racetime.gg'),
      ANNOUNCEMENT_SYNC_INTERVAL: Joi.string().default('5/15 * * * * *'),
      RACE_SYNC_INTERVAL: Joi.string().default('*/15 * * * * *'),
      GAME_SYNC_INTERVAL: Joi.string().default('0 0 * * * *'),
      LOG_LEVEL: Joi.string()
        .valid(...getEnumValues(LogLevel))
        .default(LogLevel.DEBUG),
      WORKER_HEALTH_CHECK_INTERVAL: Joi.string().default('*/10 * * * * *'),
      REDIS_HOST: Joi.string().required(),
      REDIS_PASSWORD: Joi.string().required(),
      REDIS_PORT: Joi.number().required(),
      ELASTICSEARCH_URL: Joi.string().uri().optional(),
      ELASTICSEARCH_INDEX: Joi.string().default('race-announcer-bot'),
      ELASTICSEARCH_VERSION: Joi.number().default(7),
      ELASTICSEARCH_USE_DATASTREAM: Joi.boolean().default(false),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      process.env,
      {
        allowUnknown: true,
      },
    );

    if (error) {
      /* eslint-disable-next-line no-console */
      console.error(`Config validation error: ${error.message}`);
      process.exit(1);
    }

    return validatedEnvConfig;
  }
}

export default ConfigService;
