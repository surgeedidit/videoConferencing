import { types } from 'mediasoup';

export interface RoomJoinData {
    roomId: string;
    userId: string;
    peerName: string;
}

export interface WebRtcTransportData {
    producing: boolean;
}

export interface ConnectTransportData {
    transportId: string;
    dtlsParameters: types.DtlsParameters;
}

export interface ProduceData {
    transportId: string;
    kind: 'audio' | 'video';
    rtpParameters: types.RtpParameters;
    appData?: any;
}

export interface ConsumeData {
    transportId: string;
    producerId: string;
    rtpCapabilities: types.RtpCapabilities;
}

export interface ResumeConsumerData {
    consumerId: string;
}

export interface ClientToServerEvents {
    'join-room': (data: RoomJoinData) => void;
    'leave-room': () => void;
    'get-router-rtp-capabilities': (data: { roomId: string }) => void;
    'create-webrtc-transport': (data: WebRtcTransportData) => void;
    'connect-webrtc-transport': (data: ConnectTransportData) => void;
    'produce': (data: ProduceData) => void;
    'consume': (data: ConsumeData) => void;
    'resume-consumer': (data: ResumeConsumerData) => void;
    'get-peers': () => void;
}

export interface ServerToClientEvents {
    'join-room-success': (data: {
        roomId: string;
        rtpCapabilities: types.RtpCapabilities;
        existingProducers: Array<{
            id: string;
            kind: 'audio' | 'video';
            peerId: string;
        }>;
        existingPeers: Array<{
            peerId: string;
            peerName: string;
            joinedAt: string;
        }>;
    }) => void;
    'join-room-error': (data: { message: string }) => void;
    'leave-room-success': () => void;
    'router-rtp-capabilities': (data: {
        success: boolean;
        rtpCapabilities?: types.RtpCapabilities;
        error?: string;
    }) => void;
    'webrtc-transport-created': (data: {
        success: boolean;
        id?: string;
        iceParameters?: types.IceParameters;
        iceCandidates?: types.IceCandidate[];
        dtlsParameters?: types.DtlsParameters;
        error?: string;
    }) => void;
    'webrtc-transport-connected': (data: { success: boolean; error?: string }) => void;
    'produced': (data: { success: boolean; id?: string; error?: string }) => void;
    'consumed': (data: {
        success: boolean;
        id?: string;
        producerId?: string;
        kind?: 'audio' | 'video';
        rtpParameters?: types.RtpParameters;
        appData?: any;
        error?: string;
    }) => void;
    'consumer-resumed': (data: { success: boolean; error?: string }) => void;
    'new-producer': (data: {
        producerId: string;
        peerId: string;
        kind: 'audio' | 'video';
    }) => void;
    'peer-left': (data: { peerId: string }) => void;
    'new-peer': (data: { peerId: string; peerName: string }) => void;
    'peers-list': (data: {
        peers: Array<{
            peerId: string;
            peerName: string;
            joinedAt: string;
        }>;
    }) => void;
}
