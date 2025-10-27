import { Server, Socket } from 'socket.io';
import { Inject, Service } from 'typedi';
import { LoggerService } from '@/config/winston.logger';
import { MediasoupService } from '@/services/mediasoupService';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket.types';
import {
    ConsumeDataSchema,
    ProduceDataSchema,
    ResumeConsumerDataSchema,
    validateSocketData,
} from '@/schemas/socketValidation';

@Service('mediaHandler')
export class MediaHandler {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('mediasoupService') private mediasoupService: MediasoupService,
    ) {}

    async handleProduce(
        io: Server<ClientToServerEvents, ServerToClientEvents>,
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(ProduceDataSchema, data);
            if (!validation.success) {
                socket.emit('produced', {
                    success: false,
                    error: `Validation error: ${validation.error}`,
                });
                return;
            }

            const { transportId, kind, rtpParameters, appData } = validation.data;

            const producer = await this.mediasoupService.createProducer(
                io,
                socket.id,
                transportId,
                kind,
                rtpParameters,
                appData,
            );

            socket.emit('produced', {
                success: true,
                id: producer.id,
            });
        } catch (error) {
            socket.emit('produced', {
                success: false,
                error: (error as Error).message,
            });
        }
    }

    async handleConsume(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(ConsumeDataSchema, data);
            if (!validation.success) {
                socket.emit('consumed', {
                    success: false,
                    error: `Validation error: ${validation.error}`,
                });
                return;
            }

            const { producerId, rtpCapabilities } = validation.data;

            const consumer = await this.mediasoupService.createConsumer(
                socket.id,
                producerId,
                rtpCapabilities,
            );

            if (!consumer) {
                socket.emit('consumed', {
                    success: false,
                    error: 'Failed to create consumer',
                });
                return;
            }

            socket.emit('consumed', {
                success: true,
                id: consumer.id,
                producerId: consumer.producerId,
                kind: consumer.kind as 'audio' | 'video',
                rtpParameters: consumer.rtpParameters,
                appData: consumer.appData,
            });
        } catch (error) {
            socket.emit('consumed', {
                success: false,
                error: (error as Error).message,
            });
        }
    }

    async handleResumeConsumer(
        socket: Socket<ClientToServerEvents, ServerToClientEvents>,
        data: unknown,
    ): Promise<void> {
        try {
            const validation = validateSocketData(ResumeConsumerDataSchema, data);
            if (!validation.success) {
                socket.emit('consumer-resumed', {
                    success: false,
                    error: `Validation error: ${validation.error}`,
                });
                return;
            }

            const { consumerId } = validation.data;
            this.mediasoupService.resumeConsumer(socket.id, consumerId);

            socket.emit('consumer-resumed', { success: true });
        } catch (error) {
            socket.emit('consumer-resumed', {
                success: false,
                error: (error as Error).message,
            });
        }
    }
}
