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

import * as PinoMultiStream from 'pino-multi-stream';

import { inspect } from 'util';
import ecsFormat from '@elastic/ecs-pino-format';
import pino from 'pino';
import pinoElastic from 'pino-elasticsearch';

import ConfigService from '../config/config.service';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

class LoggerService {
  private static readonly logger = pino(
    {
      level: ConfigService.logLevel,
      ...(ConfigService.elasticsearchConfiguration.url ? ecsFormat() : {}),
    },
    ConfigService.elasticsearchConfiguration.url
      ? PinoMultiStream.multistream([
          {
            level: ConfigService.logLevel,
            stream: process.stdout,
          },
          {
            level: ConfigService.logLevel,
            stream: pinoElastic({
              index: ConfigService.elasticsearchConfiguration.index,
              consistency: 'one',
              node: ConfigService.elasticsearchConfiguration.url,
              'es-version': ConfigService.elasticsearchConfiguration.version,
              'flush-bytes': 1000,
              ...(ConfigService.elasticsearchConfiguration.useDataStream
                ? {
                    op_type: 'create',
                  }
                : {}),
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

  private static stringifyArgs(args: any[]): string {
    try {
      if (!args || args.length === 0) return '';
      return `: ${inspect(args)}`;
    } catch (err) {
      return ': <Failed to stringify args>';
    }
  }

  private static logInt(
    logFn: (msg: string) => void,
    msg: string,
    args: any[],
  ): void {
    logFn.bind(this.logger)(
      `${this.logPrefix}${msg}${this.stringifyArgs(args)}`,
    );
  }

  public static log(msg: string, ...args: any[]): void {
    this.logInt(this.logger.info, msg, args);
  }

  public static warn(msg: string, ...args: any[]): void {
    this.logInt(this.logger.warn, msg, args);
  }

  public static debug(msg: string, ...args: any[]): void {
    this.logInt(this.logger.debug, msg, args);
  }

  public static trace(msg: string, ...args: any[]): void {
    this.logInt(this.logger.trace, msg, args);
  }

  public static error(msg: string, ...args: any[]): void {
    this.logInt(this.logger.error, msg, args);
  }

  public static fatal(msg: string): void {
    this.logInt(this.logger.fatal, msg, []);
  }
}

export default LoggerService;
