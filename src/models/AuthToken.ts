import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    isValid: boolean;
    createdAt: Date;
    expiresAt: Date;
}

const AuthTokenSchema: Schema = new Schema<IAuthToken>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    isValid: {
        type: Boolean,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

export const AuthToken = mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);
