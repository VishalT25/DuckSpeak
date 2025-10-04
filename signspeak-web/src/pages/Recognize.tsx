/**
 * Recognize.tsx - Real-time sign recognition page
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { CameraView } from '../components/CameraView';
import { OverlayCanvas } from '../components/OverlayCanvas';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { LandmarkDetector, startCamera, stopCamera } from '../lib/landmarks';
import { toMultiHandFeatureVector } from '../lib/features';
import { createClassifier } from '../lib/classifier';
import { createSmoothedClassifier } from '../lib/smoothing';
import { loadModel } from '../lib/storage';
import { toNaturalText } from '../lib/labels';
import { TextToSpeech } from '../lib/tts';
import { FingerspellingMode, formatFingerspelledWord } from '../lib/fingerspelling';

export function Recognize() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [handsDetected, setHandsDetected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fingerspellingEnabled, setFingerspellingEnabled] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  const [params, setParams] = useState({
    k: 5,
    windowSize: 15,
    minHoldFrames: 10, // Increased from 8 to reduce false positives
    minConfidence: 0.7, // Increased from 0.6 to require higher confidence
  });

  const detectorRef = useRef<LandmarkDetector>();
  const classifierRef = useRef<any>();
  const streamRef = useRef<MediaStream>();
  const videoRef = useRef<HTMLVideoElement>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const ttsRef = useRef<TextToSpeech>(new TextToSpeech());
  const fingerspellingRef = useRef<FingerspellingMode>();
  const animationFrameRef = useRef<number>();

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize detector for 2 hands
        const detector = new LandmarkDetector();
        await detector.initialize({ numHands: 2, minDetectionConfidence: 0.7 });
        detectorRef.current = detector;

        // Load model
        const modelData = await loadModel();
        if (!modelData) {
          setError('No trained model found. Please go to Collect & Train to create a model.');
          return;
        }

        const classifier = createClassifier(modelData.type as 'knn');
        classifier.import(modelData);

        // Check if model is compatible with 2-hand features (84 dimensions)
        const trainedFeatureDim = modelData.params.X?.[0]?.length || 0;
        if (trainedFeatureDim !== 84 && trainedFeatureDim !== 0) {
          setError(
            `Model incompatible: trained with ${trainedFeatureDim} features, but 2-hand mode requires 84 features. ` +
            `Please go to Collect & Train and retrain your model with 2-hand data.`
          );
          return;
        }

        const smoothed = createSmoothedClassifier(classifier, {
          windowSize: params.windowSize,
          minHoldFrames: params.minHoldFrames,
          minConfidence: params.minConfidence,
        });

        classifierRef.current = smoothed;

        // Initialize fingerspelling mode
        fingerspellingRef.current = new FingerspellingMode((word) => {
          const formatted = formatFingerspelledWord(word);
          setTranscript((prev) => [...prev, formatted]);
          ttsRef.current.speak(formatted);
        });

        setIsModelLoaded(true);
        setIsInitialized(true);
      } catch (err) {
        setError('Initialization failed: ' + (err as Error).message);
      }
    };

    init();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.close();
      }
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle video ready (camera already started by CameraView)
  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    // Start processing loop
    processFrame();
  }, []);

  // Handle stream ready
  const handleStreamReady = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
  }, []);

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  // Processing loop
  const processFrame = () => {
    if (!detectorRef.current || !videoRef.current || !classifierRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    const classifier = classifierRef.current;

    // Detect landmarks
    const timestamp = performance.now();
    const landmarks = detector.detectLandmarks(video, timestamp);

    if (landmarks.length > 0) {
      setHandsDetected(true);

      // Draw landmarks (mirrored to match video)
      detector.drawLandmarks(canvas, landmarks, true);

      // Extract features and predict (handles 1 or 2 hands)
      const features = toMultiHandFeatureVector(landmarks, false);
      const result = classifier.predict(features);

      if (result) {
        setCurrentLabel(result.label);
        setConfidence(result.confidence);

        // Handle fingerspelling mode
        if (fingerspellingEnabled && fingerspellingRef.current) {
          fingerspellingRef.current.processPrediction(result.label);
          setCurrentWord(fingerspellingRef.current.getCurrentWord());
        } else {
          // Add to transcript only on new label
          setTranscript((prev) => {
            if (prev.length === 0 || prev[prev.length - 1] !== result.label) {
              const text = toNaturalText(result.label);
              ttsRef.current.speak(text);
              return [...prev, result.label];
            }
            return prev;
          });
        }
      } else {
        setCurrentLabel(null);
        setConfidence(0);
      }
    } else {
      setHandsDetected(false);
      setCurrentLabel(null);
      setConfidence(0);

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Update parameters
  const handleUpdateParams = (newParams: typeof params) => {
    setParams(newParams);

    if (classifierRef.current) {
      classifierRef.current.updateParams({
        windowSize: newParams.windowSize,
        minHoldFrames: newParams.minHoldFrames,
        minConfidence: newParams.minConfidence,
      });
    }
  };

  // Speak transcript
  const handleSpeak = () => {
    const text = transcript.map(toNaturalText).join('. ');
    ttsRef.current.speak(text, true);
  };

  // Clear transcript
  const handleClear = () => {
    setTranscript([]);
    ttsRef.current.reset();
  };

  // Toggle fingerspelling
  const handleToggleFingerspelling = () => {
    const enabled = !fingerspellingEnabled;
    setFingerspellingEnabled(enabled);

    if (fingerspellingRef.current) {
      if (enabled) {
        fingerspellingRef.current.activate();
        setCurrentWord('');
      } else {
        fingerspellingRef.current.deactivate();
        setCurrentWord('');
      }
    }

    if (classifierRef.current) {
      classifierRef.current.reset();
    }
  };

  // Confirm fingerspelled word
  const handleConfirmWord = () => {
    if (fingerspellingRef.current) {
      fingerspellingRef.current.confirmWord();
      setCurrentWord('');
    }
  };

  if (!isInitialized) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h2>Initializing...</h2>
        {error && <p style={{ color: '#ff3333' }}>{error}</p>}
      </div>
    );
  }

  if (!isModelLoaded) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h2>No Model Found</h2>
        <p>{error}</p>
        <p>Please go to the <strong>Collect & Train</strong> tab to create a model first.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <h1 style={{ marginBottom: '20px', color: '#fff' }}>Sign Recognition</h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Video + Canvas */}
        <div style={{ position: 'relative' }}>
          <CameraView
            onVideoReady={handleVideoReady}
            onStreamReady={handleStreamReady}
            width={640}
            height={480}
          />
          <OverlayCanvas width={640} height={480} onCanvasReady={handleCanvasReady} />

          {!handsDetected && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 51, 51, 0.8)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              No hands detected (supports 1-2 hands)
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {/* Current prediction */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#fff' }}>Current Sign</h3>
            {currentLabel ? (
              <>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#00ff00',
                    marginBottom: '10px',
                  }}
                >
                  {toNaturalText(currentLabel)}
                </div>
                <ConfidenceBar confidence={confidence} label="Confidence" width={250} />
              </>
            ) : (
              <div style={{ fontSize: '18px', color: '#666' }}>Waiting...</div>
            )}

            {/* Fingerspelling mode */}
            {fingerspellingEnabled && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '14px', color: '#00ffff', marginBottom: '5px' }}>
                  Letter Mode Active
                </div>
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#222',
                    borderRadius: '4px',
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    color: '#fff',
                    minHeight: '50px',
                  }}
                >
                  {currentWord || '_'}
                </div>
                <button
                  onClick={handleConfirmWord}
                  disabled={!currentWord}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: currentWord ? '#00ff00' : '#555',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentWord ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                  }}
                >
                  Confirm Word
                </button>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#fff' }}>Transcript</h3>
            <div
              style={{
                minHeight: '100px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px',
                backgroundColor: '#222',
                borderRadius: '4px',
                fontSize: '16px',
                color: '#fff',
                lineHeight: '1.6',
              }}
            >
              {transcript.length > 0
                ? transcript.map(toNaturalText).join('. ') + '.'
                : 'No signs recognized yet...'}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSpeak}
              disabled={transcript.length === 0}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px',
                backgroundColor: '#00ff00',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: transcript.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              🔊 Speak
            </button>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px',
                backgroundColor: '#ff6600',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleToggleFingerspelling}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px',
                backgroundColor: fingerspellingEnabled ? '#00ffff' : '#555',
                color: fingerspellingEnabled ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {fingerspellingEnabled ? 'Exit Letters' : 'Letter Mode'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px',
                backgroundColor: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings drawer */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        params={params}
        onUpdate={handleUpdateParams}
      />
    </div>
  );
}
