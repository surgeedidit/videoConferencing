import { LoggerService } from '@/config/winston.logger';
import { RoomJoinDataSchema, validateSocketData } from '@/schemas/socketValidation';
import { MediasoupService } from '@/services/mediasoupService';
import { RoomParticipantService } from '@/services/roomParticipantService';
import RoomService from '@/services/roomService';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket.types';
import { Socket } from 'socket.io';
import { Inject, Service } from 'typedi';

@Service('roomLifecycleHandler')
export class RoomLifecycleHandler {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('roomService') private roomService: RoomService,
        @Inject('roomParticipantService') private roomParticipantService: RoomParticipantService,
        @Inject('mediasoupService') private mediasoupService: MediasoupService,
    ) {}

    async handleJoinRoom(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(RoomJoinDataSchema, data);
            if (!validation.success) {
                socket.emit('join-room-error', {
                    message: `Validation error: ${validation.error}`,
                });
                return;
            }

            const { roomCode, userId, peerName } = validation.data;

            const room = await this.roomService.getRoomByCode(roomCode);
            if (!room) {
                socket.emit('join-room-error', { message: 'Room not found' });
                return;
            }

            const canJoinCheck = await this.roomParticipantService.validateUserCanJoinRoom(
                room.id,
                userId,
            );
            if (!canJoinCheck.canJoin) {
                socket.emit('join-room-error', {
                    message: canJoinCheck.reason || 'You are already in this room',
                });
                return;
            }

            await this.roomParticipantService.createParticipant(room.id, userId);
            await this.roomService.addParticipant(room.id, { userId });
            const router = await this.mediasoupService.getOrCreateRoom(room.id);
            const newPeer = await this.mediasoupService.addPeer(room.id, peerName, socket.id, userId);

            socket.join(room.id);
            socket.to(room.id).emit('new-peer', {
                peerId: newPeer.id,
                peerName: newPeer.name,
            });

            const existingProducers = await this.mediasoupService.getProducersInRoom(
                room.id,
                socket.id,
            );
            const existingPeers = await this.mediasoupService.getExistingPeersInRoom(
                room.id,
                socket.id,
            );
            socket.emit('join-room-success', {
                roomId: room.id,
                rtpCapabilities: router.rtpCapabilities,
                existingProducers,
                existingPeers,
            });
        } catch (error) {
            this.logger.error(`Error joining room: ${(error as Error).message}`);

           
            const errorMessage = (error as Error).message;
            let userMessage = 'Unable to join room. Please try again.';

            if (
                errorMessage.includes('Room not found') ||
                errorMessage.includes('does not exist')
            ) {
                userMessage = 'The room you are trying to join does not exist or has been deleted.';
            } else if (errorMessage.includes('already active')) {
                userMessage = 'You are already connected to this room.';
            } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
                userMessage = 'You do not have permission to join this room.';
            } else if (errorMessage.includes('full') || errorMessage.includes('capacity')) {
                userMessage = 'This room is currently full. Please try again later.';
            }

            socket.emit('join-room-error', { message: userMessage });
        }
    }

    async handleLeaveRoom(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        try {
            const peerData = await this.mediasoupService.getPeerBySocketId(socket.id);
            if (peerData) {
                if (peerData.peer.userId) {
                    await this.roomParticipantService.updateParticipantOnLeave(
                        peerData.roomId,
                        peerData.peer.userId,
                    );
                    await this.roomService.removeParticipant(peerData.roomId, {
                        userId: peerData.peer.userId,
                    });
                }

                socket.to(peerData.roomId).emit('peer-left', { peerId: peerData.peer.id });

                await this.mediasoupService.closePeer(socket.id);

                socket.leave(peerData.roomId);
            }

            // Always emit success response, even if peer data wasn't found
            socket.emit('leave-room-success');
        } catch (error) {
            this.logger.error(`Error leaving room: ${(error as Error).message}`);
            // Even on error, emit success to acknowledge the request
            socket.emit('leave-room-success');
        }
    }

    async handleDisconnect(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        try {
            const peerData = await this.mediasoupService.getPeerBySocketId(socket.id);
            if (peerData) {
                if (peerData.peer.userId) {
                    await this.roomParticipantService.updateParticipantOnLeave(
                        peerData.roomId,
                        peerData.peer.userId,
                    );
                    await this.roomService.removeParticipant(peerData.roomId, {
                        userId: peerData.peer.userId,
                    });
                }

                socket.to(peerData.roomId).emit('peer-left', { peerId: peerData.peer.id });
                await this.mediasoupService.closePeer(socket.id);
            }
        } catch (error) {
            this.logger.error(`Error during disconnect cleanup: ${(error as Error).message}`);
        }
    }
}