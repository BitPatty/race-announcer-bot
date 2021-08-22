/**
 * Race Announcer Bot - A race announcer bot for speedrunners
 * Copyright (C) 2021 Matteias Collet <matteias.collet@bluewin.ch>
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
