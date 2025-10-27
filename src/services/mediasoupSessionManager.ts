import { Inject, Service } from 'typedi';
import { Redis } from 'ioredis';
import { LoggerService } from '@/config/winston.logger';

export interface PeerData {
    roomId: string;
    peerId: string;
    userId: string;
    peerName: string;
    socketId: string;
    joinedAt: string;
}

export interface MediasoupTransport {
    id: string;
    producing: boolean;
}

export interface ProducerMetadata {
    id: string;
    kind: 'audio' | 'video';
    peerId: string;
    socketId: string;
}

@Service('mediasoupSessionManager')
export class MediasoupSessionManager {
    private readonly PEER_PREFIX = 'peer:';
    private readonly ROOM_PREFIX = 'room:';
    private readonly TRANSPORT_PREFIX = 'transport:';
    private readonly PRODUCER_PREFIX = 'producer:';
    private readonly CONSUMER_PREFIX = 'consumer:';
    private readonly TTL = 3600;

    constructor(
        @Inject('redis') private redis: Redis,
        @Inject('logger') private logger: LoggerService,
    ) {}

    async setPeer(socketId: string, peerData: PeerData): Promise<void> {
        const key = `${this.PEER_PREFIX}${socketId}`;
        await this.redis.setex(key, this.TTL, JSON.stringify(peerData));
    }

    async getPeer(socketId: string): Promise<PeerData | null> {
        const key = `${this.PEER_PREFIX}${socketId}`;
        const data = await this.redis.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.error(`Failed to parse peer data for ${socketId}: ${error}`);
            await this.redis.del(key);
            return null;
        }
    }

    async deletePeer(socketId: string): Promise<void> {
        const key = `${this.PEER_PREFIX}${socketId}`;
        await this.redis.del(key);
    }

    async setRoomRouter(roomId: string, routerId: string): Promise<void> {
        const key = `${this.ROOM_PREFIX}${roomId}:router`;
        await this.redis.setex(key, this.TTL, routerId);
    }

    async getRoomRouter(roomId: string): Promise<string | null> {
        const key = `${this.ROOM_PREFIX}${roomId}:router`;
        return this.redis.get(key);
    }

    async deleteRoomRouter(roomId: string): Promise<void> {
        const key = `${this.ROOM_PREFIX}${roomId}:router`;
        await this.redis.del(key);
    }

    async addPeerToRoom(roomId: string, socketId: string): Promise<void> {
        const key = `${this.ROOM_PREFIX}${roomId}:peers`;
        await this.redis.sadd(key, socketId);
        await this.redis.expire(key, this.TTL);
    }

    async removePeerFromRoom(roomId: string, socketId: string): Promise<void> {
        const key = `${this.ROOM_PREFIX}${roomId}:peers`;
        await this.redis.srem(key, socketId);
    }

    async getRoomPeers(roomId: string): Promise<string[]> {
        const key = `${this.ROOM_PREFIX}${roomId}:peers`;
        return this.redis.smembers(key);
    }

    async addTransport(socketId: string, transportId: string, producing: boolean): Promise<void> {
        const transportKey = `${this.TRANSPORT_PREFIX}${transportId}`;
        const peerTransportsKey = `${this.PEER_PREFIX}${socketId}:transports`;

        const transport: MediasoupTransport = { id: transportId, producing };

        const pipeline = this.redis.pipeline();
        pipeline.setex(transportKey, this.TTL, JSON.stringify(transport));
        pipeline.sadd(peerTransportsKey, transportId);
        pipeline.expire(peerTransportsKey, this.TTL);
        await pipeline.exec();
    }

    async removeTransport(socketId: string, transportId: string): Promise<void> {
        const transportKey = `${this.TRANSPORT_PREFIX}${transportId}`;
        const peerTransportsKey = `${this.PEER_PREFIX}${socketId}:transports`;

        const pipeline = this.redis.pipeline();
        pipeline.del(transportKey);
        pipeline.srem(peerTransportsKey, transportId);
        await pipeline.exec();
    }

    async getPeerTransports(socketId: string): Promise<MediasoupTransport[]> {
        const peerTransportsKey = `${this.PEER_PREFIX}${socketId}:transports`;
        const transportIds = await this.redis.smembers(peerTransportsKey);

        if (transportIds.length === 0) {
            return [];
        }

        const transportKeys = transportIds.map((id) => `${this.TRANSPORT_PREFIX}${id}`);
        const transportData = await this.redis.mget(...transportKeys);

        const validTransports: MediasoupTransport[] = [];
        const invalidTransportIds: string[] = [];

        for (let i = 0; i < transportData.length; i++) {
            const data = transportData[i];
            const transportId = transportIds[i];

            if (!data) {
                invalidTransportIds.push(transportId);
                continue;
            }

            try {
                const transport = JSON.parse(data);
                validTransports.push(transport);
            } catch (error) {
                this.logger.error(`Failed to parse transport data for ${transportId}: ${error}`);
                invalidTransportIds.push(transportId);
            }
        }

        if (invalidTransportIds.length > 0) {
            await this.redis.srem(peerTransportsKey, ...invalidTransportIds);
        }

        return validTransports;
    }

    async addProducer(
        socketId: string,
        producerId: string,
        kind: 'audio' | 'video',
        peerId: string,
    ): Promise<void> {
        const producerMetadata: ProducerMetadata = {
            id: producerId,
            kind,
            peerId,
            socketId,
        };

        const producerKey = `${this.PRODUCER_PREFIX}${producerId}`;
        const peerProducersKey = `${this.PEER_PREFIX}${socketId}:producers`;

        const pipeline = this.redis.pipeline();
        pipeline.setex(producerKey, this.TTL, JSON.stringify(producerMetadata));
        pipeline.sadd(peerProducersKey, producerId);
        pipeline.expire(peerProducersKey, this.TTL);
        await pipeline.exec();
    }

    async removeProducer(socketId: string, producerId: string): Promise<void> {
        const producerKey = `${this.PRODUCER_PREFIX}${producerId}`;
        const peerProducersKey = `${this.PEER_PREFIX}${socketId}:producers`;

        const pipeline = this.redis.pipeline();
        pipeline.del(producerKey);
        pipeline.srem(peerProducersKey, producerId);
        await pipeline.exec();
    }

    async getPeerProducers(socketId: string): Promise<string[]> {
        const key = `${this.PEER_PREFIX}${socketId}:producers`;
        return this.redis.smembers(key);
    }

    async getProducerMetadata(producerId: string): Promise<ProducerMetadata | null> {
        const key = `${this.PRODUCER_PREFIX}${producerId}`;
        const data = await this.redis.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.error(`Failed to parse producer metadata for ${producerId}: ${error}`);
            await this.redis.del(key);
            return null;
        }
    }

    async addConsumer(socketId: string, consumerId: string): Promise<void> {
        const key = `${this.PEER_PREFIX}${socketId}:consumers`;
        await this.redis.sadd(key, consumerId);
        await this.redis.expire(key, this.TTL);
    }

    async removeConsumer(socketId: string, consumerId: string): Promise<void> {
        const key = `${this.PEER_PREFIX}${socketId}:consumers`;
        await this.redis.srem(key, consumerId);
    }

    async getPeerConsumers(socketId: string): Promise<string[]> {
        const key = `${this.PEER_PREFIX}${socketId}:consumers`;
        return this.redis.smembers(key);
    }

    async cleanupPeer(socketId: string): Promise<void> {
        const peerData = await this.getPeer(socketId);

        const transportIds = await this.redis.smembers(`${this.PEER_PREFIX}${socketId}:transports`);
        const producerIds = await this.redis.smembers(`${this.PEER_PREFIX}${socketId}:producers`);

        const pipeline = this.redis.pipeline();

        if (peerData) {
            pipeline.srem(`${this.ROOM_PREFIX}${peerData.roomId}:peers`, socketId);
        }

        const keys = [
            `${this.PEER_PREFIX}${socketId}`,
            `${this.PEER_PREFIX}${socketId}:transports`,
            `${this.PEER_PREFIX}${socketId}:producers`,
            `${this.PEER_PREFIX}${socketId}:consumers`,
        ];

        keys.forEach((key) => pipeline.del(key));

        transportIds.forEach((transportId) => {
            pipeline.del(`${this.TRANSPORT_PREFIX}${transportId}`);
        });

        producerIds.forEach((producerId) => {
            pipeline.del(`${this.PRODUCER_PREFIX}${producerId}`);
        });

        await pipeline.exec();
    }

    async cleanupRoom(roomId: string): Promise<void> {
        const pipeline = this.redis.pipeline();

        const keys = [`${this.ROOM_PREFIX}${roomId}:router`, `${this.ROOM_PREFIX}${roomId}:peers`];

        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
    }
}
