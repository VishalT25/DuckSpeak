/**
 * VideoCall.tsx - Enhanced Video Call with Live Captions & Sign Language
 * Beautiful UI with smooth animations and robust caption/sign synchronization
 */

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom, useParticipants } from '@livekit/components-react';
import { useLiveKit, CaptionMessage } from '../hooks/useLiveKit';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useASLRecognition } from '../hooks/useASLRecognition';
import { toNaturalText } from '../lib/labels';
import { Track } from 'livekit-client';

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

  // Generate random room ID on mount
  useEffect(() => {
    const randomRoomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    setRoomName(randomRoomId);
  }, []);

  const speech = useSpeechToText({
    continuous: true,
    interimResults: true,
    onTranscript: (transcript: string, isFinal: boolean) => {
      const trimmed = transcript.trim();
      if (!isFinal || trimmed.length === 0 || signRecognitionMode) {
        return;
      }

      if (!captionsSentRef.current.has(trimmed)) {
        sendCaptionRef.current(trimmed);
        captionsSentRef.current.add(trimmed);

        // Add to local captions
        setCaptions(prev => [...prev, {
          id: `local-${Date.now()}`,
          text: trimmed,
          timestamp: Date.now(),
          sender: 'local' as const
        }].slice(-20)); // Keep last 20 captions

        if (captionsSentRef.current.size > 50) {
          const entries = Array.from(captionsSentRef.current);
          captionsSentRef.current = new Set(entries.slice(-50));
        }
      }
    },
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
      <div style={styles.joinContainer}>
        <div style={styles.joinCard}>
          <div style={styles.titleGlow}>
            <h1 style={styles.title}>🦆 DuckSpeak</h1>
            <p style={styles.tagline}>Real-Time ASL Video Calling</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Name</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name (auto-generated)"
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
            />
            <p style={styles.hint}>
              Share this room name with others to join the same call
            </p>
          </div>

          <button
            onClick={handleJoinCall}
            disabled={isConnecting || !participantName.trim()}
            style={{
              ...styles.button,
              ...styles.joinButton,
              ...(isConnecting || !participantName.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {isConnecting ? '🔄 Connecting…' : '🎥 Join Call'}
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {speech.error && !speech.isSupported && (
            <div style={styles.warning}>
              ⚠️ Speech Recognition not supported. Captions will not work.
            </div>
          )}

          <div style={styles.features}>
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
      />
    </LiveKitRoom>
  );
}

interface RemoteParticipantsProps {
  latestRemoteCaption: Caption | undefined;
  linkCopied: boolean;
  copyLinkToClipboard: () => void;
}

function RemoteParticipants({ latestRemoteCaption, linkCopied, copyLinkToClipboard }: RemoteParticipantsProps) {
  const participants = useParticipants();
  const remoteParticipants = participants.filter(p => p.isLocal === false);

  // If no remote participants, show waiting message
  if (remoteParticipants.length === 0) {
    return (
      <div style={styles.videoCard}>
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
          <div key={participant.identity} style={styles.videoCard}>
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
                {latestRemoteCaption ? (
                  <div style={styles.captionTextLine}>
                    <span style={styles.captionIcon}>💬</span>
                    {latestRemoteCaption.text}
                  </div>
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
}: ConnectedVideoCallProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [speechStarted, setSpeechStarted] = useState(false);
  const [aslGesturesSent, setAslGesturesSent] = useState<Set<string>>(new Set());
  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);

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
  } = useLiveKit({
    onRemoteCaptionReceived,
  });

  // Track the local video element
  const handleLocalVideoRef = useCallback((element: HTMLVideoElement | null) => {
    localVideoElementRef.current = element;
    localVideoRef(element);
  }, [localVideoRef]);

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

  // Speech recognition control - fixed dependency loop
  useEffect(() => {
    if (!isConnected || !speech.isSupported) return;

    if (!signRecognitionMode && !speechStarted) {
      console.log('[VideoCall] Starting speech recognition');
      speech.startListening();
      setSpeechStarted(true);
    }

    if (signRecognitionMode && speechStarted) {
      console.log('[VideoCall] Stopping speech recognition (sign mode)');
      speech.stopListening();
      setSpeechStarted(false);
    }

    return () => {
      if (speechStarted) {
        speech.stopListening();
        setSpeechStarted(false);
      }
    };
  }, [isConnected, signRecognitionMode, speech.isSupported]);

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleLeaveClick = async () => {
    await leaveCall();
    onLeave();
  };

  const localCaptions = captions.filter(c => c.sender === 'local');
  const remoteCaptions = captions.filter(c => c.sender === 'remote');
  const latestLocalCaption = localCaptions[localCaptions.length - 1];
  const latestRemoteCaption = remoteCaptions[remoteCaptions.length - 1];

  return (
    <div style={styles.callContainer}>
      {/* Header with controls */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>🦆 DuckSpeak</h1>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot}></span>
            {hasRemoteParticipant ? 'Connected' : 'Waiting...'}
          </div>
        </div>

        <div style={styles.headerControls}>
          <button
            onClick={toggleMute}
            disabled={isConnecting}
            style={{
              ...styles.controlBtn,
              ...(isMuted && styles.controlBtnMuted),
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          <button
            onClick={toggleVideo}
            disabled={isConnecting}
            style={{
              ...styles.controlBtn,
              ...(isVideoOff && styles.controlBtnMuted),
            }}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>

          <button
            onClick={onToggleSignRecognition}
            style={{
              ...styles.controlBtn,
              ...(signRecognitionMode && styles.controlBtnActive),
            }}
            title={signRecognitionMode ? 'Disable sign recognition' : 'Enable sign recognition (requires trained model)'}
          >
            🤟
          </button>

          <button
            onClick={copyLinkToClipboard}
            style={styles.controlBtn}
            title="Copy share link"
          >
            {linkCopied ? '✅' : '🔗'}
          </button>

          <button
            onClick={handleLeaveClick}
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
        <div style={styles.videoCard}>
          <div style={styles.videoContainer}>
            <video
              ref={handleLocalVideoRef}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />
            <div style={styles.videoLabel}>
              {participantName} (You)
            </div>
            {speech.isListening && !signRecognitionMode && (
              <div style={styles.listeningIndicator}>
                🎙️ Listening
              </div>
            )}
            {signRecognitionMode && (
              <div style={styles.signModeIndicator}>
                🤟 Sign Mode
              </div>
            )}
          </div>

          {/* Caption text box below video */}
          <div style={styles.captionTextBox}>
            <div style={styles.captionTextBoxHeader}>
              {participantName}'s Captions
            </div>
            <div style={styles.captionTextBoxContent}>
              {latestLocalCaption ? (
                <div style={styles.captionTextLine}>
                  <span style={styles.captionIcon}>
                    {signRecognitionMode ? '🤟' : '💬'}
                  </span>
                  {latestLocalCaption.text}
                </div>
              ) : (
                <div style={styles.captionTextEmpty}>
                  {signRecognitionMode ? 'Sign to see ASL translations' : 'Speak to see captions'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remote participants */}
        <RemoteParticipants
          latestRemoteCaption={latestRemoteCaption}
          linkCopied={linkCopied}
          copyLinkToClipboard={copyLinkToClipboard}
        />
      </div>
    </div>
  );
}

const styles = {
  // Join screen styles
  joinContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    padding: '20px',
  } as const,
  joinCard: {
    maxWidth: '500px',
    width: '100%',
    padding: '50px 40px',
    background: 'rgba(26, 26, 46, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 255, 136, 0.1)',
  } as const,
  titleGlow: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  } as const,
  title: {
    fontSize: '48px',
    fontWeight: 'bold' as const,
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
    textShadow: '0 0 30px rgba(0, 255, 136, 0.5)',
  } as const,
  tagline: {
    fontSize: '16px',
    color: '#7effa8',
    opacity: 0.9,
  } as const,
  inputGroup: {
    marginBottom: '24px',
  } as const,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#7effa8',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  } as const,
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    background: 'rgba(0, 0, 0, 0.4)',
    color: '#fff',
    border: '2px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
  } as const,
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px',
    fontStyle: 'italic' as const,
  } as const,
  button: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600' as const,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.5px',
  } as const,
  joinButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    color: '#0a0a0a',
    boxShadow: '0 10px 30px rgba(0, 255, 136, 0.3)',
  } as const,
  buttonDisabled: {
    background: '#333',
    color: '#666',
    cursor: 'not-allowed',
    boxShadow: 'none',
  } as const,
  error: {
    marginTop: '20px',
    padding: '14px',
    background: 'rgba(255, 51, 51, 0.15)',
    border: '1px solid rgba(255, 51, 51, 0.4)',
    borderRadius: '12px',
    color: '#ff6666',
    fontSize: '14px',
  } as const,
  warning: {
    marginTop: '20px',
    padding: '14px',
    background: 'rgba(255, 153, 0, 0.15)',
    border: '1px solid rgba(255, 153, 0, 0.4)',
    borderRadius: '12px',
    color: '#ffaa44',
    fontSize: '14px',
  } as const,
  features: {
    marginTop: '40px',
    padding: '24px',
    background: 'rgba(0, 255, 136, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 255, 136, 0.1)',
  } as const,
  featuresTitle: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: '#7effa8',
    marginBottom: '16px',
  } as const,
  featuresList: {
    listStyle: 'none',
    padding: 0,
    color: '#aaa',
    lineHeight: 2,
  } as const,

  // Call screen styles
  callContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    color: '#fff',
    overflow: 'hidden',
  } as const,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
    zIndex: 10,
  } as const,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  } as const,
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as const,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    background: 'rgba(0, 255, 136, 0.1)',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#7effa8',
  } as const,
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00ff88',
    animation: 'pulse 2s infinite',
  } as const,
  headerControls: {
    display: 'flex',
    gap: '12px',
  } as const,
  controlBtn: {
    width: '48px',
    height: '48px',
    border: 'none',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  controlBtnMuted: {
    background: 'rgba(255, 51, 51, 0.2)',
    color: '#ff6666',
  } as const,
  controlBtnActive: {
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    color: '#0a0a0a',
  } as const,
  leaveBtn: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '12px',
    background: 'rgba(255, 51, 51, 0.8)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as const,
  errorBanner: {
    padding: '12px 24px',
    background: 'rgba(255, 51, 51, 0.2)',
    borderBottom: '1px solid rgba(255, 51, 51, 0.4)',
    color: '#ff6666',
    fontSize: '14px',
  } as const,
  infoBanner: {
    padding: '12px 24px',
    background: 'rgba(0, 136, 255, 0.2)',
    borderBottom: '1px solid rgba(0, 136, 255, 0.4)',
    color: '#66ccff',
    fontSize: '14px',
  } as const,
  successBanner: {
    padding: '12px 24px',
    background: 'rgba(0, 255, 136, 0.2)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.4)',
    color: '#7effa8',
    fontSize: '14px',
  } as const,
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    padding: '24px',
    flex: 1,
    overflow: 'auto',
    alignContent: 'start',
  } as const,
  videoCard: {
    position: 'relative' as const,
    borderRadius: '20px',
    background: '#000',
    border: '2px solid rgba(0, 255, 136, 0.2)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
  } as const,
  videoContainer: {
    position: 'relative' as const,
    width: '100%',
    minHeight: '400px',
    flex: '0 0 auto',
    overflow: 'hidden',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  } as const,
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    backgroundColor: '#111',
    transform: 'scaleX(-1)',
  } as const,
  videoLabel: {
    position: 'absolute' as const,
    top: '16px',
    left: '16px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#7effa8',
    border: '1px solid rgba(0, 255, 136, 0.3)',
  } as const,
  listeningIndicator: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    background: 'rgba(0, 136, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    animation: 'pulse 1.5s infinite',
  } as const,
  signModeIndicator: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#0a0a0a',
    animation: 'pulse 1.5s infinite',
  } as const,
  waitingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  waitingText: {
    textAlign: 'center' as const,
    color: '#aaa',
  } as const,
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 255, 136, 0.2)',
    borderTop: '4px solid #00ff88',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  } as const,
  shareButton: {
    marginTop: '20px',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
    color: '#0a0a0a',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  } as const,
  captionOverlay: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: '80%',
    animation: 'slideUp 0.3s ease',
  } as const,
  captionBubble: {
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '2px solid rgba(0, 255, 136, 0.4)',
    fontSize: '16px',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  } as const,
  remoteCaptionBubble: {
    border: '2px solid rgba(0, 204, 255, 0.4)',
  } as const,
  signDisplay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
    animation: 'scaleIn 0.4s ease',
  } as const,
  signLabel: {
    marginTop: '12px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#7effa8',
  } as const,
  aslRecognitionDisplay: {
    position: 'absolute' as const,
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 255, 136, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '16px 24px',
    borderRadius: '16px',
    border: '2px solid rgba(0, 255, 136, 1)',
    boxShadow: '0 8px 32px rgba(0, 255, 136, 0.4)',
    zIndex: 10,
    animation: 'scaleIn 0.3s ease',
  } as const,
  aslGestureLabel: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#000',
    textAlign: 'center' as const,
    marginBottom: '4px',
  } as const,
  aslConfidence: {
    fontSize: '12px',
    color: '#004d26',
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  } as const,
  captionTextBox: {
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    borderTop: '2px solid rgba(0, 255, 136, 0.3)',
    padding: '16px',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
  } as const,
  captionTextBoxHeader: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#7effa8',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as const,
  captionTextBoxContent: {
    minHeight: '60px',
    maxHeight: '120px',
    overflowY: 'auto' as const,
  } as const,
  captionTextLine: {
    fontSize: '16px',
    color: '#fff',
    lineHeight: 1.5,
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  } as const,
  captionIcon: {
    fontSize: '18px',
    flexShrink: 0,
  } as const,
  captionTextEmpty: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    padding: '20px 0',
  } as const,
  captionSidebar: {
    position: 'absolute' as const,
    right: '24px',
    top: '100px',
    bottom: '24px',
    width: '320px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 5,
  } as const,
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: '#7effa8',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
  } as const,
  captionList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  } as const,
  emptyCaptions: {
    color: '#666',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginTop: '40px',
  } as const,
  captionItem: {
    padding: '12px',
    borderRadius: '12px',
    fontSize: '13px',
    animation: 'fadeIn 0.3s ease',
  } as const,
  localCaptionItem: {
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
  } as const,
  remoteCaptionItem: {
    background: 'rgba(0, 204, 255, 0.1)',
    border: '1px solid rgba(0, 204, 255, 0.3)',
  } as const,
  captionSender: {
    fontSize: '11px',
    color: '#7effa8',
    fontWeight: '600' as const,
    marginBottom: '4px',
  } as const,
  captionText: {
    color: '#fff',
    lineHeight: 1.5,
    marginBottom: '4px',
  } as const,
  captionTime: {
    fontSize: '10px',
    color: '#666',
  } as const,
  speechNotSupported: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(255, 153, 0, 0.15)',
    border: '1px solid rgba(255, 153, 0, 0.3)',
    borderRadius: '8px',
    color: '#ffaa44',
    fontSize: '12px',
    textAlign: 'center' as const,
  } as const,
} as const;

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
