import { LoggerService } from "@/config/winston.logger";
import { IRoom, Room } from "@/models/Room";
import { Inject, Service } from "typedi";

@Service('meetingRepository')
export class MeetingRepository {
    constructor(
        @Inject('logger') private logger: LoggerService
    ) {}

    async createRoom(roomData: any): Promise<IRoom> {
        try {
         
            const room = new Room(roomData);
            
         
            if (!room.roomCode) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let result = '';
                for (let i = 0; i < 6; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                room.roomCode = result;
            }
            
            // Manually set endTime if not provided
            if (!room.endTime) {
                room.endTime = new Date(room.startTime.getTime() + room.durationInSeconds * 1000);
            }
            
        
            const savedRoom = await room.save();
            
            this.logger.info(`Room created in repository: ${savedRoom._id}, Code: ${savedRoom.roomCode}`);
            return savedRoom;
        } catch (error) {
            this.logger.error(`Error creating room in repository: ${error}`);
            throw error;
        }
    }
}