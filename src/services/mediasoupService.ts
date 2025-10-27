import { Inject, Service } from 'typedi';
import { types } from 'mediasoup';
import { Server } from 'socket.io';
import { LoggerService } from '@/config/winston.logger';
import { WorkerManager } from './mediasoup/workerManager';
import { RouterManager } from './mediasoup/routerManager';
import { TransportManager } from './mediasoup/transportManager';
import { MediaManager } from './mediasoup/mediaManager';
import { PeerManager } from './mediasoup/peerManager';

interface PeerInfo {
    id: string;
    name: string;
    userId?: string;
}

interface ProducerInfo {
    id: string;
    kind: 'audio' | 'video';
    peerId: string;
}

@Service('mediasoupService')
export class MediasoupService {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('workerManager') private workerManager: WorkerManager,
        @Inject('routerManager') private routerManager: RouterManager,
        @Inject('transportManager') private transportManager: TransportManager,
        @Inject('mediaManager') private mediaManager: MediaManager,
        @Inject('peerManager') private peerManager: PeerManager,
    ) {}

    async initialize(): Promise<void> {
        await this.workerManager.initialize();
    }

    async getOrCreateRoom(roomId: string): Promise<types.Router> {
        return this.routerManager.getOrCreateRoom(roomId);
    }

    getRtpCapabilities(roomId: string): types.RtpCapabilities | null {
        return this.routerManager.getRtpCapabilities(roomId);
    }

    async createWebRtcTransport(
        socketId: string,
        producing: boolean,
    ): Promise<types.WebRtcTransport> {
        return this.transportManager.createWebRtcTransport(socketId, producing);
    }

    async connectWebRtcTransport(
        socketId: string,
        transportId: string,
        dtlsParameters: types.DtlsParameters,
    ): Promise<void> {
        return this.transportManager.connectWebRtcTransport(socketId, transportId, dtlsParameters);
    }

    async createProducer(
        io: Server,
        socketId: string,
        transportId: string,
        kind: 'audio' | 'video',
        rtpParameters: types.RtpParameters,
        appData?: any,
    ): Promise<types.Producer> {
        return this.mediaManager.createProducer(
            io,
            socketId,
            transportId,
            kind,
            rtpParameters,
            appData,
        );
    }

    async createConsumer(
        socketId: string,
        producerId: string,
        rtpCapabilities: types.RtpCapabilities,
    ): Promise<types.Consumer | null> {
        return this.mediaManager.createConsumer(socketId, producerId, rtpCapabilities);
    }

    resumeConsumer(socketId: string, consumerId: string): void {
        return this.mediaManager.resumeConsumer(socketId, consumerId);
    }

    async getProducersInRoom(roomId: string, excludeSocketId: string): Promise<ProducerInfo[]> {
        return this.mediaManager.getProducerInfoInRoom(roomId, excludeSocketId);
    }

    async addPeer(roomId: string, peerName: string, socketId: string, userId?: string): Promise<PeerInfo> {
        return await this.peerManager.addPeer(roomId, peerName, socketId, userId);
    }

    async getPeerBySocketId(socketId: string): Promise<{ roomId: string; peer: PeerInfo } | null> {
        return this.peerManager.getPeerBySocketId(socketId);
    }

    async getExistingPeersInRoom(
        roomId: string,
        excludeSocketId: string,
    ): Promise<Array<{ peerId: string; peerName: string; joinedAt: string }>> {
        return this.peerManager.getExistingPeersInRoom(roomId, excludeSocketId);
    }

    async closePeer(socketId: string): Promise<void> {
        await this.mediaManager.closeAllMediaForPeer(socketId);
        await this.transportManager.closeAllTransportsForPeer(socketId);
        await this.peerManager.removePeer(socketId);
    }

    async closeRoom(roomId: string): Promise<void> {
        return this.routerManager.closeRoom(roomId);
    }
}
