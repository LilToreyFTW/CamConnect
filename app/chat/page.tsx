'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/app/components/RouteGuard';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function ChatPage() {
  return (
    <RouteGuard>
      <ChatContent />
    </RouteGuard>
  );
}

function ChatContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'error'>('idle');
  const [partner, setPartner] = useState<any>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const cleanupConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setPartner(null);
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnection();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [cleanupConnection]);

  const initSocket = () => {
    if (socketRef.current) return socketRef.current;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user?._id);
    });

    socket.on('partner-found', async ({ socketId, userId }: any) => {
      setPartner({ socketId, userId });
      setStatus('connected');
      await createPeerConnection(socketId, true);
    });

    socket.on('no-partner', () => {
      setStatus('idle');
      setError('No one available right now. Try again.');
    });

    socket.on('offer', async ({ offer, sender }: any) => {
      await createPeerConnection(sender, false, offer);
    });

    socket.on('answer', async ({ answer, sender }: any) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, sender }: any) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('ICE error', e);
        }
      }
    });

    socket.on('partner-left', () => {
      setError('Partner left');
      cleanupConnection();
    });

    socket.on('ready-for-next', () => {
      cleanupConnection();
    });

    return socket;
  };

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setError('Camera/microphone access denied');
      setStatus('error');
      throw err;
    }
  };

  const createPeerConnection = async (targetSocketId: string, isInitiator: boolean, offer?: any) => {
    const stream = localStreamRef.current || (await getLocalStream());
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { target: targetSocketId, candidate: event.candidate });
      }
    };

    if (isInitiator) {
      const offerDesc = await pc.createOffer();
      await pc.setLocalDescription(offerDesc);
      socketRef.current?.emit('offer', { target: targetSocketId, offer: offerDesc });
    } else if (offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('answer', { target: targetSocketId, answer });
    }
  };

  const startChat = async () => {
    setError('');
    setStatus('searching');
    try {
      await getLocalStream();
      const socket = initSocket();
      socket.emit('find-partner', { gender: user?.gender, isPremium: user?.isPremium });
    } catch (err) {
      console.error(err);
    }
  };

  const nextPartner = () => {
    if (socketRef.current) {
      socketRef.current.emit('next');
    }
    cleanupConnection();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
      }
    }
  };

  return (
    <main style={{ paddingTop: 80, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', gap: '1rem', padding: '1.5rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'connected' ? 'block' : 'none' }}
            />
            {status !== 'connected' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <p>{status === 'searching' ? 'Finding someone...' : 'Click start to meet someone new'}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {status === 'idle' || status === 'error' ? (
              <button className="btn btn-large btn-primary" onClick={startChat}>
                Start Chatting
              </button>
            ) : (
              <>
                <button className="btn btn-large btn-primary" onClick={nextPartner}>
                  Next Partner
                </button>
                <button className="btn btn-large btn-outline" onClick={toggleVideo}>
                  {videoEnabled ? 'Hide Video' : 'Show Video'}
                </button>
                <button className="btn btn-large btn-outline" onClick={toggleAudio}>
                  {audioEnabled ? 'Mute' : 'Unmute'}
                </button>
              </>
            )}
          </div>

          {error && (
            <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>
          )}
        </div>

        <div
          style={{
            width: 280,
            minWidth: 280,
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.75rem',
            }}
          >
            You
          </div>
        </div>
      </div>
    </main>
  );
}
