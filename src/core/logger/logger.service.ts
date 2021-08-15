import * as PinoMultiStream from 'pino-multi-stream';
import * as ecsFormat from '@elastic/ecs-pino-format';
import * as pinoElastic from 'pino-elasticsearch';

import pino from 'pino';

import ConfigService from '../config/config.service';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class LoggerService {
  private static readonly logger = pino(
    {
      level: ConfigService.logLevel,
      prettyPrint: ConfigService.logPrettyPrint,
      ...(ConfigService.elasticsearchUrl ? ecsFormat() : {}),
    },
    ConfigService.elasticsearchUrl
      ? PinoMultiStream.multistream([
          { stream: process.stdout },
          {
            stream: pinoElastic({
              index: ConfigService.elasticsearchIndexName,
              consistency: 'one',
              node: ConfigService.elasticsearchUrl,
              'es-version': ConfigService.elasticsearchVersion,
              'flush-bytes': 1000,
            }),
          },
        ])
      : undefined,
  );

  private static get logPrefix(): string {
    const workerName =
      process.env.WORKER_NAME != null ? `(${process.env.WORKER_NAME}) ` : '';

    return `[${ConfigService.instanceUuid}] ${workerName}`;
  }

  public static log(msg: string, ...args: any[]): void {
    this.logger.info(`${this.logPrefix}${msg}`, ...args);
  }

  public static warn(msg: string, ...args: any[]): void {
    this.logger.warn(`${this.logPrefix}${msg}`, ...args);
  }

  public static debug(msg: string, ...args: any[]): void {
    this.logger.debug(`${this.logPrefix}${msg}`, ...args);
  }

  public static error(msg: string, ...args: any[]): void {
    this.logger.error(`${this.logPrefix}${msg}`, ...args);
  }

  public static fatal(msg: string): void {
    this.logger.fatal(`${this.logPrefix}${msg}`);
  }
}

export default LoggerService;
