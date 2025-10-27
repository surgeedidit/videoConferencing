import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  title: string;
  description: string;
  tag: string;
  roomBanner: string;
  participants: Schema.Types.ObjectId[];
  hostId: Schema.Types.ObjectId;
  isPrivate: boolean;
  startTime: Date;
  durationInSeconds: number;
  endTime: Date;
  createdAt: Date;
  roomCode: string;
  
}

const roomSchema = new Schema<IRoom>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  tag: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  roomBanner: {
    type: String,
    default: ''
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true
  },
  durationInSeconds: {
    type: Number,
    required: true,
    min: 1,
    max: 28800
  },
  endTime: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  roomCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  }
});

roomSchema.pre('save', function(next) {
  if (!this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.durationInSeconds * 1000);
  }
  
  if (!this.roomCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.roomCode = result;
  }
  
  next();
});

export const Room = model<IRoom>('Room', roomSchema);