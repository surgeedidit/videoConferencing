import { Document, model, Schema } from 'mongoose';

export enum ParticipantRole {
    HOST = 'host',
    MEMBER = 'member',
}

export interface IRoomParticipant extends Document {
    roomId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    role: ParticipantRole;
    joinTime: Date;
    durationInSecs: number;
    isActive: boolean;
    createdAt: Date;
}

const roomParticipantSchema = new Schema<IRoomParticipant>({
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(ParticipantRole),
        default: ParticipantRole.MEMBER,
    },
    joinTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    durationInSecs: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});



roomParticipantSchema.index({ roomId: 1, userId: 1, isActive: 1 }, { 
    unique: true, 
    partialFilterExpression: { isActive: true } 
});

export const RoomParticipant = model<IRoomParticipant>('RoomParticipant', roomParticipantSchema);