import { Socket } from 'socket.io';
import { Inject, Service } from 'typedi';
import { LoggerService } from '@/config/winston.logger';
import { MediasoupService } from '@/services/mediasoupService';
import {
    ClientToServerEvents,
    ServerToClientEvents,
} from '@/types/socket.types';
import {
    GetRouterRtpCapabilitiesSchema,
    WebRtcTransportDataSchema,
    ConnectTransportDataSchema,
    validateSocketData,
} from '@/schemas/socketValidation';

@Service('webRtcTransportHandler')
export class WebRtcTransportHandler {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('mediasoupService') private mediasoupService: MediasoupService,
    ) {}

    async handleGetRouterRtpCapabilities(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(GetRouterRtpCapabilitiesSchema, data);
            if (!validation.success) {
                socket.emit('router-rtp-capabilities', {
                    success: false,
                    error: `Validation error: ${validation.error}`
                });
                return;
            }

            const { roomId } = validation.data;
            const rtpCapabilities = this.mediasoupService.getRtpCapabilities(roomId);

            if (rtpCapabilities) {
                socket.emit('router-rtp-capabilities', {
                    success: true,
                    rtpCapabilities,
                });
            } else {
                socket.emit('router-rtp-capabilities', {
                    success: false,
                    error: 'Room not found or router not ready',
                });
            }
        } catch (error) {
            this.logger.error(`Error getting RTP capabilities: ${(error as Error).message}`);
            socket.emit('router-rtp-capabilities', {
                success: false,
                error: (error as Error).message,
            });
        }
    }

    async handleCreateWebRtcTransport(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(WebRtcTransportDataSchema, data);
            if (!validation.success) {
                socket.emit('webrtc-transport-created', {
                    success: false,
                    error: `Validation error: ${validation.error}`
                });
                return;
            }

            const { producing } = validation.data;
            const transport = await this.mediasoupService.createWebRtcTransport(socket.id, producing);

            socket.emit('webrtc-transport-created', {
                success: true,
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            });
        } catch (error) {
            this.logger.error(`Error creating WebRTC transport: ${(error as Error).message}`);
            socket.emit('webrtc-transport-created', {
                success: false,
                error: (error as Error).message,
            });
        }
    }

    async handleConnectWebRtcTransport(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(ConnectTransportDataSchema, data);
            if (!validation.success) {
                socket.emit('webrtc-transport-connected', {
                    success: false,
                    error: `Validation error: ${validation.error}`
                });
                return;
            }

            const { transportId, dtlsParameters } = validation.data;
            await this.mediasoupService.connectWebRtcTransport(socket.id, transportId, dtlsParameters);

            socket.emit('webrtc-transport-connected', { success: true });
        } catch (error) {
            this.logger.error(`Error connecting WebRTC transport: ${(error as Error).message}`);
            socket.emit('webrtc-transport-connected', {
                success: false,
                error: (error as Error).message,
            });
        }
    }
}