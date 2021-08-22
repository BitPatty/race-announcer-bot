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

import * as fs from 'fs';
import { Worker as WorkerThread } from 'worker_threads';
import { join as joinPaths } from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerEgressType,
  WorkerIngressType,
  WorkerType,
} from '../../models/enums';

import LoggerService from '../logger/logger.service';

class WorkerService<T extends WorkerType> {
  /**
   * The name of the script file used to start new wokrers
   *
   * Use the transpiled name here since that's the one
   * available to the execution context
   */
  private readonly scriptFileIdentifier = 'init-worker.js';

  /**
   * The worker thread instance
   */
  private worker: WorkerThread;

  /**
   * True if the worker thread has received
   * the exit signal
   */
  private isExiting: boolean;

  /**
   * True if the process has exited
   */
  private hasExited: boolean;

  /**
   * The identifier for this instance
   */
  public readonly identifier: string = uuidv4();

  public constructor(
    private readonly type: T,
    private readonly shutdownCallback: (err?: string) => void,
  ) {}

  /**
   * Checks if the init script exists and returns
   * the name of the init script file
   * @returns The name of the init script file
   */
  private getInitScriptName(): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readdir(__dirname, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        if (!files.includes(this.scriptFileIdentifier)) {
          reject('No match found');
          return;
        }

        resolve(this.scriptFileIdentifier);
      });
    });
  }

  /**
   * Returns true if the process has not exited
   */
  public get IsHealthy(): boolean {
    return !this.hasExited;
  }

  /**
   * Cleanup function when exiting the worker
   */
  private cleanupWorker(): Promise<void> {
    return new Promise((resolve) => {
      // If the worker has already exited,
      // don't even try to terminate the process
      if (this.hasExited) {
        LoggerService.warn('Worker already exited');
        resolve();
        return;
      }

      // Remove all event listeners
      // This is primarily to remove all handlers
      // from the 'exit' event
      this.worker.removeAllListeners();

      this.worker.on('message', (msg) => {
        if (msg === WorkerIngressType.CLEANUP_FINISHED)
          LoggerService.log('Cleanup finished');
      });

      // When the worker exits (no matter its exit code)
      // the cleanup can be considered done
      this.worker.on('exit', async () => {
        LoggerService.log('Worker exited');
        await this.worker.terminate();
        resolve();
      });

      // Trigger the cleanup process
      LoggerService.log(`Cleaning up worker`);
      this.worker.postMessage(WorkerEgressType.CLEANUP);
    });
  }

  /**
   * Starts the worker process
   */
  public async start(
    connector: SourceConnectorIdentifier | DestinationConnectorIdentifier,
  ): Promise<void> {
    const fileName = await this.getInitScriptName();
    const filePath = joinPaths(__dirname, fileName);

    this.worker = new WorkerThread(joinPaths(filePath), {
      argv: [this.type, connector],
    });

    // Clean up the worker on SIGTERM and SIGINT
    const disposeAndShutdown = (): void => {
      if (this.isExiting) {
        LoggerService.warn('Thread already exiting');
        return;
      }
      this.isExiting = true;
      this.dispose().finally(() => {
        LoggerService.log(`Shutdown successful for ${connector}`);
        this.shutdownCallback();
      });
    };

    // Process exit signals
    ['SIGTERM', 'SIGINT'].forEach((e) => {
      process.on(e, () => {
        LoggerService.log(
          `${e} => Shutting down worker ${this.identifier} for ${connector}`,
        );
        disposeAndShutdown();
      });
    });

    // Log worker events in main thread
    ['message', 'error', 'messageerror', 'online', 'exit'].forEach((e) => {
      this.worker.on(e, (err) => {
        LoggerService.log(
          `[Worker ${connector}|${this.identifier}] [${e}] ${err ?? ''}`,
        );

        if (e === 'exit') this.hasExited = true;
      });
    });
  }

  /**
   * Frees used resources and stops all tasks
   */
  public async dispose(): Promise<void> {
    await this.cleanupWorker();
  }
}

export default WorkerService;
