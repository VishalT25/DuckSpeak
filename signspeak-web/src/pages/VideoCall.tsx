/**
 * VideoCall.tsx - Enhanced Video Call with Live Captions & Sign Language
 * Beautiful UI with smooth animations and robust caption/sign synchronization
 */

import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastProcessedTranscript = useRef<string>('');
  const animationFrameIdRef = useRef<number | null>(null);

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
  const handleAudioToggle = async () => {
    const nextEnabled = !audioEnabled;
    setAudioEnabled(nextEnabled);
    await toggleMute();
  };

  // Handle video enable/disable
  const handleVideoToggle = async () => {
    const nextEnabled = !videoEnabled;
    setVideoEnabled(nextEnabled);
    await toggleVideo();
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
    <div style={styles.callContainer}>
      {/* Header with controls */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>🦆 DuckSpeak</h1>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot}></span>
            {hasRemoteParticipant ? 'Connected' : 'Waiting...'}
          </div>
          <div style={styles.roomCodeBadge}>
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
              onClick={() => setShowAudioMenu(!showAudioMenu)}
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
              <div style={styles.dropdownMenu}>
                <div style={styles.dropdownHeader}>Audio Input</div>
                <button
                  onClick={handleAudioToggle}
                  style={{
                    ...styles.dropdownItem,
                    ...(isMuted && styles.dropdownItemDisabled),
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
              onClick={() => setShowVideoMenu(!showVideoMenu)}
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
              <div style={styles.dropdownMenu}>
                <div style={styles.dropdownHeader}>Video Input</div>
                <button
                  onClick={handleVideoToggle}
                  style={{
                    ...styles.dropdownItem,
                    ...(isVideoOff && styles.dropdownItemDisabled),
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
            {speechRecognitionMode && speech.isListening && (
              <div style={styles.listeningIndicator}>
                🎙️ Listening
              </div>
            )}
            {signRecognitionMode && (
              <div style={styles.signModeIndicator}>
                🤟 Sign Mode
              </div>
            )}
            {speechRecognitionMode && (
              <div style={styles.speechModeIndicator}>
                💬 Speech Mode
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
  roomCodeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'rgba(0, 204, 255, 0.1)',
    borderRadius: '20px',
    fontSize: '13px',
    fontFamily: 'monospace',
  } as const,
  roomCodeText: {
    color: '#66ccff',
    fontWeight: '600' as const,
    letterSpacing: '0.5px',
  } as const,
  roomCodeCopyBtn: {
    border: 'none',
    background: 'transparent',
    color: '#66ccff',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
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
  mixerContainer: {
    position: 'relative' as const,
  } as const,
  dropdownMenu: {
    position: 'absolute' as const,
    top: '56px',
    right: '0',
    minWidth: '250px',
    background: 'rgba(20, 20, 30, 0.98)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  } as const,
  dropdownHeader: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#7effa8',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  } as const,
  dropdownItem: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'block',
  } as const,
  dropdownItemSelected: {
    background: 'rgba(0, 255, 136, 0.15)',
    color: '#7effa8',
  } as const,
  dropdownItemDisabled: {
    opacity: 0.5,
  } as const,
  dropdownDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0',
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
  hiddenProcessingVideo: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    opacity: 0,
    pointerEvents: 'none' as const,
    zIndex: 1,
  } as const,
  video: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    backgroundColor: '#111',
    willChange: 'transform',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden',
    zIndex: 2,
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
  speechModeIndicator: {
    position: 'absolute' as const,
    top: '56px',
    right: '16px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #ff8800, #ffcc00)',
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
