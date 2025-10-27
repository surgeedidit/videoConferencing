// In roomRouter.ts
import { Router } from 'express';
import { RoomController } from '../../../controllers/roomController';
import { Container } from 'typedi';
import { AuthMiddleware } from '../../../middlewares/authMiddleware';

const roomRouter: Router = Router();
const roomController = Container.get(RoomController);
const authMiddleware = Container.get(AuthMiddleware);

roomRouter.post('/create', authMiddleware.checkAccessToken, roomController.createRoom);
roomRouter.get('/host', authMiddleware.checkAccessToken, roomController.getRoomsByHost);
roomRouter.get('/:id', authMiddleware.checkAccessToken, roomController.getRoomById);
roomRouter.post('/:id/participants', authMiddleware.checkAccessToken, roomController.addParticipant);
roomRouter.delete('/:id/participants', authMiddleware.checkAccessToken, roomController.removeParticipant);
roomRouter.post('/join', authMiddleware.checkAccessToken, roomController.joinRoomByCode);


roomRouter.get('/', roomController.getAllRooms);
roomRouter.get('/code/:code', roomController.getRoomByCode);

export default roomRouter;