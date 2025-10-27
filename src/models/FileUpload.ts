import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    cloudId :string;
    url : string;
    sizeInMb : number;
    folder : string;
    originalName : string;
}

const FileSchema: Schema = new Schema<IFile>({
    cloudId : { type: String, required: true, unique: true },
    url : { type: String, required: true, unique: true },
    sizeInMb : { type: Number, required: true},
    folder : { type: String, required: true},
    originalName: { type: String, required: true},   
},
  { timestamps: true }
)
export const File = mongoose.model<IFile>('User', FileSchema);
