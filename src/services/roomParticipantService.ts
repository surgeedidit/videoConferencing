import { Inject, Service } from 'typedi';
import { IRoomParticipant, ParticipantRole, RoomParticipant } from '@models/RoomParticipant';
import { LoggerService } from '@config/winston.logger';
import { Types } from 'mongoose';

@Service('roomParticipantService')
export class RoomParticipantService {
    constructor(@Inject('logger') private logger: LoggerService) {}

    async createParticipant(
        roomId: string,
        userId: string,
        role: ParticipantRole = ParticipantRole.MEMBER,
    ): Promise<IRoomParticipant> {
        const cleanRoomId = roomId.trim();

        let roomObjectId: Types.ObjectId;
        if (Types.ObjectId.isValid(cleanRoomId)) {
            roomObjectId = new Types.ObjectId(cleanRoomId);
        } else {
            throw new Error('The room you are trying to join does not exist or has been deleted');
        }

        let userObjectId: Types.ObjectId;
        if (Types.ObjectId.isValid(userId)) {
            userObjectId = new Types.ObjectId(userId);
        } else {
            userObjectId = new Types.ObjectId();
        }

        const participant = new RoomParticipant({
            roomId: roomObjectId,
            userId: userObjectId,
            role,
            joinTime: new Date(),
            durationInSecs: 0,
            isActive: true,
        });

        await participant.save();
        return participant;
    }

    async findActiveParticipant(roomId: string, userId: string): Promise<IRoomParticipant | null> {
        const cleanRoomId = roomId.trim();

        const roomIdValid = Types.ObjectId.isValid(cleanRoomId);
        const userIdValid = Types.ObjectId.isValid(userId);

        if (!roomIdValid || !userIdValid) {
            return null;
        }

        return RoomParticipant.findOne({
            roomId: new Types.ObjectId(cleanRoomId),
            userId: new Types.ObjectId(userId),
            isActive: true,
        });
    }

    async updateParticipantOnLeave(
        roomId: string,
        userId: string,
        leaveTime: Date = new Date(),
    ): Promise<IRoomParticipant | null> {
        this.logger.info(`Updating participant leave time for user ${userId} in room ${roomId}`);

        const participant = await this.findActiveParticipant(roomId, userId);
        if (!participant) {
            this.logger.warn(`No active participant found for user ${userId} in room ${roomId}`);
            return null;
        }

        const durationInSecs = Math.floor(
            (leaveTime.getTime() - participant.joinTime.getTime()) / 1000,
        );

        return RoomParticipant.findByIdAndUpdate(
            participant._id,
            {
                $set: {
                    durationInSecs,
                    isActive: false,
                },
            },
            { new: true },
        );
    }

    async getActiveParticipants(roomId: string): Promise<IRoomParticipant[]> {
        return RoomParticipant.find({
            roomId: new Types.ObjectId(roomId),
            isActive: true,
        }).populate('userId', 'firstName lastName email');
    }

    async getRoomParticipationHistory(roomId: string): Promise<IRoomParticipant[]> {
        return RoomParticipant.find({
            roomId: new Types.ObjectId(roomId),
        })
            .populate('userId', 'firstName lastName email')
            .sort({ joinTime: 1 });
    }

    async getUserParticipationHistory(userId: string): Promise<IRoomParticipant[]> {
        return RoomParticipant.find({
            userId: new Types.ObjectId(userId),
        })
            .populate('roomId', 'title description startTime')
            .sort({ joinTime: -1 });
    }

    async cleanupInactiveParticipants(roomId: string): Promise<number> {
        const aDayInSec = 24 * 60 * 60;

        const result = await RoomParticipant.updateMany(
            {
                roomId: new Types.ObjectId(roomId),
                isActive: true,
                joinTime: { $lt: new Date(Date.now() - aDayInSec * 1000) }, // 24 hours ago
            },
            {
                $set: {
                    isActive: false,
                    durationInSecs: aDayInSec,
                },
            },
        );

        return result.modifiedCount;
    }

    async validateUserCanJoinRoom(
        roomId: string,
        userId: string,
    ): Promise<{ canJoin: boolean; reason?: string }> {
        const existingActiveParticipant = await this.findActiveParticipant(roomId, userId);

        if (existingActiveParticipant) {
            return {
                canJoin: false,
                reason: 'User is already active in this room',
            };
        }

        return { canJoin: true };
    }

    async forceLeaveParticipant(roomId: string, userId: string): Promise<IRoomParticipant | null> {
        this.logger.warn(`Force leaving participant ${userId} from room ${roomId}`);
        return this.updateParticipantOnLeave(roomId, userId);
    }
}
