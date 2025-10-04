/**
 * landmarks.ts - MediaPipe hand landmark detection
 */

import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type Landmark = { x: number; y: number; z: number };
export type HandLandmarks = Landmark[];

export interface LandmarkDetectorOptions {
  numHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

/**
 * Hand landmark detector using MediaPipe Tasks Vision
 */
export class LandmarkDetector {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized = false;

  async initialize(options: LandmarkDetectorOptions = {}): Promise<void> {
    if (this.isInitialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: options.numHands ?? 2, // Changed to 2 hands
        minHandDetectionConfidence: options.minDetectionConfidence ?? 0.7,
        minHandPresenceConfidence: options.minDetectionConfidence ?? 0.7,
        minTrackingConfidence: options.minTrackingConfidence ?? 0.7,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize hand landmarker:', error);
      throw new Error('MediaPipe initialization failed');
    }
  }

  /**
   * Detect hand landmarks in a video frame
   */
  detectLandmarks(video: HTMLVideoElement, timestamp: number): HandLandmarks[] {
    if (!this.handLandmarker || !this.isInitialized) {
      return [];
    }

    try {
      const result: HandLandmarkerResult = this.handLandmarker.detectForVideo(video, timestamp);

      if (!result.landmarks || result.landmarks.length === 0) {
        return [];
      }

      // Convert to our format
      return result.landmarks.map((hand) =>
        hand.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }))
      );
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }

  /**
   * Draw landmarks on canvas
   */
  drawLandmarks(
    canvas: HTMLCanvasElement,
    landmarks: HandLandmarks[],
    mirrored: boolean = true
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save context state
    ctx.save();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use canvas dimensions for drawing
    const drawWidth = canvas.width;
    const drawHeight = canvas.height;

    // If mirrored, flip the canvas horizontally
    if (mirrored) {
      ctx.translate(drawWidth, 0);
      ctx.scale(-1, 1);
    }

    // Draw each hand
    landmarks.forEach((hand) => {
      // Draw connections
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];

        ctx.beginPath();
        ctx.moveTo(startPoint.x * drawWidth, startPoint.y * drawHeight);
        ctx.lineTo(endPoint.x * drawWidth, endPoint.y * drawHeight);
        ctx.stroke();
      });

      // Draw landmarks
      hand.forEach((lm, i) => {
        const x = lm.x * drawWidth;
        const y = lm.y * drawHeight;

        // Different colors for different parts
        if (i === 0) {
          ctx.fillStyle = '#FF0000'; // Wrist - red
        } else if ([4, 8, 12, 16, 20].includes(i)) {
          ctx.fillStyle = '#00FFFF'; // Fingertips - cyan
        } else {
          ctx.fillStyle = '#00FF00'; // Other - green
        }

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Restore context state
    ctx.restore();
  }

  isReady(): boolean {
    return this.isInitialized && this.handLandmarker !== null;
  }

  close(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
      this.isInitialized = false;
    }
  }
}

/**
 * Hand landmark connections for drawing skeleton
 */
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17],
];

/**
 * Start webcam and return video element
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    return stream;
  } catch (error) {
    console.error('Failed to start camera:', error);
    throw new Error('Camera access denied or unavailable');
  }
}

/**
 * Stop camera stream
 */
export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
