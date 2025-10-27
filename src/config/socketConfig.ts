import { Server } from 'socket.io';
import { LoggerService } from './winston.logger';
import { Container } from 'typedi';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket.types';
import RoomGateway from '@api/gateways/roomGateway';

export function createSocketServer(
    httpServer: any,
): Server<ClientToServerEvents, ServerToClientEvents> {
    const logger = Container.get<LoggerService>('logger');

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'https://oak-park-frontend.vercel.app',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
    });

    logger.info('Socket.IO server configured successfully');

    const roomGateway = Container.get<RoomGateway>('roomGateway');
    roomGateway.initialize(io);

    return io;
}
