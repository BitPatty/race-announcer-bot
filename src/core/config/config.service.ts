import * as Joi from 'joi';
import { ConnectionOptions } from 'typeorm';
import { join as joinPaths } from 'path';
import { v4 as uuidV4 } from 'uuid';

import LogLevel from '../../models/enums/log-level.enum';

class ConfigService {
  /**
   * The validated environment configuration
   */
  private static readonly environmentConfiguration =
    ConfigService.validateEnv();

  private static readonly _instanceUuid: string = uuidV4();

  /**
   * Load the database configuration from the
   * current enviroment
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
      migrations: [joinPaths(__dirname, '..', '..', 'migrations', '*.js')],
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

  public static get logPrettyPrint(): boolean {
    return this.environmentConfiguration.LOG_PRETTY_PRINT as unknown as boolean;
  }

  public static get instanceUuid(): string {
    return this._instanceUuid;
  }

  public static get workerHealthCheckInterval(): string {
    return this.environmentConfiguration.WORKER_HEALTH_CHECK_INTERVAL;
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
      STAGE: Joi.string().default('production'),
      PORT: Joi.number().default(3000),
      APP_NAME: Joi.string().default('Race-Announcer-Bot'),
      DATABASE_HOST: Joi.string().required(),
      DATABASE_USER: Joi.string().required(),
      DATABASE_PASSWORD: Joi.string().required(),
      DATABASE_NAME: Joi.string().required(),
      DATABASE_TYPE: Joi.string().default('mysql'),
      DATABASE_PORT: Joi.number().default(3306),
      DATABASE_LOGGING: Joi.string().default('error'),
      DATABASE_SYNCHRONIZE: Joi.boolean()
        .truthy('1', 'true', 1)
        .falsy('', 'false', '0', 0)
        .default(false),
      DISCORD_BOT_TOKEN: Joi.string().required(),
      SRL_BASE_URL: Joi.string().uri().default('https://speedrunslive.com'),
      SRL_API_BASE_URL: Joi.string()
        .uri()
        .default('https://api.speedrunslive.com'),
      RACETIME_BASE_URL: Joi.string().uri().default('https://racetime.gg'),
      ANNOUNCEMENT_SYNC_INTERVAL: Joi.string().default('5/15 * * * * *'),
      RACE_SYNC_INTERVAL: Joi.string().default('*/15 * * * * *'),
      GAME_SYNC_INTERVAL: Joi.string().default('0 0 * * * *'),
      LOG_LEVEL: Joi.string().default(LogLevel.DEBUG),
      LOG_PRETTY_PRINT: Joi.boolean().default(false),
      WORKER_HEALTH_CHECK_INTERVAL: Joi.string().default('*/10 * * * * *'),
      REDIS_HOST: Joi.string().required(),
      REDIS_PASSWORD: Joi.string().required(),
      REDIS_PORT: Joi.number().required(),
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
