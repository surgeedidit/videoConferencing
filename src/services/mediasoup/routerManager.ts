import { Inject, Service } from 'typedi';
import { types } from 'mediasoup';
import { LoggerService } from '@/config/winston.logger';
import { WorkerManager } from './workerManager';
import { MediasoupSessionManager } from '../mediasoupSessionManager';
import { mediasoupConfig } from '@/config/mediasoupConfig';

@Service('routerManager')
export class RouterManager {
    private routers: Map<string, types.Router> = new Map();
    private roomCreationLocks: Map<string, Promise<types.Router>> = new Map();

    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('workerManager') private workerManager: WorkerManager,
        @Inject('mediasoupSessionManager') private sessionManager: MediasoupSessionManager,
    ) {}

    async getOrCreateRoom(roomId: string): Promise<types.Router> {
        if (this.roomCreationLocks.has(roomId)) {
            return this.roomCreationLocks.get(roomId)!;
        }

        let router = this.routers.get(roomId);
        if (router && !this.workerManager.isRouterOnDeadWorker(router)) {
            return router;
        }

        if (router && this.workerManager.isRouterOnDeadWorker(router)) {
            this.routers.delete(roomId);
            await this.sessionManager.cleanupRoom(roomId);
        }

        const creationPromise = this.createRouterForRoomWithCleanup(roomId);
        this.roomCreationLocks.set(roomId, creationPromise);

        try {
            router = await creationPromise;
            return router;
        } finally {
            this.roomCreationLocks.delete(roomId);
        }
    }

    private async createRouterForRoomWithCleanup(roomId: string): Promise<types.Router> {
        try {
            return await this.createRouterForRoom(roomId);
        } catch (error) {
            this.routers.delete(roomId);
            await this.sessionManager.cleanupRoom(roomId);
            throw error;
        }
    }

    private async createRouterForRoom(roomId: string): Promise<types.Router> {
        const worker = this.workerManager.getWorker();
        const router = await worker.createRouter({
            mediaCodecs: mediasoupConfig.router.mediaCodecs,
        });

        this.routers.set(roomId, router);

        router.on('workerclose', async () => {
            this.routers.delete(roomId);
            await this.sessionManager.cleanupRoom(roomId);
        });

        return router;
    }

    getRtpCapabilities(roomId: string): types.RtpCapabilities | null {
        const router = this.routers.get(roomId);
        if (!router || this.workerManager.isRouterOnDeadWorker(router)) {
            return null;
        }
        return router.rtpCapabilities;
    }

    getRouter(roomId: string): types.Router | null {
        const router = this.routers.get(roomId);
        if (!router || this.workerManager.isRouterOnDeadWorker(router)) {
            return null;
        }
        return router;
    }

    async closeRoom(roomId: string): Promise<void> {
        const router = this.routers.get(roomId);
        if (router && !router.closed) {
            router.close();
        }

        this.routers.delete(roomId);
        await this.sessionManager.cleanupRoom(roomId);
    }

    getAllRooms(): Map<string, types.Router> {
        return new Map(this.routers);
    }
}
