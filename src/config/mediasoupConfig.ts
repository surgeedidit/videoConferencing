import { types } from 'mediasoup';
import * as os from 'os';

function getNetworkIp(): string {
    const envIp = process.env.MEDIASOUP_ANNOUNCED_IP;
    if (envIp) {
        return envIp;
    }

    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const interfaceInfo of interfaces[name]!) {
            const { address, family, internal } = interfaceInfo;
            if (family === 'IPv4' && !internal) {
                if (name.toLowerCase().includes('eth') || name.toLowerCase().includes('en')) {
                    candidates.unshift(address);
                } else {
                    candidates.push(address);
                }
            }
        }
    }

    if (candidates.length > 0) {
        return candidates[0];
    }

    return process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
}

export const mediasoupConfig = {
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 11000,
        logLevel: 'warn' as types.WorkerLogLevel,
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as types.WorkerLogTag[],
    },

    router: {
        mediaCodecs: [
            {
                kind: 'audio' as types.MediaKind,
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video' as types.MediaKind,
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as types.MediaKind,
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'profile-id': 2,
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as types.MediaKind,
                mimeType: 'video/h264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as types.MediaKind,
                mimeType: 'video/h264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000,
                },
            },
        ] as types.RtpCodecCapability[],
    },

    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: getNetworkIp(),
            },
        ],
        maxIncomingBitrate: 1500000,
        initialAvailableOutgoingBitrate: 1000000,
    },
};
