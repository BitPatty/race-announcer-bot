import * as Joi from 'joi';
import { ConnectionOptions } from 'typeorm';
import { join as joinPaths } from 'path';

class ConfigService {
  /**
   * The validated environment configuration
   */
  private static environmentConfiguration = ConfigService.validateEnv();

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
          'domain',
          'models',
          '*.entity.{ts,js}',
        ),
      ],
      logging: this.environmentConfiguration.DATABASE_LOGGING,
    } as ConnectionOptions;
  }

  // Connector configurations

  public static get discordToken(): string {
    return this.environmentConfiguration.DISCORD_BOT_TOKEN;
  }

  public static get speedRunsLiveBaseUrl(): string {
    return this.environmentConfiguration.SRL_BASE_URL;
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
      RACETIME_BASE_URL: Joi.string().uri().default('https://racetime.gg'),
      RACE_SYNC_INTERVAL: Joi.string().default('*/30 * * * * *'),
      GAME_SYNC_INTERVAL: Joi.string().default('0 0 * * * *'),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      process.env,
      {
        allowUnknown: true,
      },
    );

    if (error) {
      console.error(`Config validation error: ${error.message}`);
      process.exit(1);
    }

    return validatedEnvConfig;
  }
}

export default ConfigService;
