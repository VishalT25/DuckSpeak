/**
 * VideoCall.tsx - Person A's LiveKit-powered Video Call page (Video + Speech)
 * Maintains the original split-pane layout while swapping Daily.co for LiveKit.
 */

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKit } from '../hooks/useLiveKit';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { SignAnimator } from '../components/SignAnimator';
import { getLiveKitToken } from '../utils/livekitToken';

interface ConnectedVideoCallProps {
  speech: ReturnType<typeof useSpeechToText>;
  localCaptions: string[];
  remoteCaptions: string[];
  sendCaptionRef: MutableRefObject<(text: string) => void>;
  onLeave: () => void;
  onRemoteCaptionReceived: (text: string) => void;
}

export function VideoCall() {
  const [tokenInput, setTokenInput] = useState('');
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [remoteCaptions, setRemoteCaptions] = useState<string[]>([]);
  const [localCaptions, setLocalCaptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const captionsSentRef = useRef<Set<string>>(new Set());
  const sendCaptionRef = useRef<(text: string) => void>(() => {
    console.warn('[VideoCall] Caption sender not ready yet.');
  });

  const serverUrl = import.meta.env.VITE_LIVEKIT_URL ?? '';

  const speech = useSpeechToText({
    continuous: true,
    interimResults: true,
    onTranscript: (transcript: string, isFinal: boolean) => {
      const trimmed = transcript.trim();
      if (!isFinal || trimmed.length === 0) {
        return;
      }

      if (!captionsSentRef.current.has(trimmed)) {
        sendCaptionRef.current(trimmed);
        captionsSentRef.current.add(trimmed);
        setLocalCaptions((prev) => [...prev, trimmed]);

        if (captionsSentRef.current.size > 50) {
          const entries = Array.from(captionsSentRef.current);
          captionsSentRef.current = new Set(entries.slice(-50));
        }
      }
    },
  });

  const handleRemoteCaption = useCallback((text: string) => {
    setRemoteCaptions((prev) => [...prev, text]);
  }, []);

  const handleJoinCall = async () => {
    if (!serverUrl) {
      setError('LiveKit server URL not configured. Set VITE_LIVEKIT_URL to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      let token: string;

      // If user provided a token, use it
      if (tokenInput.trim()) {
        token = tokenInput.trim();
      } else {
        // Otherwise, try to get token from API or environment
        try {
          // Try API token endpoint first (production)
          const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomName: 'duckspeak-room',
              participantName: `person-${Math.random().toString(36).substring(7)}`,
              metadata: JSON.stringify({ role: 'personA' }),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch token from API');
          }

          const data = await response.json();
          token = data.token;
        } catch (apiError) {
          // Fallback to environment variable for local dev
          console.log('[VideoCall] API token failed, trying env variable:', apiError);
          const envToken = getLiveKitToken();
          if (!envToken) {
            throw new Error('No token available. Please provide a token or configure VITE_LIVEKIT_TOKEN');
          }
          token = envToken;
        }
      }

      setConnectionToken(token);
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
    setLocalCaptions([]);
    setRemoteCaptions([]);
    setConnectionToken(null);
    setIsConnecting(false);
  }, []);

  const handleLeaveCall = useCallback(() => {
    speech.stopListening();
    resetSessionState();
  }, [resetSessionState, speech]);

  if (!connectionToken) {
    return (
      <div style={styles.joinContainer}>
        <div style={styles.joinCard}>
          <h1 style={styles.title}>Person A: Video + Speech</h1>
          <p style={styles.subtitle}>
            Connect to your LiveKit room to start a video call with live captions
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>LiveKit Access Token (Optional)</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Leave blank for auto-generated token or paste your own"
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinCall()}
            />
            <p style={styles.hint}>
              Token will be automatically generated. Paste a custom token only if needed.
            </p>
          </div>

          <button
            onClick={handleJoinCall}
            disabled={isConnecting}
            style={{
              ...styles.button,
              ...styles.joinButton,
              ...(isConnecting && styles.buttonDisabled),
            }}
          >
            {isConnecting ? 'Connecting…' : 'Join Call'}
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {speech.error && !speech.isSupported && (
            <div style={styles.warning}>
              ⚠️ Speech Recognition not supported. Captions will not work.
            </div>
          )}

          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>How to join:</h3>
            <ol style={styles.instructionsList}>
              <li>Click "Join Call" to auto-generate a token and join the room</li>
              <li>Share the room name "duckspeak-room" with Person B</li>
              <li>Person B can join the same room for video calling</li>
              <li>Optional: Paste a custom token if you have one</li>
            </ol>
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
        localCaptions={localCaptions}
        remoteCaptions={remoteCaptions}
        sendCaptionRef={sendCaptionRef}
        onLeave={handleLeaveCall}
        onRemoteCaptionReceived={handleRemoteCaption}
      />
    </LiveKitRoom>
  );
}

function ConnectedVideoCall({
  speech,
  localCaptions,
  remoteCaptions,
  sendCaptionRef,
  onLeave,
  onRemoteCaptionReceived,
}: ConnectedVideoCallProps) {
  const {
    localVideoRef,
    remoteVideoRef,
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
    onRemoteCaptionReceived: (caption) => onRemoteCaptionReceived(caption.text),
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

  useEffect(() => {
    if (isConnected && speech.isSupported && !speech.isListening) {
      speech.startListening();
    }

    if (!isConnected && speech.isListening) {
      speech.stopListening();
    }
  }, [isConnected, speech]);

  const handleLeaveClick = async () => {
    await leaveCall();
    onLeave();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Person A: LiveKit Video Call</h1>
        <div style={styles.headerControls}>
          <button
            onClick={toggleMute}
            disabled={isConnecting}
            style={{
              ...styles.button,
              ...styles.controlButton,
              ...(isMuted && styles.mutedButton),
            }}
          >
            {isMuted ? '🔇 Unmute' : '🎤 Mute'}
          </button>

          <button
            onClick={toggleVideo}
            disabled={isConnecting}
            style={{
              ...styles.button,
              ...styles.controlButton,
              ...(isVideoOff && styles.mutedButton),
            }}
          >
            {isVideoOff ? '📹 Video On' : '📷 Video Off'}
          </button>

          <button
            onClick={() => (speech.isListening ? speech.stopListening() : speech.startListening())}
            style={{
              ...styles.button,
              ...styles.controlButton,
              ...(speech.isListening && styles.activeButton),
            }}
          >
            {speech.isListening ? '🎙️ Stop Speech' : '🎙️ Start Speech'}
          </button>

          <button onClick={handleLeaveClick} style={{ ...styles.button, ...styles.leaveButton }}>
            Leave Call
          </button>
        </div>
      </header>

      {(error || speech.error) && (
        <div style={styles.errorBanner}>
          {error && <span>LiveKit: {error}</span>}
          {speech.error && <span> Speech: {speech.error}</span>}
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.leftPane}>
          <div style={styles.videoContainer}>
            <div style={styles.videoLabel}>You (Local)</div>
            <video ref={localVideoRef} autoPlay muted playsInline style={styles.video} />

            {speech.currentTranscript && (
              <div style={styles.captionOverlay}>{speech.currentTranscript}</div>
            )}

            {speech.isListening && <div style={styles.listeningIndicator}>🎙️ Listening</div>}
          </div>

          <div style={styles.videoContainer}>
            <div style={styles.videoLabel}>
              {hasRemoteParticipant ? 'Person B (Remote)' : 'Waiting for Person B...'}
            </div>
            <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
            {!hasRemoteParticipant && (
              <div style={styles.waitingOverlay}>
                Waiting for remote participant to join...
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightPane}>
          <div style={styles.captionsBox}>
            <h3 style={styles.captionsTitle}>Your Captions (Sent)</h3>
            <div style={styles.captionsList}>
              {localCaptions.length === 0 ? (
                <div style={styles.placeholderText}>Start speaking to generate captions...</div>
              ) : (
                localCaptions.map((caption, idx) => (
                  <div key={idx} style={styles.captionItem}>
                    {caption}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={styles.signAnimatorBox}>
            <h3 style={styles.captionsTitle}>Sign Animation</h3>
            <SignAnimator
              caption={speech.currentTranscript || localCaptions[localCaptions.length - 1] || ''}
              isActive={speech.isListening}
            />
          </div>

          <div style={styles.captionsBox}>
            <h3 style={styles.captionsTitle}>Person B Captions (Received)</h3>
            <div style={styles.captionsList}>
              {remoteCaptions.length === 0 ? (
                <div style={styles.placeholderText}>Waiting for captions from Person B...</div>
              ) : (
                remoteCaptions.map((caption, idx) => (
                  <div key={idx} style={{ ...styles.captionItem, ...styles.remoteCaptionItem }}>
                    {caption}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  joinContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    padding: '20px',
  } as const,
  joinCard: {
    maxWidth: '600px',
    width: '100%',
    padding: '40px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '2px solid #333',
  } as const,
  title: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
    color: '#00ff00',
    marginBottom: '10px',
    textAlign: 'center' as const,
  } as const,
  subtitle: {
    fontSize: '16px',
    color: '#999',
    marginBottom: '30px',
    textAlign: 'center' as const,
  } as const,
  inputGroup: {
    marginBottom: '20px',
  } as const,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: '8px',
  } as const,
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#222',
    color: '#fff',
    border: '2px solid #333',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as const,
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as const,
  joinButton: {
    width: '100%',
    backgroundColor: '#00ff00',
    color: '#000',
  } as const,
  buttonDisabled: {
    backgroundColor: '#555',
    cursor: 'not-allowed',
    opacity: 0.6,
  } as const,
  error: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: 'rgba(255, 51, 51, 0.2)',
    border: '1px solid #ff3333',
    borderRadius: '6px',
    color: '#ff6666',
    fontSize: '14px',
  } as const,
  warning: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: 'rgba(255, 153, 0, 0.2)',
    border: '1px solid #ff9900',
    borderRadius: '6px',
    color: '#ffaa44',
    fontSize: '14px',
  } as const,
  instructions: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#222',
    borderRadius: '8px',
  } as const,
  instructionsTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: '12px',
  } as const,
  instructionsList: {
    paddingLeft: '20px',
    color: '#ccc',
    lineHeight: 1.6,
  } as const,
  link: {
    color: '#00ff00',
    textDecoration: 'none',
  } as const,
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: '#050505',
    color: '#fff',
  } as const,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 30px',
    borderBottom: '1px solid #333',
    backgroundColor: '#111',
  } as const,
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
  } as const,
  headerControls: {
    display: 'flex',
    gap: '12px',
  } as const,
  controlButton: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
  } as const,
  leaveButton: {
    backgroundColor: '#ff3b30',
    color: '#fff',
  } as const,
  mutedButton: {
    backgroundColor: '#444',
    color: '#bbb',
  } as const,
  activeButton: {
    backgroundColor: '#0055ff',
    color: '#fff',
  } as const,
  errorBanner: {
    padding: '12px 24px',
    backgroundColor: 'rgba(255, 60, 60, 0.2)',
    borderBottom: '1px solid #ff3c3c',
    display: 'flex',
    gap: '16px',
  } as const,
  mainContent: {
    display: 'flex',
    flex: 1,
    padding: '20px',
    gap: '20px',
  } as const,
  leftPane: {
    flex: 1.5,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  } as const,
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  } as const,
  videoContainer: {
    position: 'relative' as const,
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #222',
    minHeight: '280px',
  } as const,
  videoLabel: {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    padding: '6px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  } as const,
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    backgroundColor: '#111',
  } as const,
  captionOverlay: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    fontSize: '18px',
    maxWidth: '90%',
    textAlign: 'center' as const,
  } as const,
  listeningIndicator: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    padding: '6px 10px',
    backgroundColor: 'rgba(0, 150, 255, 0.6)',
    borderRadius: '6px',
    fontSize: '14px',
  } as const,
  waitingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    fontSize: '18px',
    color: '#ccc',
  } as const,
  captionsBox: {
    backgroundColor: '#111',
    borderRadius: '12px',
    border: '1px solid #222',
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  } as const,
  captionsTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
  } as const,
  captionsList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  } as const,
  captionItem: {
    padding: '10px 14px',
    backgroundColor: '#1c1c1c',
    borderRadius: '8px',
    border: '1px solid #333',
    fontSize: '15px',
  } as const,
  remoteCaptionItem: {
    backgroundColor: '#142e1f',
    borderColor: '#1e7a46',
  } as const,
  placeholderText: {
    color: '#666',
    fontStyle: 'italic' as const,
  } as const,
  signAnimatorBox: {
    backgroundColor: '#111',
    borderRadius: '12px',
    border: '1px solid #222',
    padding: '20px',
  } as const,
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px',
    marginBottom: 0,
  } as const,
} as const;
