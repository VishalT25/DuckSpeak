/**
 * useDynamicGestureRecognition.ts - Hook for dynamic gesture recognition
 * Records sequences of hand landmarks over time and classifies them using DTW
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { LandmarkDetector } from '../lib/landmarks';
import { toMultiHandFeatureVector } from '../lib/features';
import { createSequenceClassifier } from '../lib/sequenceClassifier';
import { loadSequenceModel } from '../lib/storage';

export interface UseDynamicGestureOptions {
  videoElement?: HTMLVideoElement | null;
  enabled?: boolean;
  onGestureDetected?: (label: string, confidence: number) => void;
  onError?: (error: string) => void;
  minConfidence?: number;
  recordingDuration?: number; // milliseconds
  autoRecordInterval?: number; // ms between auto-recordings (0 = manual)
}

export interface UseDynamicGestureReturn {
  isInitialized: boolean;
  isModelLoaded: boolean;
  isRecording: boolean;
  currentLabel: string | null;
  confidence: number;
  handsDetected: boolean;
  error: string | null;
  recordedFrames: number;
  startRecording: () => void;
  stopRecording: () => void;
  drawLandmarks: (canvas: HTMLCanvasElement) => void;
}

/**
 * Hook for dynamic gesture recognition
 * Continuously records sequences and classifies them
 */
export function useDynamicGestureRecognition(
  options: UseDynamicGestureOptions = {}
): UseDynamicGestureReturn {
  const {
    videoElement,
    enabled = false,
    onGestureDetected,
    onError,
    minConfidence = 0.6,
    recordingDuration = 2000, // 2 seconds default
    autoRecordInterval = 0, // manual by default
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [handsDetected, setHandsDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedFrames, setRecordedFrames] = useState(0);

  const detectorRef = useRef<LandmarkDetector>();
  const classifierRef = useRef<any>();
  const animationFrameRef = useRef<number>();
  const recordedSequenceRef = useRef<Float32Array[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const lastAutoRecordTimeRef = useRef<number>(0);
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
        console.log('[Dynamic Gesture] Initializing...');

        // Initialize detector for 2 hands
        const detector = new LandmarkDetector();
        await detector.initialize({ numHands: 2, minDetectionConfidence: 0.7 });
        detectorRef.current = detector;

        // Load sequence model
        const modelData = await loadSequenceModel();
        if (!modelData) {
          setError('No trained sequence model found. Train one in Collect & Train tab.');
          setIsInitialized(true);
          return;
        }

        const classifier = createSequenceClassifier('dtw');
        classifier.import(modelData);

        classifierRef.current = classifier;
        setIsModelLoaded(true);
        setIsInitialized(true);

        console.log('[Dynamic Gesture] Initialized successfully');
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
  }, []);

  // Start manual recording
  const startRecording = useCallback(() => {
    if (!isModelLoaded) {
      console.warn('[Dynamic Gesture] Model not loaded yet');
      return;
    }

    console.log('[Dynamic Gesture] Starting recording');
    recordedSequenceRef.current = [];
    recordingStartTimeRef.current = performance.now();
    setRecordedFrames(0);
    setIsRecording(true);
  }, [isModelLoaded]);

  // Stop recording and classify
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    console.log('[Dynamic Gesture] Stopping recording');
    setIsRecording(false);

    const sequence = recordedSequenceRef.current;

    if (sequence.length === 0) {
      console.warn('[Dynamic Gesture] No frames recorded');
      return;
    }

    // Classify the sequence
    const classifier = classifierRef.current;
    if (classifier) {
      try {
        const result = classifier.predict(sequence);

        if (result && result.confidence >= minConfidence) {
          console.log(
            `[Dynamic Gesture] Detected: ${result.label} (conf: ${result.confidence.toFixed(2)})`
          );
          setCurrentLabel(result.label);
          setConfidence(result.confidence);
          onGestureDetectedRef.current?.(result.label, result.confidence);
        } else {
          console.log('[Dynamic Gesture] Low confidence, ignoring');
          setCurrentLabel(null);
          setConfidence(0);
        }
      } catch (err) {
        console.error('[Dynamic Gesture] Classification error:', err);
      }
    }

    recordedSequenceRef.current = [];
    setRecordedFrames(0);
  }, [isRecording, minConfidence]);

  // Processing loop
  const processFrame = useCallback(() => {
    if (!enabled || !videoElement || !detectorRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Check if video is ready
    if (!videoElement.videoWidth || !videoElement.videoHeight || videoElement.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const detector = detectorRef.current;
    const now = performance.now();

    try {
      // Detect landmarks
      const landmarks = detector.detectLandmarks(videoElement, now);
      landmarksRef.current = landmarks;

      if (landmarks.length > 0) {
        setHandsDetected(true);

        // If recording, add frame to sequence
        if (isRecording) {
          const features = toMultiHandFeatureVector(landmarks, false);
          recordedSequenceRef.current.push(features);
          setRecordedFrames(recordedSequenceRef.current.length);

          // Auto-stop after duration
          const elapsed = now - recordingStartTimeRef.current;
          if (elapsed >= recordingDuration) {
            stopRecording();
          }
        }
        // Auto-record mode: start recording automatically at intervals
        else if (
          autoRecordInterval > 0 &&
          classifierRef.current &&
          now - lastAutoRecordTimeRef.current >= autoRecordInterval
        ) {
          lastAutoRecordTimeRef.current = now;
          startRecording();
        }
      } else {
        setHandsDetected(false);
        landmarksRef.current = [];
      }
    } catch (err) {
      console.error('[Dynamic Gesture] Detection error:', err);
      landmarksRef.current = [];
      setHandsDetected(false);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [enabled, videoElement, isRecording, recordingDuration, autoRecordInterval, startRecording, stopRecording]);

  // Start/stop processing loop
  useEffect(() => {
    if (enabled && isModelLoaded) {
      console.log('[Dynamic Gesture] Starting processing loop');
      processFrame();
    } else if (!enabled && animationFrameRef.current) {
      console.log('[Dynamic Gesture] Stopping processing loop');
      cancelAnimationFrame(animationFrameRef.current);
      setHandsDetected(false);
      setCurrentLabel(null);
      setConfidence(0);
      setIsRecording(false);
      recordedSequenceRef.current = [];
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
    isRecording,
    currentLabel,
    confidence,
    handsDetected,
    error,
    recordedFrames,
    startRecording,
    stopRecording,
    drawLandmarks,
  };
}
