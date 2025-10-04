/**
 * CameraView.tsx - Webcam video display component
 */

import { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  onStreamReady?: (stream: MediaStream) => void;
  width?: number;
  height?: number;
  mirrored?: boolean;
}

export function CameraView({ onVideoReady, onStreamReady, width = 640, height = 480, mirrored = true }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      if (!videoRef.current) return;

      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          // Component unmounted, stop stream
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Attach stream to video
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Notify stream is ready
        if (onStreamReady) {
          onStreamReady(stream);
        }

        // Wait for video to be ready
        const checkReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && mounted) {
            if (onVideoReady) {
              onVideoReady(videoRef.current);
            }
          } else if (mounted) {
            setTimeout(checkReady, 100);
          }
        };

        videoRef.current.onloadedmetadata = () => {
          checkReady();
        };

      } catch (err) {
        console.error('Camera access error:', err);
        setError('Camera access denied or unavailable');
      }
    };

    startCamera();

    // Cleanup
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady, onStreamReady]);

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        width={width}
        height={height}
        autoPlay
        playsInline
        muted
        style={{
          transform: mirrored ? 'scaleX(-1)' : 'none',
          borderRadius: '8px',
          backgroundColor: '#000',
        }}
      />
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 51, 51, 0.9)',
            color: '#fff',
            padding: '15px 20px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          <strong>Camera Error</strong>
          <br />
          {error}
        </div>
      )}
    </div>
  );
}
