import { Inject, Service } from 'typedi';
import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';
import { LoggerService } from '@/config/winston.logger';
import { mediasoupConfig } from '@/config/mediasoupConfig';

@Service('workerManager')
export class WorkerManager {
    private workers: Map<number, types.Worker> = new Map();
    private nextWorkerIndex = 0;

    constructor(@Inject('logger') private logger: LoggerService) {}

    async initialize(): Promise<void> {
        this.logger.info('Initializing WorkerManager...');
        await this.createWorker();
        this.logger.info('WorkerManager initialized successfully');
    }

    private async createWorkerWithRetry(retryCount = 0, maxRetries = 3): Promise<void> {
        try {
            await this.createWorker();
        } catch (error) {
            if (retryCount < maxRetries) {
                this.logger.warn(
                    `Worker creation failed, retrying... (${retryCount + 1}/${maxRetries})`,
                );
                await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                await this.createWorkerWithRetry(retryCount + 1, maxRetries);
            } else {
                this.logger.error(`Failed to create worker after ${maxRetries} retries`);
                throw error;
            }
        }
    }

    private async createWorker(): Promise<types.Worker> {
        const worker = await mediasoup.createWorker({
            logLevel: mediasoupConfig.worker.logLevel,
            logTags: mediasoupConfig.worker.logTags,
            rtcMinPort: mediasoupConfig.worker.rtcMinPort,
            rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
        });

        const workerId = this.workers.size;
        this.workers.set(workerId, worker);

        worker.on('died', async () => {
            this.logger.error(`Worker ${workerId} died`);
            this.workers.delete(workerId);

            try {
                await this.createWorkerWithRetry();
            } catch (replacementError) {
                this.logger.error(`Failed to create replacement worker: ${replacementError}`);
            }
        });

        this.logger.info(`Worker ${workerId} created with PID: ${worker.pid}`);
        return worker;
    }

    getWorker(): types.Worker {
        const workerEntries = Array.from(this.workers.entries());
        if (workerEntries.length === 0) {
            throw new Error('No workers available');
        }

        const [, worker] = workerEntries[this.nextWorkerIndex % workerEntries.length];
        this.nextWorkerIndex++;

        return worker;
    }

    isRouterOnDeadWorker(router: types.Router): boolean {
        try {
            return router.closed;
        } catch {
            return true;
        }
    }

    getAllWorkers(): Map<number, types.Worker> {
        return new Map(this.workers);
    }
}
