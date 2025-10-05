import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import {
  ConnectionState,
  DisconnectReason,
  LocalParticipant,
  LocalTrackPublication,
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack,
  RemoteAudioTrack,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';

type Nullable<T> = T | null;

export interface CaptionMessage {
  type: 'caption';
  text: string;
  timestamp: number;
  sender: string;
}

export interface UseLiveKitOptions {
  onRemoteCaptionReceived?: (caption: CaptionMessage) => void;
}

export interface UseLiveKitReturn {
  isConnected: boolean;
  isConnecting: boolean;
  hasRemoteParticipant: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  error: string | null;
  localVideoRef: (element: HTMLVideoElement | null) => void;
  remoteVideoRef: (element: HTMLVideoElement | null) => void;
  toggleMute: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  leaveCall: () => Promise<void>;
  sendCaption: (text: string) => void;
  room: Room | undefined;
}

/**
 * Attach a video track to the provided HTML element, detaching previous attachments.
 */
function attachTrackToElement(
  track: Nullable<LocalVideoTrack | RemoteVideoTrack>,
  element: Nullable<HTMLVideoElement>,
) {
  if (!track || !element) {
    return;
  }

  track.detach();
  track.attach(element);
}

export function useLiveKit(options: UseLiveKitOptions = {}): UseLiveKitReturn {
  const room = useRoomContext();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const remoteVideoTrackRef = useRef<RemoteVideoTrack | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaEnabledRef = useRef(false);

  const detachRemoteTrack = useCallback(() => {
    if (remoteVideoTrackRef.current && remoteVideoElementRef.current) {
      remoteVideoTrackRef.current.detach(remoteVideoElementRef.current);
    }
    remoteVideoTrackRef.current = null;
  }, []);

  const updateRemoteParticipantCount = useCallback(
    (activeRoom: Room) => {
      setHasRemoteParticipant(activeRoom.remoteParticipants.size > 0);
    },
    [],
  );

  const handleDataMessage = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant | LocalParticipant | undefined) => {
      if (!options.onRemoteCaptionReceived || !room) {
        return;
      }

      // Ignore messages from local participant (self)
      if (participant && participant === room.localParticipant) {
        console.log('[LiveKit] Ignoring own data message');
        return;
      }

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text) as CaptionMessage | undefined;

        if (data?.type === 'caption' && typeof data.text === 'string') {
          const message: CaptionMessage = {
            sender: participant?.identity || 'unknown',
            timestamp: data.timestamp ?? Date.now(),
            type: 'caption',
            text: data.text,
          };
          options.onRemoteCaptionReceived(message);
        }
      } catch (err) {
        console.error('[LiveKit] Failed to parse data message', err);
      }
    },
    [options, room],
  );

  const attachLocalVideo = useCallback(() => {
    if (!room) {
      return;
    }

    const publications = Array.from(room.localParticipant.videoTrackPublications.values());
    const publication = publications.find((pub) => pub.kind === Track.Kind.Video);
    const videoTrack = publication?.videoTrack as LocalVideoTrack | null | undefined;

    if (videoTrack) {
      localVideoTrackRef.current = videoTrack;
      attachTrackToElement(videoTrack, localVideoElementRef.current);
      setIsVideoOff(!room.localParticipant.isCameraEnabled);
    }
  }, [room]);

  const localVideoRef = useCallback((element: HTMLVideoElement | null) => {
    localVideoElementRef.current = element;
    if (element && localVideoTrackRef.current) {
      attachTrackToElement(localVideoTrackRef.current, element);
    }
  }, []);

  const remoteVideoRef = useCallback((element: HTMLVideoElement | null) => {
    if (remoteVideoElementRef.current && remoteVideoTrackRef.current) {
      remoteVideoTrackRef.current.detach(remoteVideoElementRef.current);
    }

    remoteVideoElementRef.current = element;

    if (element && remoteVideoTrackRef.current) {
      attachTrackToElement(remoteVideoTrackRef.current, element);
    }
  }, []);

  const leaveCall = useCallback(async () => {
    if (!room) {
      return;
    }

    try {
      await room.disconnect(true);
    } finally {
      mediaEnabledRef.current = false;
      setIsConnected(false);
      setIsConnecting(false);
      setHasRemoteParticipant(false);
      setIsMuted(false);
      setIsVideoOff(false);
      setError(null);
      detachRemoteTrack();
    }
  }, [detachRemoteTrack, room]);

  const toggleMute = useCallback(async () => {
    if (!room) {
      return;
    }

    const nextMuted = !isMuted;

    try {
      const enabled = await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMuted(!enabled);
    } catch (err) {
      console.error('[LiveKit] Failed to toggle microphone', err);
      setError((err as Error).message);
    }
  }, [isMuted, room]);

  const toggleVideo = useCallback(async () => {
    if (!room) {
      return;
    }

    const nextVideoOff = !isVideoOff;

    try {
      const enabled = await room.localParticipant.setCameraEnabled(!nextVideoOff);
      setIsVideoOff(!enabled);
      if (enabled) {
        attachLocalVideo();
      } else {
        if (localVideoElementRef.current) {
          room.localParticipant.videoTrackPublications.forEach((pub) => {
            pub.videoTrack?.detach(localVideoElementRef.current!);
          });
        }
        localVideoTrackRef.current = null;
      }
    } catch (err) {
      console.error('[LiveKit] Failed to toggle camera', err);
      setError((err as Error).message);
    }
  }, [attachLocalVideo, isVideoOff, room]);

  const sendCaption = useCallback(
    (text: string) => {
      if (!room || !text.trim()) {
        return;
      }

      try {
        const payload: CaptionMessage = {
          type: 'caption',
          text,
          timestamp: Date.now(),
          sender: room.localParticipant.identity ?? 'local',
        };

        const encoder = new TextEncoder();
        room.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), {
          reliable: true,
        });
      } catch (err) {
        console.error('[LiveKit] Failed to send caption data', err);
        setError((err as Error).message);
      }
    },
    [room],
  );

  useEffect(() => {
    if (!room) {
      return;
    }

    const handleConnectionState = (state: ConnectionState) => {
      setIsConnecting(state === ConnectionState.Connecting || state === ConnectionState.Reconnecting);
      setIsConnected(state === ConnectionState.Connected);

      if (state === ConnectionState.Connected && !mediaEnabledRef.current) {
        mediaEnabledRef.current = true;
        room.localParticipant
          .enableCameraAndMicrophone()
          .then(async () => {
            attachLocalVideo();

            // Explicitly enable microphone
            console.log('[LiveKit] Enabling microphone...');
            const micEnabled = await room.localParticipant.setMicrophoneEnabled(true);
            console.log('[LiveKit] Microphone enabled:', micEnabled);
            console.log('[LiveKit] isMicrophoneEnabled:', room.localParticipant.isMicrophoneEnabled);

            // Log all audio track publications
            const audioTracks = Array.from(room.localParticipant.audioTrackPublications.values());
            console.log('[LiveKit] Audio track publications:', audioTracks.length, audioTracks);
            audioTracks.forEach((pub) => {
              console.log('[LiveKit] Audio track:', {
                kind: pub.kind,
                isMuted: pub.isMuted,
                source: pub.source,
                track: pub.track,
              });
            });

            setIsMuted(!room.localParticipant.isMicrophoneEnabled);
            setIsVideoOff(!room.localParticipant.isCameraEnabled);
          })
          .catch((err: Error) => {
            console.error('[LiveKit] Failed to enable media', err);
            setError(err.message);
          });
      }

      if (state === ConnectionState.Disconnected) {
        mediaEnabledRef.current = false;
        detachRemoteTrack();
      }
    };

    const handleParticipantConnected = () => updateRemoteParticipantCount(room);

    const handleParticipantDisconnected = () => {
      updateRemoteParticipantCount(room);
      if (room.remoteParticipants.size === 0) {
        detachRemoteTrack();
      }
    };

    const handleTrackSubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      _participant: RemoteParticipant,
    ) => {
      console.log('[LiveKit] Track subscribed:', track.kind, track);

      if (track.kind === Track.Kind.Video) {
        const videoTrack = track as RemoteVideoTrack;
        remoteVideoTrackRef.current = videoTrack;
        attachTrackToElement(videoTrack, remoteVideoElementRef.current);
        updateRemoteParticipantCount(room);
      } else if (track.kind === Track.Kind.Audio) {
        // Attach remote audio track to audio element
        const audioTrack = track as RemoteAudioTrack;

        // Create audio element if it doesn't exist
        if (!remoteAudioElementRef.current) {
          const audioElement = document.createElement('audio');
          audioElement.autoplay = true;
          remoteAudioElementRef.current = audioElement;
          console.log('[LiveKit] Created audio element for remote audio');
        }

        // Attach audio track
        audioTrack.attach(remoteAudioElementRef.current);
        console.log('[LiveKit] Remote audio track attached');
      }
    };

    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      _participant: RemoteParticipant,
    ) => {
      if (track.kind === Track.Kind.Video && remoteVideoTrackRef.current === track) {
        detachRemoteTrack();
      } else if (track.kind === Track.Kind.Audio && remoteAudioElementRef.current) {
        // Detach audio track
        const audioTrack = track as RemoteAudioTrack;
        audioTrack.detach(remoteAudioElementRef.current);
        console.log('[LiveKit] Remote audio track detached');
      }
    };

    const handleLocalTrackPublished = (publication: LocalTrackPublication) => {
      console.log('[LiveKit] Local track published:', publication.kind, publication);

      if (publication.kind === Track.Kind.Video && publication.videoTrack) {
        localVideoTrackRef.current = publication.videoTrack;
        attachTrackToElement(publication.videoTrack, localVideoElementRef.current);
      } else if (publication.kind === Track.Kind.Audio) {
        console.log('[LiveKit] Local audio track published successfully');
      }
    };

    const handleDisconnected = (_reason?: DisconnectReason) => {
      setIsConnected(false);
      setIsConnecting(false);
      mediaEnabledRef.current = false;
      detachRemoteTrack();
    };

    room
      .on(RoomEvent.ConnectionStateChanged, handleConnectionState)
      .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      .on(RoomEvent.DataReceived, handleDataMessage)
      .on(RoomEvent.Disconnected, handleDisconnected);

    // Initialise derived state for already-connected room context.
    handleConnectionState(room.state);
    updateRemoteParticipantCount(room);

    // Attach any already-available local track
    attachLocalVideo();

    // Attach first available remote video track if present
    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.videoTrackPublications.values()) {
        if (publication.kind === Track.Kind.Video && publication.videoTrack) {
          const track = publication.videoTrack as RemoteVideoTrack;
          remoteVideoTrackRef.current = track;
          attachTrackToElement(track, remoteVideoElementRef.current);
          break;
        }
      }

      // Also attach remote audio tracks
      for (const publication of participant.audioTrackPublications.values()) {
        if (publication.kind === Track.Kind.Audio && publication.audioTrack) {
          const audioTrack = publication.audioTrack as RemoteAudioTrack;

          // Create audio element if needed
          if (!remoteAudioElementRef.current) {
            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            remoteAudioElementRef.current = audioElement;
            console.log('[LiveKit] Created audio element for existing remote audio');
          }

          audioTrack.attach(remoteAudioElementRef.current);
          console.log('[LiveKit] Existing remote audio track attached');
        }
      }
    }

    return () => {
      room
        .off(RoomEvent.ConnectionStateChanged, handleConnectionState)
        .off(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
        .off(RoomEvent.DataReceived, handleDataMessage)
        .off(RoomEvent.Disconnected, handleDisconnected);

      detachRemoteTrack();
      if (localVideoTrackRef.current && localVideoElementRef.current) {
        localVideoTrackRef.current.detach(localVideoElementRef.current);
      }

      // Cleanup audio element
      if (remoteAudioElementRef.current) {
        remoteAudioElementRef.current.remove();
        remoteAudioElementRef.current = null;
      }
    };
  }, [
    attachLocalVideo,
    detachRemoteTrack,
    handleDataMessage,
    room,
    updateRemoteParticipantCount,
  ]);

  return useMemo(
    () => ({
      isConnected,
      isConnecting,
      hasRemoteParticipant,
      isMuted,
      isVideoOff,
      error,
      localVideoRef,
      remoteVideoRef,
      toggleMute,
      toggleVideo,
      leaveCall,
      sendCaption,
      room,
    }),
    [
      error,
      hasRemoteParticipant,
      isConnected,
      isConnecting,
      isMuted,
      isVideoOff,
      leaveCall,
      localVideoRef,
      remoteVideoRef,
      sendCaption,
      toggleMute,
      toggleVideo,
      room,
    ],
  );
}
