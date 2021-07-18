import * as fs from 'fs';
import { Worker as WorkerThread } from 'worker_threads';
import { join as joinPaths } from 'path';

import {
  DestinationConnectorIdentifier,
  SourceConnectorIdentifier,
  WorkerIngressType,
  WorkerType,
} from '../../models/enums';
import Logger from '../logger/logger';
import WorkerEgressType from '../../models/enums/worker-egress-type.enum';

class Worker<T extends WorkerType> {
  private readonly scriptFileIdentifier = 'init-worker.js';
  private worker: WorkerThread;
  public constructor(private readonly type: T) {}

  /**
   * Checks if the init script exists and returns
   * the name of the init script file
   * @returns The name of the init script file
   */
  private getInitScriptName = (): Promise<string> => {
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
  };

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

    /**
     * Cleanup function when exiting the worker
     */
    const cleanupWorker = (): Promise<void> => {
      return new Promise((resolve) => {
        this.worker.removeAllListeners('message');
        this.worker.removeAllListeners('exit');

        this.worker.on('message', (msg) => {
          if (msg === WorkerIngressType.CLEANUP_FINISHED) resolve();
        });

        this.worker.on('exit', () => {
          resolve();
        });

        Logger.log('Cleaning up worker');
        this.worker.postMessage(WorkerEgressType.CLEANUP);
      });
    };

    // Clean up the worker on SIGTERM and SIGINT
    process.on('SIGTERM', () => {
      Logger.log('SIGTERM => Shutting down worker');
      cleanupWorker().finally(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      Logger.log('SIGINT => Shutting down worker');
      cleanupWorker().finally(() => process.exit(0));
    });

    this.worker.on('message', (msg) => {
      Logger.log(`[Worker] message: ${msg}`);
    });

    this.worker.on('error', (err) => {
      Logger.log(`[Worker] message: ${err}`);
    });

    this.worker.on('messageerror', (err) => {
      Logger.log(`[Worker] message: ${err}`);
    });

    this.worker.on('online', (err) => {
      Logger.log(`[Worker] message: ${err}`);
    });

    this.worker.on('exit', (err) => {
      Logger.log(`[Worker] message: ${err}`);
    });
  }
}

export default Worker;
