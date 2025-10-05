/**
 * VideoCall.tsx - Revolutionary Video Call with Anime.js Animations
 * Beautiful UI with smooth anime.js animations and robust caption/sign synchronization
 */

import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom, useParticipants } from '@livekit/components-react';
import { useLiveKit, CaptionMessage } from '../hooks/useLiveKit';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useASLRecognition } from '../hooks/useASLRecognition';
import { toNaturalText } from '../lib/labels';
import { Track } from 'livekit-client';
import { animate, createScope, spring, stagger } from 'animejs';
import styles from '../styles/videoCall.styles';

interface Caption {
  id: string;
  text: string;
  timestamp: number;
  sender: 'local' | 'remote';
}

export function VideoCall() {
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [signRecognitionMode, setSignRecognitionMode] = useState(false);

  const captionsSentRef = useRef<Set<string>>(new Set());
  const sendCaptionRef = useRef<(text: string) => void>(() => {
    console.warn('[VideoCall] Caption sender not ready yet.');
  });
  const joinRootRef = useRef<HTMLDivElement>(null);
  const joinScopeRef = useRef<any>(null);

  // Generate random room ID on mount
  useEffect(() => {
    const randomRoomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    setRoomName(randomRoomId);
  }, []);

  // Revolutionary anime.js entrance animation using createScope
  useEffect(() => {
    if (joinRootRef.current && !connectionToken) {
      joinScopeRef.current = createScope({ root: joinRootRef.current }).add(self => {

        // Dramatic card entrance with spring physics
        animate('.join-card', {
          opacity: [0, 1],
          translateY: [100, 0],
          rotate: [10, 0],
          scale: [0.8, 1],
          duration: 1200,
          ease: spring({ mass: 1, stiffness: 280, damping: 20 }),
        });

        // Floating glow effect
        animate('.card-glow', {
          opacity: [0.02, 0.08, 0.02],
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          duration: 8000,
          loop: true,
          ease: 'inOut(2)',
        });

        // Staggered children with bounce
        animate('.animate-in', {
          opacity: [0, 1],
          translateY: [40, 0],
          rotate: [-5, 0],
          scale: [0.8, 1],
          duration: 800,
          delay: stagger(120, {start: 400}),
          ease: spring({ bounce: 0.4 }),
        });

        // Title gradient shift
        animate('.title', {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          duration: 6000,
          loop: true,
          ease: 'inOut(2)',
        });

        // Pulsing emoji
        animate('.title', {
          textShadow: [
            '0 0 20px rgba(59, 130, 246, 0.3)',
            '0 0 40px rgba(59, 130, 246, 0.6)',
            '0 0 20px rgba(59, 130, 246, 0.3)',
          ],
          duration: 2000,
          loop: true,
          ease: 'inOut(2)',
        });

        // Input field focus animations
        self?.add('focusInput', (target: HTMLElement) => {
          animate(target, {
            scale: [1, 1.02, 1],
            boxShadow: [
              '0 0 0 0px rgba(30, 58, 138, 0)',
              '0 0 0 4px rgba(30, 58, 138, 0.2)',
            ],
            duration: 300,
            ease: 'out(3)',
          });
        });

        // Button hover with spring
        self?.add('hoverButton', (target: HTMLElement, isHover: boolean) => {
          animate(target, {
            scale: isHover ? 1.05 : 1,
            translateY: isHover ? -4 : 0,
            boxShadow: isHover
              ? '0 20px 60px rgba(59, 130, 246, 0.4)'
              : '0 0 40px rgba(59, 130, 246, 0.4)',
            duration: 400,
            ease: spring({ bounce: isHover ? 0.5 : 0.3 }),
          });
        });

      });

      return () => joinScopeRef.current?.revert();
    }
  }, [connectionToken]);

  const speech = useSpeechToText({
    continuous: true,
    interimResults: true,
    // Speech caption handling moved to ConnectedVideoCall component
    // This callback is intentionally empty to avoid duplicate captions
  });

  const handleRemoteCaption = useCallback((message: CaptionMessage) => {
    setCaptions(prev => [...prev, {
      id: `remote-${message.timestamp}`,
      text: message.text,
      timestamp: message.timestamp,
      sender: 'remote' as const
    }].slice(-20)); // Keep last 20 captions
  }, []);

  const handleJoinCall = async () => {
    if (!participantName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get token from API
      const tokenEndpoint = import.meta.env.DEV ? '/.netlify/functions/token' : '/api/token';
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: participantName.trim(),
          metadata: JSON.stringify({ role: 'participant' }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token from API (status ${response.status})`);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Get server URL from API response or fallback to env variable
      const resolvedServerUrl = data.serverUrl || data.url || import.meta.env.VITE_LIVEKIT_URL;

      if (!resolvedServerUrl) {
        throw new Error('LiveKit server URL not configured');
      }

      setServerUrl(resolvedServerUrl);

      // Generate shareable link
      const currentUrl = window.location.origin + window.location.pathname;
      const link = `${currentUrl}?room=${encodeURIComponent(roomName)}`;
      setShareableLink(link);

      setConnectionToken(data.token);
    } catch (err) {
      setError((err as Error).message);
      setIsConnecting(false);
    }
  };

  const resetSessionState = useCallback(() => {
    captionsSentRef.current.clear();
    sendCaptionRef.current = () => {
      console.warn('[VideoCall] Caption sender not ready yet.');
    };
    setCaptions([]);
    setConnectionToken(null);
    setIsConnecting(false);
    setShareableLink('');
    setSignRecognitionMode(false);
  }, []);

  // Check URL params for room on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomName(roomParam);
    }
  }, []);

  const handleLeaveCall = useCallback(() => {
    speech.stopListening();
    resetSessionState();
  }, [resetSessionState, speech]);

  if (!connectionToken) {
    return (
      <>
        {/* Global Navigation Header */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(10, 14, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Logo */}
            <a
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '2.5rem', height: '2.5rem' }} />
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              }}>
                DuckSpeak
              </span>
            </a>

            {/* Navigation */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}>
              <a
                href="/#features"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                Features
              </a>
              <a
                href="/#training"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                Training
              </a>
              <a
                href="/#how-it-works"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                How It Works
              </a>
              <a
                href="/collect-train"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                Training Studio
              </a>
            </nav>
          </div>
        </header>

        <div ref={joinRootRef} style={{...styles.joinContainer, paddingTop: '8rem'}}>
          <div className="join-card" style={{...styles.joinCard, opacity: 0}}>
          <div className="card-glow" style={{...styles.joinCardGlow, backgroundSize: '200% 200%'}}></div>
          <div className="animate-in" style={styles.titleGlow}>
            <h1 className="title" style={{...styles.title, backgroundSize: '200% auto', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center'}}>
              <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '3.5rem', height: '3.5rem' }} />
              DuckSpeak
            </h1>
            <p style={styles.tagline}>Real-Time ASL Video Calling</p>
          </div>

          <div className="animate-in" style={styles.inputGroup}>
            <label style={styles.label}>Your Name</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              style={styles.input}
              onFocus={(e) => joinScopeRef.current?.methods.focusInput?.(e.target)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
            />
          </div>

          <div className="animate-in" style={styles.inputGroup}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name (auto-generated)"
              style={styles.input}
              onFocus={(e) => joinScopeRef.current?.methods.focusInput?.(e.target)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
            />
            <p style={styles.hint}>
              Share this room name with others to join the same call
            </p>
          </div>

          <button
            className="animate-in join-button"
            onClick={handleJoinCall}
            disabled={isConnecting || !participantName.trim()}
            onMouseEnter={(e) => joinScopeRef.current?.methods.hoverButton?.(e.currentTarget, true)}
            onMouseLeave={(e) => joinScopeRef.current?.methods.hoverButton?.(e.currentTarget, false)}
            style={{
              ...styles.button,
              ...styles.joinButton,
              ...(isConnecting || !participantName.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {isConnecting ? '🔄 Connecting…' : '🎥 Join Call'}
          </button>

          {error && <div className="animate-in" style={styles.error}>{error}</div>}
          {speech.error && !speech.isSupported && (
            <div className="animate-in" style={styles.warning}>
              ⚠️ Speech Recognition not supported. Captions will not work.
            </div>
          )}

          <div className="animate-in" style={styles.features}>
            <h3 style={styles.featuresTitle}>✨ Features</h3>
            <ul style={styles.featuresList}>
              <li>📹 HD video calling with multiple participants</li>
              <li>💬 Live speech-to-text captions</li>
              <li>🤟 Automatic sign language interpretation</li>
              <li>🎯 Real-time gesture recognition (coming soon)</li>
            </ul>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={connectionToken}
      connectOptions={{ autoSubscribe: true }}
      video
      audio
      onConnected={() => setIsConnecting(false)}
      onDisconnected={() => handleLeaveCall()}
    >
      <ConnectedVideoCall
        speech={speech}
        captions={captions}
        setCaptions={setCaptions}
        sendCaptionRef={sendCaptionRef}
        onLeave={handleLeaveCall}
        onRemoteCaptionReceived={handleRemoteCaption}
        shareableLink={shareableLink}
        participantName={participantName}
        signRecognitionMode={signRecognitionMode}
        onToggleSignRecognition={() => setSignRecognitionMode(!signRecognitionMode)}
        roomName={roomName}
      />
    </LiveKitRoom>
  );
}

// Calculate opacity for fade-out effect (fade starts after 6 seconds, fully faded at 8 seconds)
const getOpacity = (group: Caption[]) => {
  const now = Date.now();
  const latestTimestamp = group[group.length - 1].timestamp;
  const age = now - latestTimestamp;

  if (age < 6000) return 1; // Full opacity for first 6 seconds
  if (age >= 8000) return 0; // Fully transparent at 8 seconds
  return 1 - (age - 6000) / 2000; // Fade from 1 to 0 over 2 seconds
};

interface RemoteParticipantsProps {
  groupedRemoteCaptions: Caption[][];
  linkCopied: boolean;
  copyLinkToClipboard: () => void;
}

function RemoteParticipants({ groupedRemoteCaptions, linkCopied, copyLinkToClipboard }: RemoteParticipantsProps) {
  const participants = useParticipants();
  const remoteParticipants = participants.filter(p => p.isLocal === false);

  // If no remote participants, show waiting message
  if (remoteParticipants.length === 0) {
    return (
      <div className="video-card" style={styles.videoCard}>
        <div style={styles.videoContainer}>
          <div style={styles.video} />
          <div style={styles.videoLabel}>Waiting for others...</div>
          <div style={styles.waitingOverlay}>
            <div style={styles.waitingText}>
              <div style={styles.spinner}></div>
              <p>Waiting for someone to join...</p>
              <button onClick={copyLinkToClipboard} style={styles.shareButton}>
                {linkCopied ? '✅ Copied!' : '🔗 Share Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show all remote participants
  return (
    <>
      {remoteParticipants.map((participant) => {
        const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.videoTrack;

        return (
          <div key={participant.identity} className="video-card" style={styles.videoCard}>
            <div style={styles.videoContainer}>
              <video
                ref={(el) => {
                  if (el && videoTrack) {
                    videoTrack.attach(el);
                  }
                }}
                autoPlay
                playsInline
                style={styles.video}
              />
              <div style={styles.videoLabel}>
                {participant.name || participant.identity}
              </div>
            </div>

            {/* Caption text box below video */}
            <div style={styles.captionTextBox}>
              <div style={styles.captionTextBoxHeader}>
                {participant.name || participant.identity}'s Captions
              </div>
              <div style={styles.captionTextBoxContent}>
                {groupedRemoteCaptions.length > 0 ? (
                  groupedRemoteCaptions.map((group) => (
                    <div
                      key={group[0].id}
                      style={{
                        ...styles.captionTextLine,
                        opacity: getOpacity(group),
                        transition: 'opacity 0.3s ease-out'
                      }}
                    >
                      <span style={styles.captionIcon}>💬</span>
                      {group.map(c => c.text).join(' ')}
                    </div>
                  ))
                ) : (
                  <div style={styles.captionTextEmpty}>
                    Waiting for captions...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

interface ConnectedVideoCallProps {
  speech: ReturnType<typeof useSpeechToText>;
  captions: Caption[];
  setCaptions: React.Dispatch<React.SetStateAction<Caption[]>>;
  sendCaptionRef: MutableRefObject<(text: string) => void>;
  onLeave: () => void;
  onRemoteCaptionReceived: (caption: CaptionMessage) => void;
  shareableLink: string;
  participantName: string;
  signRecognitionMode: boolean;
  onToggleSignRecognition: () => void;
  roomName: string;
}

function ConnectedVideoCall({
  speech,
  captions,
  setCaptions,
  sendCaptionRef,
  onLeave,
  onRemoteCaptionReceived,
  shareableLink,
  participantName,
  signRecognitionMode,
  onToggleSignRecognition,
  roomName,
}: ConnectedVideoCallProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [speechStarted, setSpeechStarted] = useState(false);
  const [speechRecognitionMode, setSpeechRecognitionMode] = useState(false);
  const [aslGesturesSent, setAslGesturesSent] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  // Device selection state
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastProcessedTranscript = useRef<string>('');
  const animationFrameIdRef = useRef<number | null>(null);
  const callRootRef = useRef<HTMLDivElement>(null);
  const callScopeRef = useRef<any>(null);

  const {
    localVideoRef,
    hasRemoteParticipant,
    isMuted,
    isVideoOff,
    isConnected,
    isConnecting,
    error,
    toggleMute,
    toggleVideo,
    leaveCall,
    sendCaption,
    room,
  } = useLiveKit({
    onRemoteCaptionReceived,
  });

  // Revolutionary anime.js animations for call interface
  useEffect(() => {
    if (callRootRef.current) {
      callScopeRef.current = createScope({ root: callRootRef.current }).add(self => {

        // Header entrance with slide down
        animate('.call-header', {
          opacity: [0, 1],
          translateY: [-60, 0],
          duration: 800,
          ease: spring({ bounce: 0.3 }),
        });

        // Status dot pulse
        animate('.status-dot', {
          scale: [1, 1.3, 1],
          boxShadow: [
            '0 0 16px rgba(20, 184, 166, 0.6)',
            '0 0 32px rgba(20, 184, 166, 1)',
            '0 0 16px rgba(20, 184, 166, 0.6)',
          ],
          duration: 2000,
          loop: true,
          ease: 'inOut(2)',
        });

        // Video cards stagger entrance
        animate('.video-card', {
          opacity: [0, 1],
          scale: [0.9, 1],
          rotate: [5, 0],
          translateY: [60, 0],
          duration: 1000,
          delay: stagger(200),
          ease: spring({ bounce: 0.3 }),
        });

        // Caption slide-in animation
        self?.add('slideInCaption', (target: HTMLElement) => {
          animate(target, {
            opacity: [0, 1],
            translateX: [-100, 0],
            scale: [0.8, 1],
            duration: 600,
            ease: spring({ bounce: 0.4 }),
          });
        });

        // Caption slide-out animation
        self?.add('slideOutCaption', (target: HTMLElement) => {
          animate(target, {
            opacity: [1, 0],
            translateX: [0, 100],
            scale: [1, 0.8],
            duration: 400,
            ease: 'out(3)',
          });
        });

        // Control button hover with bounce
        self?.add('hoverControl', (target: HTMLElement, isHover: boolean) => {
          animate(target, {
            scale: isHover ? 1.15 : 1,
            rotate: isHover ? [0, -5, 5, 0] : 0,
            duration: isHover ? 400 : 300,
            ease: spring({ bounce: isHover ? 0.6 : 0.2 }),
          });
        });

        // Room code badge pulsing glow
        animate('.room-badge', {
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.2)',
            '0 0 40px rgba(59, 130, 246, 0.4)',
            '0 0 20px rgba(59, 130, 246, 0.2)',
          ],
          duration: 3000,
          loop: true,
          ease: 'inOut(2)',
        });

      });

      return () => callScopeRef.current?.revert();
    }
  }, []);

  // Enumerate media devices
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const videoInputs = devices.filter(d => d.kind === 'videoinput');

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);

        // Set default devices
        if (audioInputs.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        if (videoInputs.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error('[VideoCall] Failed to enumerate devices:', err);
      }
    };

    enumerateDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
  }, [selectedAudioDevice, selectedVideoDevice]);

  // Handle audio device change
  const handleAudioDeviceChange = async (deviceId: string) => {
    if (!room) return;

    setSelectedAudioDevice(deviceId);
    setShowAudioMenu(false);

    try {
      await room.switchActiveDevice('audioinput', deviceId);
      console.log('[VideoCall] Switched to audio device:', deviceId);
    } catch (err) {
      console.error('[VideoCall] Failed to switch audio device:', err);
    }
  };

  // Handle video device change
  const handleVideoDeviceChange = async (deviceId: string) => {
    if (!room) return;

    setSelectedVideoDevice(deviceId);
    setShowVideoMenu(false);

    try {
      await room.switchActiveDevice('videoinput', deviceId);
      console.log('[VideoCall] Switched to video device:', deviceId);
    } catch (err) {
      console.error('[VideoCall] Failed to switch video device:', err);
    }
  };

  // Handle audio enable/disable
  const handleAudioToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[VideoCall] Audio toggle clicked');
    await toggleMute();
    setShowAudioMenu(false);
  };

  // Handle video enable/disable
  const handleVideoToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[VideoCall] Video toggle clicked');
    await toggleVideo();
    setShowVideoMenu(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mixer-menu]')) {
        setShowAudioMenu(false);
        setShowVideoMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Track the local video element for LiveKit (processing video)
  const handleLocalVideoRef = useCallback((element: HTMLVideoElement | null) => {
    localVideoElementRef.current = element;
    processingVideoRef.current = element;
    localVideoRef(element);
  }, [localVideoRef]);

  // Draw video to canvas continuously (canvas is isolated from React re-renders)
  useEffect(() => {
    const processingVideo = processingVideoRef.current;
    const canvas = displayCanvasRef.current;

    if (!processingVideo || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (processingVideo.readyState >= 2 && processingVideo.videoWidth > 0) {
        // Set canvas size to match video
        if (canvas.width !== processingVideo.videoWidth || canvas.height !== processingVideo.videoHeight) {
          canvas.width = processingVideo.videoWidth;
          canvas.height = processingVideo.videoHeight;
        }

        // Draw video frame to canvas (mirrored like a real mirror)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(processingVideo, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      animationFrameIdRef.current = requestAnimationFrame(drawFrame);
    };

    // Start drawing when video is ready
    const handleLoadedMetadata = () => {
      console.log('[VideoCall] Video ready, starting canvas draw loop');
      drawFrame();
    };

    processingVideo.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Try starting immediately if video already loaded
    if (processingVideo.readyState >= 2) {
      drawFrame();
    }

    return () => {
      processingVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Timer to update fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 100); // Update every 100ms for smooth fade

    return () => clearInterval(interval);
  }, []);

  // ASL Recognition
  const asl = useASLRecognition({
    videoElement: localVideoElementRef.current,
    enabled: signRecognitionMode && isConnected,
    onGestureDetected: (label: string, confidence: number) => {
      console.log('[VideoCall] 🤟 ASL gesture detected:', label, 'confidence:', confidence);

      // Convert to natural text
      const text = toNaturalText(label);
      console.log('[VideoCall] 📝 Translated to:', text);

      // Send as caption to remote participant (avoid duplicates)
      if (!aslGesturesSent.has(label)) {
        console.log('[VideoCall] 📤 Sending ASL translation to remote participants:', text);
        sendCaption(text);

        // Add to local captions state so it shows in the caption box
        setCaptions(prev => [...prev, {
          id: `local-asl-${Date.now()}`,
          text,
          timestamp: Date.now(),
          sender: 'local' as const
        }].slice(-20));

        setAslGesturesSent(prev => {
          const newSet = new Set(prev);
          newSet.add(label);
          // Keep only last 50 gestures
          if (newSet.size > 50) {
            const entries = Array.from(newSet);
            return new Set(entries.slice(-50));
          }
          return newSet;
        });

        console.log('[VideoCall] ✅ ASL translation sent successfully');
      } else {
        console.log('[VideoCall] ⏭️ Skipping duplicate gesture:', label);
      }

      // Clear after a delay to allow same gesture again
      setTimeout(() => {
        setAslGesturesSent(prev => {
          const newSet = new Set(prev);
          newSet.delete(label);
          return newSet;
        });
      }, 2000);
    },
    onError: (err) => {
      console.error('[VideoCall] ASL recognition error:', err);
    },
  });

  useEffect(() => {
    sendCaptionRef.current = (text: string) => {
      sendCaption(text);
    };

    return () => {
      sendCaptionRef.current = () => {
        console.warn('[VideoCall] Caption sender not ready yet.');
      };
    };
  }, [sendCaption, sendCaptionRef]);

  // Handle speech recognition results
  useEffect(() => {
    if (speech.finalTranscript && speechRecognitionMode && isConnected) {
      // Check if this is a new transcript to avoid duplicates
      if (speech.finalTranscript !== lastProcessedTranscript.current) {
        console.log('[VideoCall] 🎤 Speech transcript:', speech.finalTranscript);
        lastProcessedTranscript.current = speech.finalTranscript;

        sendCaption(speech.finalTranscript);

        // Add to local captions state
        setCaptions(prev => [...prev, {
          id: `local-speech-${Date.now()}`,
          text: speech.finalTranscript,
          timestamp: Date.now(),
          sender: 'local' as const
        }].slice(-20));

        // Reset transcript after processing
        speech.resetTranscript();
      }
    }
  }, [speech.finalTranscript, speechRecognitionMode, isConnected, sendCaption, setCaptions, speech]);

  // Speech recognition control
  useEffect(() => {
    if (!isConnected || !speech.isSupported) return;

    if (speechRecognitionMode && !speechStarted) {
      console.log('[VideoCall] Starting speech recognition');
      speech.startListening();
      setSpeechStarted(true);
    } else if (!speechRecognitionMode && speechStarted) {
      console.log('[VideoCall] Stopping speech recognition');
      speech.stopListening();
      setSpeechStarted(false);
    }

    return () => {
      if (speechStarted) {
        speech.stopListening();
        setSpeechStarted(false);
      }
    };
  }, [isConnected, speechRecognitionMode, speechStarted, speech, signRecognitionMode]);

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const copyRoomCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomName);
      setRoomCodeCopied(true);
      setTimeout(() => setRoomCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleLeaveClick = async () => {
    await leaveCall();
    onLeave();
  };

  const localCaptions = captions.filter(c => c.sender === 'local');
  const remoteCaptions = captions.filter(c => c.sender === 'remote');

  // Group captions by time proximity (within 3 seconds = same line)
  const groupCaptionsByTime = (captionList: Caption[], maxGapMs = 3000) => {
    if (captionList.length === 0) return [];

    const groups: Caption[][] = [];
    let currentGroup: Caption[] = [captionList[0]];

    for (let i = 1; i < captionList.length; i++) {
      const timeDiff = captionList[i].timestamp - captionList[i - 1].timestamp;

      if (timeDiff <= maxGapMs) {
        // Same group
        currentGroup.push(captionList[i]);
      } else {
        // New group
        groups.push(currentGroup);
        currentGroup = [captionList[i]];
      }
    }

    // Add last group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Filter out groups older than 8 seconds
    const now = Date.now();
    const filteredGroups = groups.filter(group => {
      const latestTimestamp = group[group.length - 1].timestamp;
      return now - latestTimestamp < 8000;
    });

    // Return last 5 groups
    return filteredGroups.slice(-5);
  };

  const groupedLocalCaptions = groupCaptionsByTime(localCaptions);
  const groupedRemoteCaptions = groupCaptionsByTime(remoteCaptions);

  return (
    <div ref={callRootRef} style={styles.callContainer}>
      {/* Header with controls */}
      <header className="call-header" style={styles.header}>
        <div style={styles.headerLeft}>
          <a
            href="/"
            style={{
              ...styles.headerTitle,
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          >
            <img src="/logo.svg" alt="DuckSpeak Logo" style={{ width: '2rem', height: '2rem', marginRight: '0.5rem' }} />
            DuckSpeak
          </a>
          <div style={styles.statusBadge}>
            <span className="status-dot" style={styles.statusDot}></span>
            {hasRemoteParticipant ? 'Connected' : 'Waiting...'}
          </div>
          <div className="room-badge" style={styles.roomCodeBadge}>
            <span style={styles.roomCodeText}>{roomName}</span>
            <button
              onClick={copyRoomCodeToClipboard}
              style={styles.roomCodeCopyBtn}
              title="Copy room code"
            >
              {roomCodeCopied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div style={styles.headerControls}>
          {/* Audio Mixer Dropdown */}
          <div style={styles.mixerContainer} data-mixer-menu>
            <button
              onClick={() => {
                setShowAudioMenu(!showAudioMenu);
                setShowVideoMenu(false);
              }}
              disabled={isConnecting}
              style={{
                ...styles.controlBtn,
                ...(isMuted && styles.controlBtnMuted),
              }}
              title="Audio settings"
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            {showAudioMenu && (
              <div style={{
                ...styles.dropdownMenu,
                animation: 'slideDown 0.2s ease-out',
              }}>
                <div style={styles.dropdownHeader}>Audio Input</div>
                <button
                  type="button"
                  onClick={handleAudioToggle}
                  style={{
                    ...styles.dropdownItem,
                    cursor: 'pointer',
                  }}
                >
                  {isMuted ? '❌ Disabled' : '✅ Enabled'}
                </button>
                <div style={styles.dropdownDivider}></div>
                {audioDevices.map(device => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleAudioDeviceChange(device.deviceId)}
                    style={{
                      ...styles.dropdownItem,
                      ...(selectedAudioDevice === device.deviceId && styles.dropdownItemSelected),
                    }}
                    disabled={isMuted}
                  >
                    {selectedAudioDevice === device.deviceId && '✓ '}
                    {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Mixer Dropdown */}
          <div style={styles.mixerContainer} data-mixer-menu>
            <button
              onClick={() => {
                setShowVideoMenu(!showVideoMenu);
                setShowAudioMenu(false);
              }}
              disabled={isConnecting}
              style={{
                ...styles.controlBtn,
                ...(isVideoOff && styles.controlBtnMuted),
              }}
              title="Video settings"
            >
              {isVideoOff ? '📹' : '📷'}
            </button>
            {showVideoMenu && (
              <div style={{
                ...styles.dropdownMenu,
                animation: 'slideDown 0.2s ease-out',
              }}>
                <div style={styles.dropdownHeader}>Video Input</div>
                <button
                  type="button"
                  onClick={handleVideoToggle}
                  style={{
                    ...styles.dropdownItem,
                    cursor: 'pointer',
                  }}
                >
                  {isVideoOff ? '❌ Disabled' : '✅ Enabled'}
                </button>
                <div style={styles.dropdownDivider}></div>
                {videoDevices.map(device => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleVideoDeviceChange(device.deviceId)}
                    style={{
                      ...styles.dropdownItem,
                      ...(selectedVideoDevice === device.deviceId && styles.dropdownItemSelected),
                    }}
                    disabled={isVideoOff}
                  >
                    {selectedVideoDevice === device.deviceId && '✓ '}
                    {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onToggleSignRecognition}
            onMouseEnter={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, true)}
            onMouseLeave={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, false)}
            style={{
              ...styles.controlBtn,
              ...(signRecognitionMode && styles.controlBtnActive),
            }}
            title={signRecognitionMode ? 'Disable sign recognition' : 'Enable sign recognition (requires trained model)'}
          >
            🤟
          </button>

          <button
            onClick={() => setSpeechRecognitionMode(!speechRecognitionMode)}
            onMouseEnter={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, true)}
            onMouseLeave={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, false)}
            style={{
              ...styles.controlBtn,
              ...(speechRecognitionMode && styles.controlBtnActive),
            }}
            title={speechRecognitionMode ? 'Disable speech recognition' : 'Enable speech recognition'}
          >
            💬
          </button>

          <button
            onClick={copyLinkToClipboard}
            onMouseEnter={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, true)}
            onMouseLeave={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, false)}
            style={styles.controlBtn}
            title="Copy share link"
          >
            {linkCopied ? '✅' : '🔗'}
          </button>

          <button
            onClick={handleLeaveClick}
            onMouseEnter={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, true)}
            onMouseLeave={(e) => callScopeRef.current?.methods.hoverControl?.(e.currentTarget, false)}
            style={styles.leaveBtn}
            title="Leave call"
          >
            ☎️ Leave
          </button>
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      {signRecognitionMode && (
        <div style={asl.isModelLoaded ? styles.successBanner : (asl.error ? styles.errorBanner : styles.infoBanner)}>
          {asl.isModelLoaded ? (
            <>✅ <strong>ASL Translation Active</strong> - Gestures will appear in captions</>
          ) : asl.error ? (
            <>
              ⚠️ <strong>{asl.error}</strong>
              {asl.error.includes('No trained model') && (
                <> - Go to the <strong>Collect & Train</strong> tab to create a model first!</>
              )}
            </>
          ) : (
            <>⏳ Loading your trained ASL model from Collect & Train tab...</>
          )}
        </div>
      )}

      {speech.error && (
        <div style={styles.errorBanner}>
          ⚠️ Speech: {speech.error}
        </div>
      )}

      {/* Main video grid */}
      <div style={styles.videoGrid}>
        {/* Local video */}
        <div className="video-card" style={styles.videoCard}>
          <div style={styles.videoContainer}>
            {/* Hidden processing video for ASL detection - LiveKit stream */}
            <video
              ref={handleLocalVideoRef}
              autoPlay
              muted
              playsInline
              style={styles.hiddenProcessingVideo}
            />

            {/* Visible display canvas - draws video frames, isolated from re-renders */}
            <canvas
              ref={displayCanvasRef}
              style={styles.video}
            />

            <div style={styles.videoLabel}>
              {participantName} (You)
            </div>

            <div style={{
              position: 'absolute' as const,
              top: '70px',
              left: '20px',
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '8px',
              zIndex: 10,
            }}>
              {signRecognitionMode && (
                <div style={{
                  ...styles.signModeIndicator,
                  position: 'relative' as const,
                  bottom: 'auto',
                  right: 'auto',
                  left: 0,
                  top: 0,
                }}>
                  🤟 Sign Mode
                </div>
              )}
              {speechRecognitionMode && (
                <div style={{
                  ...styles.speechModeIndicator,
                  position: 'relative' as const,
                  bottom: 'auto',
                  left: 0,
                  top: 0,
                }}>
                  💬 Speech Mode
                </div>
              )}
            </div>
            {speechRecognitionMode && speech.isListening && (
              <div style={styles.listeningIndicator}>
                🎙️ Listening
              </div>
            )}
          </div>

          {/* Caption text box below video */}
          <div style={styles.captionTextBox}>
            <div style={styles.captionTextBoxHeader}>
              {participantName}'s Captions
            </div>
            <div style={styles.captionTextBoxContent}>
              {groupedLocalCaptions.length > 0 ? (
                groupedLocalCaptions.map((group) => (
                  <div
                    key={group[0].id}
                    style={{
                      ...styles.captionTextLine,
                      opacity: getOpacity(group),
                      transition: 'opacity 0.3s ease-out'
                    }}
                  >
                    <span style={styles.captionIcon}>
                      {signRecognitionMode ? '🤟' : speechRecognitionMode ? '💬' : '💬'}
                    </span>
                    {group.map(c => c.text).join(' ')}
                  </div>
                ))
              ) : (
                <div style={styles.captionTextEmpty}>
                  {signRecognitionMode ? 'Sign to see ASL translations' : speechRecognitionMode ? 'Speak to see captions' : 'Enable ASL or speech mode'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remote participants */}
        <RemoteParticipants
          groupedRemoteCaptions={groupedRemoteCaptions}
          linkCopied={linkCopied}
          copyLinkToClipboard={copyLinkToClipboard}
        />
      </div>
    </div>
  );
}


// Add these to your global CSS or create a separate CSS file
const globalStyles = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = globalStyles;
  document.head.appendChild(styleEl);
}
