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
        LoggerService.log('Worker already exited');
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
      if (this.isExiting) return;
      this.isExiting = true;
      this.dispose().finally(() => {
        LoggerService.log(`Shutdown successful for ${connector}`);
        this.shutdownCallback();
      });
    };
    process.on('SIGTERM', () => {
      LoggerService.log(`SIGTERM => Shutting down worker for ${connector}`);
      disposeAndShutdown();
    });

    process.on('SIGINT', () => {
      LoggerService.log(`SIGINT => Shutting down worker for ${connector}`);
      disposeAndShutdown();
    });

    this.worker.on('message', (msg) => {
      LoggerService.log(`[Worker] message: ${msg}`);
    });

    this.worker.on('error', (err) => {
      LoggerService.log(`[Worker] error: ${err}`);
    });

    this.worker.on('messageerror', (err) => {
      LoggerService.log(`[Worker] message error: ${err}`);
    });

    this.worker.on('online', (err) => {
      LoggerService.log(`[Worker] online: ${err}`);
    });

    this.worker.on('exit', (err) => {
      LoggerService.log(`[Worker] exit: ${err}`);
      this.hasExited = true;
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
