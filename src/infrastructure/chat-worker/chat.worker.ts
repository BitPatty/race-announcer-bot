import * as fs from 'fs';
import {
  DestinationConnectorIdentifier,
  WorkerIngressType,
} from '../../domain/enums';
import { Worker } from 'worker_threads';
import { join as joinPaths } from 'path';
import WorkerEgressType from '../../domain/enums/worker-egress-type.enum';

class ChatWorker {
  private readonly scriptFileIdentifier = 'init-worker.js';
  private worker: Worker;

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

  public async start(): Promise<void> {
    const fileName = await this.getInitScriptName();
    const filePath = joinPaths(__dirname, fileName);

    this.worker = new Worker(joinPaths(filePath), {
      argv: [DestinationConnectorIdentifier.DISCORD],
    });

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

        console.log('Cleaning up worker');
        this.worker.postMessage(WorkerEgressType.CLEANUP);
      });
    };

    process.on('SIGTERM', () => {
      console.log('SIGTERM => Shutting down worker');
      cleanupWorker().finally(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('SIGINT => Shutting down worker');
      cleanupWorker().finally(() => process.exit(0));
    });

    this.worker.on('message', (msg) => {
      console.log('[Worker] message: ', msg);
    });

    this.worker.on('error', (err) => {
      console.log('[Worker] error: ', err);
    });

    this.worker.on('messageerror', (err) => {
      console.log('[Worker] messageerror', err);
    });

    this.worker.on('online', (err) => {
      console.log('[Worker] online', err);
    });

    this.worker.on('exit', (err) => {
      console.error(`[Worker] exit: `, err);
    });
  }
}

export default ChatWorker;
