/**
 * useASLRecognition.ts - Hook for real-time ASL recognition using MediaPipe + KNN
 * Integrates hand tracking and gesture classification for video calls
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { LandmarkDetector } from '../lib/landmarks';
import { toMultiHandFeatureVector } from '../lib/features';
import { createClassifier } from '../lib/classifier';
import { createSmoothedClassifier } from '../lib/smoothing';
import { loadModel } from '../lib/storage';

export interface UseASLRecognitionOptions {
  videoElement?: HTMLVideoElement | null;
  enabled?: boolean;
  onGestureDetected?: (label: string, confidence: number) => void;
  onError?: (error: string) => void;
  minConfidence?: number;
  windowSize?: number;
  minHoldFrames?: number;
}

export interface UseASLRecognitionReturn {
  isInitialized: boolean;
  isModelLoaded: boolean;
  currentLabel: string | null;
  confidence: number;
  handsDetected: boolean;
  error: string | null;
  drawLandmarks: (canvas: HTMLCanvasElement) => void;
}

/**
 * Hook for real-time ASL recognition
 */
export function useASLRecognition(options: UseASLRecognitionOptions = {}): UseASLRecognitionReturn {
  const {
    videoElement,
    enabled = false,
    onGestureDetected,
    onError,
    minConfidence = 0.7,
    windowSize = 15,
    minHoldFrames = 10,
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [handsDetected, setHandsDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectorRef = useRef<LandmarkDetector>();
  const classifierRef = useRef<any>();
  const animationFrameRef = useRef<number>();
  const lastDetectedLabelRef = useRef<string | null>(null);
  const landmarksRef = useRef<any[]>([]);
  const onGestureDetectedRef = useRef(onGestureDetected);
  const onErrorRef = useRef(onError);

  // Keep callback refs up to date
  useEffect(() => {
    onGestureDetectedRef.current = onGestureDetected;
    onErrorRef.current = onError;
  }, [onGestureDetected, onError]);

  // Initialize detector and model
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[ASL Recognition] Initializing...');

        // Initialize detector for 2 hands
        const detector = new LandmarkDetector();
        await detector.initialize({ numHands: 2, minDetectionConfidence: 0.7 });
        detectorRef.current = detector;

        // Load model
        const modelData = await loadModel();
        if (!modelData) {
          setError('No trained model found. Please train a model in the Collect & Train tab.');
          setIsInitialized(true);
          return;
        }

        const classifier = createClassifier(modelData.type as 'knn');
        classifier.import(modelData);

        // Check if model is compatible with 2-hand features (84 dimensions)
        let trainedFeatureDim = 0;
        if (modelData.type === 'knn') {
          const knnParams = modelData.params as { X?: number[][] };
          if (Array.isArray(knnParams.X) && knnParams.X.length > 0) {
            const firstSample = knnParams.X[0];
            if (Array.isArray(firstSample)) {
              trainedFeatureDim = firstSample.length;
            }
          }
        }

        if (trainedFeatureDim !== 84 && trainedFeatureDim !== 0) {
          setError(
            `Model incompatible: requires 84 features but trained with ${trainedFeatureDim}. ` +
            `Please retrain your model with 2-hand data.`
          );
          setIsInitialized(true);
          return;
        }

        const smoothed = createSmoothedClassifier(classifier, {
          windowSize,
          minHoldFrames,
          minConfidence,
        });

        classifierRef.current = smoothed;
        setIsModelLoaded(true);
        setIsInitialized(true);

        console.log('[ASL Recognition] Initialized successfully');
      } catch (err) {
        const errMsg = 'Initialization failed: ' + (err as Error).message;
        setError(errMsg);
        onErrorRef.current?.(errMsg);
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [minConfidence, windowSize, minHoldFrames]);

  // Processing loop
  const processFrame = useCallback(() => {
    if (!enabled || !videoElement || !detectorRef.current || !classifierRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Check if video is ready (has valid dimensions and is playing)
    if (!videoElement.videoWidth || !videoElement.videoHeight || videoElement.readyState < 2) {
      // Video not ready yet, skip this frame
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const detector = detectorRef.current;
    const classifier = classifierRef.current;

    try {
      // Detect landmarks
      const timestamp = performance.now();
      const landmarks = detector.detectLandmarks(videoElement, timestamp);
      landmarksRef.current = landmarks;

      if (landmarks.length > 0) {
        setHandsDetected(true);

        // Extract features and predict (handles 1 or 2 hands)
        const features = toMultiHandFeatureVector(landmarks, false);
        const result = classifier.predict(features);

        if (result) {
          setCurrentLabel(result.label);
          setConfidence(result.confidence);

          // Trigger callback only on new label
          if (result.label !== lastDetectedLabelRef.current) {
            lastDetectedLabelRef.current = result.label;
            onGestureDetectedRef.current?.(result.label, result.confidence);
          }
        } else {
          setCurrentLabel(null);
          setConfidence(0);
        }
      } else {
        setHandsDetected(false);
        setCurrentLabel(null);
        setConfidence(0);
        landmarksRef.current = [];
      }
    } catch (err) {
      console.error('[ASL Recognition] Detection error:', err);
      // Don't set error state, just skip this frame
      landmarksRef.current = [];
      setHandsDetected(false);
      setCurrentLabel(null);
      setConfidence(0);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [enabled, videoElement]);

  // Start/stop processing loop
  useEffect(() => {
    if (enabled && isModelLoaded) {
      console.log('[ASL Recognition] Starting processing loop');
      processFrame();
    } else if (!enabled && animationFrameRef.current) {
      console.log('[ASL Recognition] Stopping processing loop');
      cancelAnimationFrame(animationFrameRef.current);
      setHandsDetected(false);
      setCurrentLabel(null);
      setConfidence(0);
      lastDetectedLabelRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isModelLoaded, processFrame]);

  /**
   * Draw landmarks on canvas
   */
  const drawLandmarks = useCallback((canvas: HTMLCanvasElement) => {
    if (!detectorRef.current || !landmarksRef.current.length) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    detectorRef.current.drawLandmarks(canvas, landmarksRef.current, true);
  }, []);

  return {
    isInitialized,
    isModelLoaded,
    currentLabel,
    confidence,
    handsDetected,
    error,
    drawLandmarks,
  };
}
