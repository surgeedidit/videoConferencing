import { Inject, Service } from 'typedi';
import { types } from 'mediasoup';
import { LoggerService } from '@/config/winston.logger';
import { RouterManager } from './routerManager';
import { MediasoupSessionManager } from '../mediasoupSessionManager';
import { mediasoupConfig } from '@/config/mediasoupConfig';

@Service('transportManager')
export class TransportManager {
    private transports: Map<string, types.WebRtcTransport> = new Map();

    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('routerManager') private routerManager: RouterManager,
        @Inject('mediasoupSessionManager') private sessionManager: MediasoupSessionManager,
    ) {}

    async createWebRtcTransport(
        socketId: string,
        producing: boolean,
    ): Promise<types.WebRtcTransport> {
        const peerData = await this.sessionManager.getPeer(socketId);
        if (!peerData) {
            throw new Error(`Peer not found for socket: ${socketId}`);
        }

        const router = this.routerManager.getRouter(peerData.roomId);
        if (!router) {
            throw new Error(`Router not found for room: ${peerData.roomId}`);
        }

        const transport = await router.createWebRtcTransport({
            ...mediasoupConfig.webRtcTransport,
        });

        this.transports.set(transport.id, transport);

        await this.sessionManager.addTransport(socketId, transport.id, producing);

        transport.on('routerclose', () => {
            this.transports.delete(transport.id);
        });

        return transport;
    }

    async connectWebRtcTransport(
        socketId: string,
        transportId: string,
        dtlsParameters: types.DtlsParameters,
    ): Promise<void> {
        const transport = this.getTransport(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        await transport.connect({ dtlsParameters });
    }

    getTransport(transportId: string): types.WebRtcTransport | null {
        return this.transports.get(transportId) || null;
    }

    async closeTransport(transportId: string): Promise<void> {
        const transport = this.transports.get(transportId);
        if (transport && !transport.closed) {
            transport.close();
        }
        this.transports.delete(transportId);
    }

    async closeAllTransportsForPeer(socketId: string): Promise<void> {
        const peerTransports = await this.sessionManager.getPeerTransports(socketId);

        for (const transportData of peerTransports) {
            await this.closeTransport(transportData.id);
            await this.sessionManager.removeTransport(socketId, transportData.id);
        }

    }

    getAllTransports(): Map<string, types.WebRtcTransport> {
        return new Map(this.transports);
    }
}
