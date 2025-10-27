import { Inject, Service } from 'typedi';
import { LoggerService } from '@/config/winston.logger';
import { MediasoupSessionManager } from '../mediasoupSessionManager';

interface PeerInfo {
    id: string;
    name: string;
    userId?: string;
}

@Service('peerManager')
export class PeerManager {
    private peers: Map<string, PeerInfo> = new Map();

    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('mediasoupSessionManager') private sessionManager: MediasoupSessionManager,
    ) {}

    async addPeer(
        roomId: string,
        peerName: string,
        socketId: string,
        userId?: string,
    ): Promise<PeerInfo> {
        const peerId = `peer_${socketId}_${Date.now()}`;
        const peer: PeerInfo = {
            id: peerId,
            name: peerName,
            userId,
        };

        this.peers.set(socketId, peer);

        const peerData = {
            roomId,
            peerId,
            userId: userId || '',
            peerName,
            socketId,
            joinedAt: new Date().toISOString(),
        };

        await this.sessionManager.setPeer(socketId, peerData);
        await this.sessionManager.addPeerToRoom(roomId, socketId);

        return peer;
    }

    async getPeerBySocketId(socketId: string): Promise<{ roomId: string; peer: PeerInfo } | null> {
        const peerData = await this.sessionManager.getPeer(socketId);
        if (!peerData) {
            return null;
        }

        const peer: PeerInfo = {
            id: peerData.peerId,
            name: peerData.peerName,
            userId: peerData.userId,
        };

        return {
            roomId: peerData.roomId,
            peer,
        };
    }

    async getExistingPeersInRoom(
        roomId: string,
        excludeSocketId: string,
    ): Promise<Array<{ peerId: string; peerName: string; joinedAt: string }>> {
        const roomPeers = await this.sessionManager.getRoomPeers(roomId);
        const existingPeers: Array<{ peerId: string; peerName: string; joinedAt: string }> = [];

        for (const socketId of roomPeers) {
            if (socketId === excludeSocketId) continue;

            const peerData = await this.sessionManager.getPeer(socketId);
            if (peerData) {
                existingPeers.push({
                    peerId: peerData.peerId,
                    peerName: peerData.peerName,
                    joinedAt: peerData.joinedAt,
                });
            }
        }

        return existingPeers;
    }

    async removePeer(socketId: string): Promise<void> {
        this.peers.delete(socketId);
        await this.sessionManager.cleanupPeer(socketId);
    }

    getPeer(socketId: string): PeerInfo | null {
        return this.peers.get(socketId) || null;
    }

    getAllPeers(): Map<string, PeerInfo> {
        return new Map(this.peers);
    }
}
