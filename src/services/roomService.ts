import { Inject, Service } from 'typedi';
import { IRoom, Room } from '../models/Room';
import { LoggerService } from '../config/winston.logger';
import {
    AddParticipantDTO,
    CreateRoomDTO,
    RemoveParticipantDTO,
    JoinRoomByCodeDTO
} from '../dtos/room.dto';
import { MeetingRepository } from '@/repositories/meetingRepository';
import { RoomParticipantService } from './roomParticipantService';
import { ParticipantRole } from '@models/RoomParticipant';

@Service('roomService')
export default class RoomService {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('meetingRepository') private meetingRepository: MeetingRepository,
        @Inject('roomParticipantService') private participantService: RoomParticipantService
    ) {}

    async createRoom(roomData: CreateRoomDTO, hostId: string): Promise<IRoom> {
        this.logger.info(`Creating new room for host: ${hostId}`);

        const newRoomData = {
            ...roomData,
            hostId,
            participants: [hostId],
        };

        const newRoom = await this.meetingRepository.createRoom(newRoomData);

        await this.participantService.createParticipant(
            newRoom.id.toString(), 
            hostId, 
            ParticipantRole.HOST
        );

        this.logger.info(`Room created successfully with ID: ${newRoom.id}, Code: ${newRoom.roomCode}`);
        return newRoom;
    }

    async joinRoomByCode(roomCode: string, userId: string): Promise<{room: IRoom, participant: any}> {
        this.logger.info(`User ${userId} joining room with code: ${roomCode}`);

        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) {
            throw new Error('Room not found with this code');
        }

        const now = new Date();
        if (now < room.startTime) {
            throw new Error('Room has not started yet');
        }
        if (now > room.endTime) {
            throw new Error('Room has already ended');
        }

        const validation = await this.participantService.validateUserCanJoinRoom(room.id.toString(), userId);
        if (!validation.canJoin) {
            throw new Error(validation.reason || 'Cannot join room');
        }

        const updatedRoom = await this.addParticipant(room.id.toString(), { userId });
        if (!updatedRoom) {
            throw new Error('Failed to join room');
        }

        const participant = await this.participantService.createParticipant(
            room.id.toString(), 
            userId, 
            ParticipantRole.MEMBER
        );

        this.logger.info(`User ${userId} successfully joined room ${room.id} with code ${roomCode}`);
        return { room: updatedRoom, participant };
    }

    async getRoomByCode(roomCode: string): Promise<IRoom | null> {
        return Room.findOne({ roomCode: roomCode.toUpperCase() })
            .populate('participants hostId', 'name email avatar');
    }

    async getAllRooms(filter: any = {}): Promise<IRoom[]> {
        return Room.find(filter)
            .populate('participants hostId', 'name email avatar')
            .sort({ createdAt: -1 });
    }

    async getRoomById(roomId: string): Promise<IRoom | null> {
        this.logger.info(`Fetching room with ID: ${roomId}`);
        try {
            return await Room.findById(roomId).populate('participants hostId', 'name email avatar');
        } catch (error) {
            this.logger.error(`Error finding room by ID ${roomId}: ${(error as Error).message}`);
            return null;
        }
    }

    async updateRoom(roomId: string, updateData: any): Promise<IRoom | null> {
        this.logger.info(`Updating room ${roomId} with data: ${JSON.stringify(updateData)}`);
        return Room.findByIdAndUpdate(
            roomId,
            { $set: updateData },
            { new: true, runValidators: true },
        ).populate('participants hostId', 'name email avatar');
    }

    async deleteRoom(roomId: string): Promise<boolean> {
        this.logger.info(`Deleting room with ID: ${roomId}`);
        const result = await Room.deleteOne({ _id: roomId });
        return result.deletedCount === 1;
    }

    async addParticipant(roomId: string, participantData: AddParticipantDTO): Promise<IRoom | null> {
        if (!/^[0-9a-fA-F]{24}$/.test(participantData.userId)) {
            return Room.findById(roomId).populate('participants hostId', 'name email avatar');
        }
        return Room.findByIdAndUpdate(
            roomId,
            { $addToSet: { participants: participantData.userId } },
            { new: true },
        ).populate('participants hostId', 'name email avatar');
    }

    async removeParticipant(roomId: string, participantData: RemoveParticipantDTO): Promise<IRoom | null> {
        if (!/^[0-9a-fA-F]{24}$/.test(participantData.userId)) {
            return Room.findById(roomId).populate('participants hostId', 'name email avatar');
        }
        return Room.findByIdAndUpdate(
            roomId,
            { $pull: { participants: participantData.userId } },
            { new: true },
        ).populate('participants hostId', 'name email avatar');
    }

    async getRoomsByHost(hostId: string): Promise<IRoom[]> {
        this.logger.info(`Fetching rooms for host: ${hostId}`);
        return Room.find({ hostId })
            .populate('participants hostId', 'name email avatar')
            .sort({ startTime: 1 });
    }

    async getRoomsByParticipant(userId: string): Promise<IRoom[]> {
        this.logger.info(`Fetching rooms for participant: ${userId}`);
        return Room.find({ participants: userId })
            .populate('participants hostId', 'name email avatar')
            .sort({ startTime: 1 });
    }
}