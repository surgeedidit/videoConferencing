import 'reflect-metadata';
import { Container } from 'typedi';
import { LoggerService } from './winston.logger';
import EmailService from '../services/emailService';
import RoomService from '../services/roomService';
import { RoomParticipantService } from '../services/roomParticipantService';
import { MediasoupService } from '../services/mediasoupService';
import { MediasoupSessionManager } from '../services/mediasoupSessionManager';
import { WorkerManager } from '../services/mediasoup/workerManager';
import { RouterManager } from '../services/mediasoup/routerManager';
import { TransportManager } from '../services/mediasoup/transportManager';
import { MediaManager } from '../services/mediasoup/mediaManager';
import { PeerManager } from '../services/mediasoup/peerManager';
import { MeetingRepository } from '@/repositories/meetingRepository';
import RoomGateway from '@/api/gateways/roomGateway';
import { RoomLifecycleHandler } from '@/api/handlers/roomLifecycleHandler';
import { WebRtcTransportHandler } from '@/api/handlers/webRtcTransportHandler';
import { MediaHandler } from '@/api/handlers/mediaHandler';
import { PeerManagementHandler } from '@/api/handlers/peerManagementHandler';
import { redisInstance } from './redisConnection';

export async function loadDependencies(): Promise<void> {
    const logger: LoggerService = Container.get('logger');
    const meetingRepository: MeetingRepository = Container.get('meetingRepository');

    try {
        Container.set('redis', redisInstance);
        Container.set('emailService', new EmailService(logger));

        Container.set('roomService', new RoomService(logger, meetingRepository, Container.get('roomParticipantService')));
        Container.set('roomParticipantService', new RoomParticipantService(logger));

        const mediasoupSessionManager = new MediasoupSessionManager(Container.get('redis'), logger);
        Container.set('mediasoupSessionManager', mediasoupSessionManager);

        const workerManager = new WorkerManager(logger);
        Container.set('workerManager', workerManager);

        const routerManager = new RouterManager(logger, workerManager, mediasoupSessionManager);
        Container.set('routerManager', routerManager);

        const transportManager = new TransportManager(
            logger,
            routerManager,
            mediasoupSessionManager,
        );
        Container.set('transportManager', transportManager);

        const peerManager = new PeerManager(logger, mediasoupSessionManager);
        Container.set('peerManager', peerManager);

        const mediaManager = new MediaManager(
            logger,
            routerManager,
            transportManager,
            peerManager,
            mediasoupSessionManager,
        );
        Container.set('mediaManager', mediaManager);

        const mediasoupService = new MediasoupService(
            logger,
            workerManager,
            routerManager,
            transportManager,
            mediaManager,
            peerManager,
        );
        Container.set('mediasoupService', mediasoupService);

        await mediasoupService.initialize();

        Container.set(
            'roomLifecycleHandler',
            new RoomLifecycleHandler(
                logger,
                Container.get('roomService'),
                Container.get('roomParticipantService'),
                mediasoupService,
            ),
        );

        Container.set(
            'webRtcTransportHandler',
            new WebRtcTransportHandler(logger, mediasoupService),
        );

        Container.set('mediaHandler', new MediaHandler(logger, mediasoupService));

        Container.set('peerManagementHandler', new PeerManagementHandler(logger, mediasoupService));

        Container.set(
            'roomGateway',
            new RoomGateway(
                logger,
                Container.get('roomLifecycleHandler'),
                Container.get('webRtcTransportHandler'),
                Container.get('mediaHandler'),
                Container.get('peerManagementHandler'),
            ),
        );

        logger.info('Dependency injection container set up successfully.');
    } catch (error) {
        logger.error(`Error setting up dependency injection container: ${error}`);
        throw error;
    }
}
