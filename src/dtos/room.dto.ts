import { z } from 'zod';

export const CreateRoomSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  tag: z.string().min(1, 'Tag is required').max(50, 'Tag too long'),
  roomBanner: z.string().url('Invalid image URL').optional().or(z.literal('')),
  isPrivate: z.boolean().default(false),
  startTime: z.string().min(1, 'Start time is required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format" }
  ).transform((val) => new Date(val)),
  durationInSeconds: z.number({
    required_error: 'Duration is required',
    invalid_type_error: 'Duration must be a number'
  }).min(60, 'Duration must be at least 1 minute').max(28800, 'Duration cannot exceed 8 hours')
});

export const AddParticipantSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const RemoveParticipantSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const JoinRoomByCodeSchema = z.object({
  roomCode: z.string()
    .min(1, 'Room code is required')
    .transform(val => val.toUpperCase())
});

export type CreateRoomDTO = z.infer<typeof CreateRoomSchema>;
export type AddParticipantDTO = z.infer<typeof AddParticipantSchema>;
export type RemoveParticipantDTO = z.infer<typeof RemoveParticipantSchema>;
export type JoinRoomByCodeDTO = z.infer<typeof JoinRoomByCodeSchema>;