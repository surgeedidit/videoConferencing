import { Inject, Service } from 'typedi';
import { types } from 'mediasoup';
import { Server } from 'socket.io';
import { LoggerService } from '@/config/winston.logger';
import { RouterManager } from './routerManager';
import { TransportManager } from './transportManager';
import { PeerManager } from './peerManager';
import { MediasoupSessionManager } from '../mediasoupSessionManager';

interface ProducerInfo {
    id: string;
    kind: 'audio' | 'video';
    peerId: string;
}


@Service('mediaManager')
export class MediaManager {
    private producers: Map<string, types.Producer> = new Map();
    private consumers: Map<string, types.Consumer> = new Map();


    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('routerManager') private routerManager: RouterManager,
        @Inject('transportManager') private transportManager: TransportManager,
        @Inject('peerManager') private peerManager: PeerManager,
        @Inject('mediasoupSessionManager') private sessionManager: MediasoupSessionManager,
    ) {}

    async createProducer(
        io: Server,
        socketId: string,
        transportId: string,
        kind: 'audio' | 'video',
        rtpParameters: types.RtpParameters,
        appData?: any,
    ): Promise<types.Producer> {
        const transport = this.transportManager.getTransport(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        const peerData = await this.sessionManager.getPeer(socketId);
        if (!peerData) {
            throw new Error(`Peer not found for socket: ${socketId}`);
        }

        const producer = await transport.produce({
            kind,
            rtpParameters,
            appData: { ...appData, peerId: peerData.peerId, socketId },
        });

        this.producers.set(producer.id, producer);

        await this.sessionManager.addProducer(socketId, producer.id, kind, peerData.peerId);

        producer.on('transportclose', () => {
            this.producers.delete(producer.id);
        });

        io.to(peerData.roomId).emit('new-producer', {
            producerId: producer.id,
            peerId: peerData.peerId,
            kind,
        });

        return producer;
    }

    async createConsumer(
        socketId: string,
        producerId: string,
        rtpCapabilities: types.RtpCapabilities,
    ): Promise<types.Consumer | null> {
        const producer = this.producers.get(producerId);
        if (!producer) {
            throw new Error(`Producer ${producerId} not found`);
        }

        const peerData = await this.sessionManager.getPeer(socketId);
        if (!peerData) {
            throw new Error(`Peer not found for socket: ${socketId}`);
        }

        const router = this.routerManager.getRouter(peerData.roomId);
        if (!router) {
            throw new Error(`Router not found for room: ${peerData.roomId}`);
        }

        if (!router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error(`Incompatible RTP capabilities for producer ${producerId}`);
        }

        const peerTransports = await this.sessionManager.getPeerTransports(socketId);
        const consumingTransports = [];

        for (const transportData of peerTransports) {
            if (transportData && !transportData.producing) {
                consumingTransports.push(transportData.id);
            }
        }

        if (consumingTransports.length === 0) {
            throw new Error(`No consuming transport available for peer`);
        }

        const transportId = consumingTransports[0];
        const transport = this.transportManager.getTransport(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true,
        });

        this.consumers.set(consumer.id, consumer);

        await this.sessionManager.addConsumer(socketId, consumer.id);

        consumer.on('transportclose', () => {
            this.consumers.delete(consumer.id);
        });

        consumer.on('producerclose', () => {
            this.consumers.delete(consumer.id);
        });

        return consumer;
    }

    resumeConsumer(socketId: string, consumerId: string): void {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) {
            throw new Error(`Consumer not found: ${consumerId}`);
        }

        consumer.resume();
    }

    async getProducerInfoInRoom(roomId: string, excludeSocketId: string): Promise<ProducerInfo[]> {
        const roomPeers = await this.sessionManager.getRoomPeers(roomId);
        const producers: ProducerInfo[] = [];

        for (const socketId of roomPeers) {
            if (socketId === excludeSocketId) continue;

            const peerProducers = await this.sessionManager.getPeerProducers(socketId);
            const peerData = await this.sessionManager.getPeer(socketId);

            if (peerData) {
                for (const producerId of peerProducers) {
                    const producerMetadata =
                        await this.sessionManager.getProducerMetadata(producerId);
                    if (producerMetadata) {
                        producers.push({
                            id: producerMetadata.id,
                            kind: producerMetadata.kind,
                            peerId: producerMetadata.peerId,
                        });
                    }
                }
            }
        }

        return producers;
    }

    async closeProducer(producerId: string): Promise<void> {
        const producer = this.producers.get(producerId);
        if (producer && !producer.closed) {
            producer.close();
        }
        this.producers.delete(producerId);
    }

    async closeConsumer(consumerId: string): Promise<void> {
        const consumer = this.consumers.get(consumerId);
        if (consumer && !consumer.closed) {
            consumer.close();
        }
        this.consumers.delete(consumerId);
    }


    async closeAllMediaForPeer(socketId: string): Promise<void> {
        const peerProducers = await this.sessionManager.getPeerProducers(socketId);
        const peerConsumers = await this.sessionManager.getPeerConsumers(socketId);

        for (const producerId of peerProducers) {
            await this.closeProducer(producerId);
            await this.sessionManager.removeProducer(socketId, producerId);
        }

        for (const consumerId of peerConsumers) {
            await this.closeConsumer(consumerId);
            await this.sessionManager.removeConsumer(socketId, consumerId);
        }

    }

    getAllProducers(): Map<string, types.Producer> {
        return new Map(this.producers);
    }

    getAllConsumers(): Map<string, types.Consumer> {
        return new Map(this.consumers);
    }
}
