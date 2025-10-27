import mongoose, { Document, Schema } from 'mongoose';

export enum AccountType {
    BASIC = 'basic',
    GOOGLE = 'google',
}

export interface IUser extends Document {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    profileImageString?: string;
    accountType: AccountType;
    //Represents user email verification state
    isActivated: boolean;
}

const UserSchema: Schema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // FIXED
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    profileImageString: { type: String, default: '' },
    isActivated: { type: Boolean, required: true, default: false },
    accountType: {
        type: String,
        enum: Object.values(AccountType),
        default: AccountType.BASIC,
    },
});

export const User = mongoose.model<IUser>('User', UserSchema);
