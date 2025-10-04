/**
 * OverlayCanvas.tsx - Canvas overlay for drawing landmarks
 */

import { useEffect, useRef } from 'react';

interface OverlayCanvasProps {
  width: number;
  height: number;
  mirrored?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function OverlayCanvas({ width, height, mirrored = false, onCanvasReady }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        transform: mirrored ? 'scaleX(-1)' : 'none',
        borderRadius: '8px',
      }}
    />
  );
}
