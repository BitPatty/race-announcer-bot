import * as fs from 'fs';
import { Worker as WorkerThread } from 'worker_threads';
import { join as joinPaths } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

  private isExiting: boolean;
  private hasExited: boolean;

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

  public get IsHealthy(): boolean {
    return !this.hasExited;
  }

  /**
   * Cleanup function when exiting the worker
   */
  private cleanupWorker(): Promise<void> {
    return new Promise((resolve) => {
      if (this.hasExited) {
        resolve();
        return;
      }

      this.worker.removeAllListeners();

      this.worker.on('message', (msg) => {
        if (msg === WorkerIngressType.CLEANUP_FINISHED) resolve();
      });

      this.worker.on('exit', async () => {
        await this.worker.terminate();
        resolve();
      });

      Logger.log(`Cleaning up worker`);
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
      if (this.isExiting) return;
      this.isExiting = true;
      this.dispose().finally(() => {
        Logger.log(`Shutdown successful for ${connector}`);
        this.shutdownCallback();
      });
    };
    process.on('SIGTERM', () => {
      Logger.log(`SIGTERM => Shutting down worker for ${connector}`);
      disposeAndShutdown();
    });

    process.on('SIGINT', () => {
      Logger.log(`SIGINT => Shutting down worker for ${connector}`);
      disposeAndShutdown();
    });

    this.worker.on('message', (msg) => {
      Logger.log(`[Worker] message: ${msg}`);
    });

    this.worker.on('error', (err) => {
      Logger.log(`[Worker] error: ${err}`);
    });

    this.worker.on('messageerror', (err) => {
      Logger.log(`[Worker] message error: ${err}`);
    });

    this.worker.on('online', (err) => {
      Logger.log(`[Worker] online: ${err}`);
    });

    this.worker.on('exit', (err) => {
      Logger.log(`[Worker] exit: ${err}`);
      this.hasExited = true;
    });
  }

  public async dispose(): Promise<void> {
    await this.cleanupWorker();
  }
}

export default Worker;
