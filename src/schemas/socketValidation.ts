import { z } from 'zod';

export const RoomJoinDataSchema = z.object({
  roomCode: z.string().min(1, 'Room code is required').max(6, 'Room code too long'),
  userId: z.string().min(1, 'User ID is required').max(100, 'User ID too long'),
  peerName: z.string().min(1, 'Peer name is required').max(50, 'Peer name too long'),
});

export const GetRouterRtpCapabilitiesSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
});

export const WebRtcTransportDataSchema = z.object({
  producing: z.boolean(),
});

export const ConnectTransportDataSchema = z.object({
  transportId: z.string().min(1, 'Transport ID is required'),
  dtlsParameters: z.any(),
});

export const ProduceDataSchema = z.object({
  transportId: z.string().min(1, 'Transport ID is required'),
  kind: z.enum(['audio', 'video']),
  rtpParameters: z.any(),
  appData: z.any().optional(),
});

export const ConsumeDataSchema = z.object({
  producerId: z.string().min(1, 'Producer ID is required'),
  rtpCapabilities: z.any(),
  transportId: z.string().optional(), // Frontend sends this but backend doesn't use it
  peerId: z.string().optional(), // Frontend sends this but backend doesn't use it
});

export const ResumeConsumerDataSchema = z.object({
  consumerId: z.string().min(1, 'Consumer ID is required'),
});

export function validateSocketData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid data format' };
  }
}