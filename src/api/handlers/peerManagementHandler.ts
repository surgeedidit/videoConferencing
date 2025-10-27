import { Socket } from 'socket.io';
import { Inject, Service } from 'typedi';
import { LoggerService } from '@/config/winston.logger';
import { MediasoupService } from '@/services/mediasoupService';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket.types';

@Service('peerManagementHandler')
export class PeerManagementHandler {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('mediasoupService') private mediasoupService: MediasoupService,
    ) {}

    async handleGetPeers(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        try {
            const peerData = await this.mediasoupService.getPeerBySocketId(socket.id);
            if (!peerData) {
                this.logger.warn(`get-peers called by socket ${socket.id} but peer not found`);
                return;
            }

            const existingPeers = await this.mediasoupService.getExistingPeersInRoom(
                peerData.roomId,
                socket.id,
            );

            socket.emit('peers-list', {
                peers: existingPeers,
            });
        } catch (error) {
            this.logger.error(`Error getting peers: ${(error as Error).message}`);
        }
    }
}