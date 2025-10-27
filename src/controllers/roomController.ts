import { Service, Inject } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import RoomService from '../services/roomService'; 
import { Logger } from 'winston';
import { 
  CreateRoomDTO, 
  AddParticipantDTO, 
  RemoveParticipantDTO,
  JoinRoomByCodeDTO,
  CreateRoomSchema,
  AddParticipantSchema,
  RemoveParticipantSchema,
  JoinRoomByCodeSchema
} from '../dtos/room.dto';
import CustomResponse from '../utils/shared/CustomResponse';
import { BadRequestError } from '../utils/shared/customErrorClasses';

@Service()
export class RoomController {
  constructor(
    @Inject('roomService') private roomService: RoomService, 
    @Inject('logger') private logger: Logger,
  ) {}

  public createRoom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const validatedData: CreateRoomDTO = CreateRoomSchema.parse(req.body);
      const hostId = (req as any).user._id;
      
      if (!hostId) {
        throw new BadRequestError(req, 'User ID not found in request');
      }
      
      const room = await this.roomService.createRoom(validatedData, hostId);
      return customResponse.success(201, 'Room created successfully', room);
    } catch (error) {
      this.logger.error(`Create room error: ${error}`);
      next(error);
    }
  };

  
  public getAllRooms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const rooms = await this.roomService.getAllRooms();
      return customResponse.success(200, 'Rooms fetched successfully', rooms);
    } catch (error) {
      next(error);
    }
  };

  public getRoomById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const { id } = req.params;
      const room = await this.roomService.getRoomById(id);
      if (!room) {
        throw new BadRequestError(req, 'Room not found');
      }
      return customResponse.success(200, 'Room fetched successfully', room);
    } catch (error) {
      next(error);
    }
  };

  public addParticipant = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const { id } = req.params;
      const validatedData: AddParticipantDTO = AddParticipantSchema.parse(req.body);
      const room = await this.roomService.addParticipant(id, validatedData);
      if (!room) {
        throw new BadRequestError(req, 'Room not found');
      }
      return customResponse.success(200, 'Participant added successfully', room);
    } catch (error) {
      next(error);
    }
  };

  public removeParticipant = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const { id } = req.params;
      const validatedData: RemoveParticipantDTO = RemoveParticipantSchema.parse(req.body);
      const room = await this.roomService.removeParticipant(id, validatedData);
      if (!room) {
        throw new BadRequestError(req, 'Room not found');
      }
      return customResponse.success(200, 'Participant removed successfully', room);
    } catch (error) {
      next(error);
    }
  };

  public getRoomsByHost = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const hostId = (req as any).user._id;
      const rooms = await this.roomService.getRoomsByHost(hostId);
      return customResponse.success(200, 'Rooms fetched successfully', rooms);
    } catch (error) {
      next(error);
    }
  };

  public joinRoomByCode = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const validatedData: JoinRoomByCodeDTO = JoinRoomByCodeSchema.parse(req.body);
      const userId = (req as any).user._id;
      const result = await this.roomService.joinRoomByCode(validatedData.roomCode, userId);
      return customResponse.success(200, 'Joined room successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getRoomByCode = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const customResponse = new CustomResponse(res);
    try {
      const { code } = req.params;
      const room = await this.roomService.getRoomByCode(code);
      if (!room) {
        throw new BadRequestError(req, 'Room not found with this code');
      }
      return customResponse.success(200, 'Room details fetched successfully', room);
    } catch (error) {
      next(error);
    }
  };
}