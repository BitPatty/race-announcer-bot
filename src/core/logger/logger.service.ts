import pino from 'pino';

import ConfigService from '../config/config.service';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class LoggerService {
  private static readonly logger = pino({
    level: ConfigService.logLevel,
    prettyPrint: true,
  });

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
}

export default LoggerService;
