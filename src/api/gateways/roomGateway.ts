import { Server, Socket } from 'socket.io';
import { Inject, Service } from 'typedi';
import { LoggerService } from '@/config/winston.logger';
import { RoomLifecycleHandler } from '@/api/handlers/roomLifecycleHandler';
import { WebRtcTransportHandler } from '@/api/handlers/webRtcTransportHandler';
import { MediaHandler } from '@/api/handlers/mediaHandler';
import { PeerManagementHandler } from '@/api/handlers/peerManagementHandler';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket.types';

@Service('roomGateway')
export default class RoomGateway {
    private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('roomLifecycleHandler') private roomLifecycleHandler: RoomLifecycleHandler,
        @Inject('webRtcTransportHandler') private webRtcTransportHandler: WebRtcTransportHandler,
        @Inject('mediaHandler') private mediaHandler: MediaHandler,
        @Inject('peerManagementHandler') private peerManagementHandler: PeerManagementHandler,
    ) {}

    initialize(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
        this.io = io;
        this.logger.info('Room Gateway initialized');
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        if (!this.io) {
            this.logger.error('Socket.IO server not initialized');
            return;
        }

        this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
            this.logger.info(`Client connected: ${socket.id}`);

            socket.on('join-room', (data) => {
                this.roomLifecycleHandler.handleJoinRoom(socket, data);
            });

            socket.on('leave-room', () => {
                this.roomLifecycleHandler.handleLeaveRoom(socket);
            });

            socket.on('get-router-rtp-capabilities', (data) => {
                this.webRtcTransportHandler.handleGetRouterRtpCapabilities(socket, data);
            });

            socket.on('create-webrtc-transport', (data) => {
                this.webRtcTransportHandler.handleCreateWebRtcTransport(socket, data);
            });

            socket.on('connect-webrtc-transport', (data) => {
                this.webRtcTransportHandler.handleConnectWebRtcTransport(socket, data);
            });

            socket.on('produce', (data) => {
                this.mediaHandler.handleProduce(this.io!, socket, data);
            });

            socket.on('consume', (data) => {
                this.mediaHandler.handleConsume(socket, data);
            });

            socket.on('resume-consumer', (data) => {
                this.mediaHandler.handleResumeConsumer(socket, data);
            });

            socket.on('get-peers', () => {
                this.peerManagementHandler.handleGetPeers(socket);
            });

            socket.on('disconnect', () => {
                this.roomLifecycleHandler.handleDisconnect(socket);
            });
        });
    }
}
