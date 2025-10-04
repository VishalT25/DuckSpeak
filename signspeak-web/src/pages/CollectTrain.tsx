/**
 * CollectTrain.tsx - Data collection and model training page
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { CameraView } from '../components/CameraView';
import { OverlayCanvas } from '../components/OverlayCanvas';
import { CapturePanel } from '../components/CapturePanel';
import { LandmarkDetector, stopCamera } from '../lib/landmarks';
import { toMultiHandFeatureVector } from '../lib/features';
import { createClassifier } from '../lib/classifier';
import {
  saveSamples,
  getAllSamples,
  getSampleCounts,
  exportAllJSON,
  importAllJSON,
  clearDataset,
  clearModel,
  saveModel,
  getStorageStats,
} from '../lib/storage';
import {
  loadDatasetFromFile,
  generateSampleDataset,
  getKaggleDatasetInstructions,
} from '../lib/datasetLoader';

// Recommended starter signs
const QUICK_START_SIGNS = ['hello', 'yes', 'no', 'thank_you', 'please', 'help', 'stop', 'sorry', 'water', 'food'];

export function CollectTrain() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [targetCount] = useState(100);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState('');
  const [stats, setStats] = useState({ sampleCount: 0, labelCount: 0, hasModel: false, datasetSize: 0 });
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [quickStartMode, setQuickStartMode] = useState(false);
  const [quickStartIndex, setQuickStartIndex] = useState(0);

  const detectorRef = useRef<LandmarkDetector>();
  const streamRef = useRef<MediaStream>();
  const videoRef = useRef<HTMLVideoElement>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const animationFrameRef = useRef<number>();
  const capturedFeaturesRef = useRef<Float32Array[]>([]);
  const isCapturingRef = useRef<boolean>(false);
  const currentLabelRef = useRef<string>('');

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const detector = new LandmarkDetector();
        await detector.initialize({ numHands: 2, minDetectionConfidence: 0.7 });
        detectorRef.current = detector;

        // Load sample counts
        const counts = await getSampleCounts();
        setSampleCounts(counts);

        // Load stats
        const storageStats = await getStorageStats();
        setStats(storageStats);

        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization failed:', err);
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
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    // Detect landmarks
    const timestamp = performance.now();
    const landmarks = detector.detectLandmarks(video, timestamp);

    if (landmarks.length > 0) {
      // Draw landmarks (mirrored to match video)
      detector.drawLandmarks(canvas, landmarks, true);

      // Capture if active (use ref to get latest state)
      if (isCapturingRef.current && capturedFeaturesRef.current.length < targetCount) {
        // Use multi-hand feature extraction (handles 1 or 2 hands)
        const features = toMultiHandFeatureVector(landmarks, false);
        capturedFeaturesRef.current.push(features);
        setCapturedCount(capturedFeaturesRef.current.length);

        // Log every 10 samples
        if (capturedFeaturesRef.current.length % 10 === 0) {
          console.log('Captured', capturedFeaturesRef.current.length, 'samples');
        }

        // Auto-stop when target reached
        if (capturedFeaturesRef.current.length >= targetCount) {
          if (quickStartMode) {
            handleStopCaptureEnhanced();
          } else {
            handleStopCapture();
          }
        }
      }
    } else {
      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Start capture
  const handleStartCapture = () => {
    if (!currentLabel) return;

    capturedFeaturesRef.current = [];
    setCapturedCount(0);
    setIsCapturing(true);
    isCapturingRef.current = true;
    currentLabelRef.current = currentLabel;

    console.log('Started capturing for label:', currentLabel);
  };

  // Stop capture
  const handleStopCapture = async () => {
    setIsCapturing(false);
    isCapturingRef.current = false;

    console.log('Stopped capturing. Captured count:', capturedFeaturesRef.current.length);

    if (capturedFeaturesRef.current.length > 0) {
      try {
        await saveSamples(currentLabelRef.current, capturedFeaturesRef.current);

        // Update counts
        const counts = await getSampleCounts();
        setSampleCounts(counts);

        const storageStats = await getStorageStats();
        setStats(storageStats);

        alert(`Saved ${capturedFeaturesRef.current.length} samples for "${currentLabel}"`);
      } catch (err) {
        alert('Failed to save samples: ' + (err as Error).message);
      }
    }

    capturedFeaturesRef.current = [];
    setCapturedCount(0);
  };

  // Train model
  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingStatus('Loading dataset...');

    try {
      const { X, y } = await getAllSamples();

      if (X.length === 0) {
        alert('No training data available. Please collect samples first.');
        setIsTraining(false);
        return;
      }

      setTrainingStatus(`Training on ${X.length} samples...`);

      // Train classifier (use setTimeout to allow UI update)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const classifier = createClassifier('knn', { k: 5 });
      classifier.fit(X, y);

      setTrainingStatus('Saving model...');

      const modelData = classifier.export();
      await saveModel(modelData);

      const storageStats = await getStorageStats();
      setStats(storageStats);

      setTrainingStatus('');
      setIsTraining(false);

      alert(`Model trained successfully!\n${X.length} samples, ${classifier.getClasses().length} classes`);
    } catch (err) {
      setIsTraining(false);
      setTrainingStatus('');
      alert('Training failed: ' + (err as Error).message);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const json = await exportAllJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `signspeak-data-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err as Error).message);
    }
  };

  // Import data
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importAllJSON(text);

        const counts = await getSampleCounts();
        setSampleCounts(counts);

        const storageStats = await getStorageStats();
        setStats(storageStats);

        alert('Data imported successfully!');
      } catch (err) {
        alert('Import failed: ' + (err as Error).message);
      }
    };

    input.click();
  };

  // Clear all data
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL data and the trained model?')) {
      return;
    }

    try {
      await clearDataset();
      await clearModel();

      setSampleCounts({});
      setStats({ sampleCount: 0, labelCount: 0, hasModel: false, datasetSize: 0 });

      alert('All data cleared.');
    } catch (err) {
      alert('Clear failed: ' + (err as Error).message);
    }
  };

  // Import external dataset
  const handleImportDataset = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsTraining(true);
        setTrainingStatus(`Loading dataset from ${file.name}...`);

        const { X, y } = await loadDatasetFromFile(file);

        if (X.length === 0) {
          alert('No valid data found in file');
          setIsTraining(false);
          setTrainingStatus('');
          return;
        }

        setTrainingStatus(`Saving ${X.length} samples...`);

        // Save to storage
        const uniqueLabels = [...new Set(y)];
        for (const label of uniqueLabels) {
          const labelIndices = y.map((l, i) => (l === label ? i : -1)).filter((i) => i !== -1);
          const labelFeatures = labelIndices.map((i) => X[i]);
          await saveSamples(label, labelFeatures);
        }

        // Update UI
        const counts = await getSampleCounts();
        setSampleCounts(counts);

        const storageStats = await getStorageStats();
        setStats(storageStats);

        setTrainingStatus('');
        setIsTraining(false);

        alert(`Imported ${X.length} samples for ${uniqueLabels.length} signs!\n\nNow click "Train Model" to train.`);
      } catch (err) {
        setIsTraining(false);
        setTrainingStatus('');
        alert('Import failed: ' + (err as Error).message);
      }
    };

    input.click();
  };

  // Generate sample dataset
  const handleGenerateSample = async () => {
    const labelsInput = prompt(
      'Enter sign labels separated by commas:\n(Example: hello,yes,no,thanks,help)',
      'hello,yes,no,thanks,help,stop,please,sorry,good,bad'
    );

    if (!labelsInput) return;

    const labels = labelsInput.split(',').map((l) => l.trim()).filter((l) => l);

    if (labels.length === 0) {
      alert('No labels entered');
      return;
    }

    const samplesInput = prompt('How many samples per sign?', '60');
    const samplesPerLabel = parseInt(samplesInput || '60');

    if (isNaN(samplesPerLabel) || samplesPerLabel < 10) {
      alert('Invalid sample count (minimum 10)');
      return;
    }

    try {
      setIsTraining(true);
      setTrainingStatus('Generating synthetic dataset...');

      const { X, y } = generateSampleDataset(labels, samplesPerLabel);

      setTrainingStatus(`Saving ${X.length} samples...`);

      // Save to storage
      for (const label of labels) {
        const labelIndices = y.map((l, i) => (l === label ? i : -1)).filter((i) => i !== -1);
        const labelFeatures = labelIndices.map((i) => X[i]);
        await saveSamples(label, labelFeatures);
      }

      // Update UI
      const counts = await getSampleCounts();
      setSampleCounts(counts);

      const storageStats = await getStorageStats();
      setStats(storageStats);

      setTrainingStatus('');
      setIsTraining(false);

      alert(
        `Generated ${X.length} synthetic samples for ${labels.length} signs!\n\n` +
        `⚠️ IMPORTANT: Synthetic data creates 5 basic hand shapes:\n` +
        `- Shape 0: Open hand (flat palm)\n` +
        `- Shape 1: Fist (closed)\n` +
        `- Shape 2: Pointing (index finger out)\n` +
        `- Shape 3: OK sign (circle with thumb/index)\n` +
        `- Shape 4: Thumbs up\n\n` +
        `To test recognition, make these hand shapes for the corresponding signs.\n\n` +
        `For REAL sign recognition, you MUST collect actual hand data or import a real dataset.\n\n` +
        `Click "Train Model" to continue.`
      );
    } catch (err) {
      setIsTraining(false);
      setTrainingStatus('');
      alert('Generation failed: ' + (err as Error).message);
    }
  };

  // Show Kaggle instructions
  const handleShowKaggleInstructions = () => {
    const instructions = getKaggleDatasetInstructions();
    alert(instructions);
  };

  // Start quick-start collection
  const handleQuickStart = () => {
    setQuickStartMode(true);
    setQuickStartIndex(0);
    setCurrentLabel(QUICK_START_SIGNS[0]);
    setShowTutorial(true);
    setTutorialStep(0);
  };

  // Move to next quick-start sign
  const handleNextQuickStartSign = () => {
    const nextIndex = quickStartIndex + 1;
    if (nextIndex < QUICK_START_SIGNS.length) {
      setQuickStartIndex(nextIndex);
      setCurrentLabel(QUICK_START_SIGNS[nextIndex]);
    } else {
      setQuickStartMode(false);
      alert(`Quick Start Complete! 🎉\n\nYou've collected all ${QUICK_START_SIGNS.length} signs.\n\nNow click "Train Model" to train your recognition system.`);
    }
  };

  // Enhanced stop capture for quick-start mode
  const handleStopCaptureEnhanced = async () => {
    await handleStopCapture();
    if (quickStartMode && capturedFeaturesRef.current.length >= targetCount) {
      setTimeout(() => {
        handleNextQuickStartSign();
      }, 500);
    }
  };

  if (!isInitialized) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h2>Initializing...</h2>
      </div>
    );
  }

  // Calculate progress for visual feedback
  const captureProgress = Math.min((capturedCount / targetCount) * 100, 100);
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#fff' }}>Collect & Train</h1>
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📖 Show Tutorial
        </button>
      </div>

      {/* Quick Start Banner */}
      {stats.sampleCount === 0 && !quickStartMode && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'rgba(0, 102, 255, 0.2)',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #0066ff',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>🚀 First time? Try Quick Start!</h3>
          <p style={{ margin: '0 0 15px 0', color: '#aaa' }}>
            Automatically collect 10 common ASL signs with guided steps. Takes ~15-20 minutes.
          </p>
          <button
            onClick={handleQuickStart}
            style={{
              padding: '12px 24px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            Start Quick Collection →
          </button>
        </div>
      )}

      {/* Quick Start Progress */}
      {quickStartMode && (
        <div
          style={{
            padding: '15px',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #00ff00',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#00ff00' }}>Quick Start Mode</strong>
              <div style={{ color: '#aaa', fontSize: '14px', marginTop: '5px' }}>
                Sign {quickStartIndex + 1} of {QUICK_START_SIGNS.length}: <strong style={{ color: '#fff' }}>{currentLabel}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {QUICK_START_SIGNS.map((sign, idx) => (
                <div
                  key={sign}
                  style={{
                    width: '30px',
                    height: '8px',
                    backgroundColor: idx < quickStartIndex ? '#00ff00' : idx === quickStartIndex ? '#ffff00' : '#333',
                    borderRadius: '4px',
                  }}
                  title={sign}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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

          {/* Capture indicator with progress ring */}
          {isCapturing && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 0, 0, 0.8)',
                  color: '#fff',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                ⏺ CAPTURING
              </div>

              {/* Progress ring */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(#00ff00 ${captureProgress}%, transparent ${captureProgress}%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff00' }}>
                    {Math.round(captureProgress)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    {capturedCount}/{targetCount}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tutorial overlay */}
          {showTutorial && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  maxWidth: '500px',
                  padding: '30px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  border: '2px solid #00ff00',
                }}
              >
                {tutorialStep === 0 && (
                  <>
                    <h2 style={{ margin: '0 0 15px 0', color: '#00ff00' }}>Welcome to Real Data Collection!</h2>
                    <p style={{ color: '#aaa', marginBottom: '15px' }}>
                      This tutorial will guide you through collecting real ASL sign data for accurate recognition.
                    </p>
                    <ul style={{ color: '#aaa', marginBottom: '20px', lineHeight: '1.8' }}>
                      <li>Select a sign label</li>
                      <li>Click "Start Capture"</li>
                      <li>Hold the sign STEADY for ~10 seconds</li>
                      <li>System captures 100 samples automatically</li>
                      <li>Repeat for all signs you want</li>
                    </ul>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setTutorialStep(1)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#00ff00',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        Next →
                      </button>
                      <button
                        onClick={() => setShowTutorial(false)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#555',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Skip
                      </button>
                    </div>
                  </>
                )}

                {tutorialStep === 1 && (
                  <>
                    <h2 style={{ margin: '0 0 15px 0', color: '#00ff00' }}>Important: Hold Signs STEADY!</h2>
                    <div style={{ color: '#aaa', marginBottom: '20px', lineHeight: '1.8' }}>
                      <p style={{ color: '#00ff00', fontWeight: 'bold' }}>✅ DO:</p>
                      <ul style={{ marginBottom: '15px' }}>
                        <li>Position hand in the sign shape</li>
                        <li>Hold it STILL in one position</li>
                        <li>Keep hand in camera view</li>
                        <li>Let it auto-capture for ~10 seconds</li>
                      </ul>
                      <p style={{ color: '#ff3333', fontWeight: 'bold' }}>❌ DON'T:</p>
                      <ul>
                        <li>Make the full motion/movement</li>
                        <li>Move hand around too much</li>
                        <li>Block hand with objects</li>
                      </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setTutorialStep(0)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#555',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setTutorialStep(2)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#00ff00',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </>
                )}

                {tutorialStep === 2 && (
                  <>
                    <h2 style={{ margin: '0 0 15px 0', color: '#00ff00' }}>Ready to Start!</h2>
                    <p style={{ color: '#aaa', marginBottom: '20px' }}>
                      Choose your approach:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      <button
                        onClick={() => {
                          setShowTutorial(false);
                          handleQuickStart();
                        }}
                        style={{
                          padding: '15px',
                          backgroundColor: '#00ff00',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          textAlign: 'left',
                        }}
                      >
                        🚀 Quick Start (10 common signs)
                        <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '5px' }}>
                          Guided collection of hello, yes, no, thank_you, please, etc.
                        </div>
                      </button>
                      <button
                        onClick={() => setShowTutorial(false)}
                        style={{
                          padding: '15px',
                          backgroundColor: '#0066ff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          textAlign: 'left',
                        }}
                      >
                        ✏️ Manual Collection (custom signs)
                        <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '5px' }}>
                          Choose your own signs to collect
                        </div>
                      </button>
                    </div>
                    <button
                      onClick={() => setTutorialStep(1)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#555',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      ← Back
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Control panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {/* Capture controls */}
          <CapturePanel
            isCapturing={isCapturing}
            currentLabel={currentLabel}
            capturedCount={capturedCount}
            targetCount={targetCount}
            onLabelChange={setCurrentLabel}
            onStartCapture={handleStartCapture}
            onStopCapture={handleStopCapture}
          />

          {/* Dataset stats */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#fff' }}>Dataset</h3>
            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>
              Total samples: <strong style={{ color: '#00ff00' }}>{stats.sampleCount}</strong>
              <br />
              Labels: <strong style={{ color: '#00ff00' }}>{stats.labelCount}</strong>
              <br />
              Model: <strong style={{ color: stats.hasModel ? '#00ff00' : '#ff3333' }}>
                {stats.hasModel ? 'Trained' : 'Not trained'}
              </strong>
            </div>

            {/* Quick Start progress tracker */}
            {quickStartMode && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#222', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
                  Collection Progress:
                </div>
                {QUICK_START_SIGNS.map((sign, idx) => {
                  const count = sampleCounts[sign] || 0;
                  const isComplete = count >= 50;
                  const isCurrent = idx === quickStartIndex;
                  return (
                    <div
                      key={sign}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        fontSize: '11px',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: isComplete ? '#00ff00' : isCurrent ? '#ffff00' : '#333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                        }}
                      >
                        {isComplete && '✓'}
                      </div>
                      <div style={{ flex: 1, color: isCurrent ? '#fff' : '#888' }}>
                        {sign}
                      </div>
                      <div style={{ color: isComplete ? '#00ff00' : '#555' }}>
                        {count}/100
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(sampleCounts).length > 0 && !quickStartMode && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px', color: '#888' }}>
                {Object.entries(sampleCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([label, count]) => (
                    <div key={label} style={{ padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{label}:</span>
                      <span style={{ color: count >= 50 ? '#00ff00' : '#ffff00' }}>
                        {count} samples {count >= 50 && '✓'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Train button */}
          <button
            onClick={handleTrain}
            disabled={isTraining || stats.sampleCount === 0}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: isTraining ? '#666' : '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: stats.sampleCount > 0 && !isTraining ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '18px',
              marginBottom: '20px',
            }}
          >
            {isTraining ? trainingStatus : 'Train Model'}
          </button>

          {/* Data management */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#fff', marginBottom: '10px', fontSize: '14px' }}>Data Management</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleExport}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Export
              </button>
              <button
                onClick={handleImport}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Import
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ff3333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Clear All
              </button>
            </div>

            <h4 style={{ color: '#00ff00', marginTop: '15px', marginBottom: '10px', fontSize: '14px' }}>
              🚀 Auto-Load Dataset
            </h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleImportDataset}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#0066ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                📁 Import Dataset<br/>
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>(CSV/JSON)</span>
              </button>
              <button
                onClick={handleGenerateSample}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#9900ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                ✨ Generate Sample<br/>
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>(Synthetic)</span>
              </button>
            </div>
            <button
              onClick={handleShowKaggleInstructions}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                color: '#aaa',
                border: '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              ℹ️ How to use Kaggle ASL datasets
            </button>
          </div>

          {/* Tips */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#222',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#888',
            }}
          >
            <strong style={{ color: '#fff' }}>Recommended Dataset:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>60-100 samples per sign</li>
              <li>10-20 different signs</li>
              <li>Total: 600-2000 samples</li>
              <li>Training takes &lt;1 second</li>
            </ul>
            <strong style={{ color: '#00ffff', marginTop: '10px', display: 'block' }}>
              2-Hand Mode Active:
            </strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#aaa' }}>
              <li>1-hand signs: Show one hand only</li>
              <li>2-hand signs: Show both hands</li>
              <li>System handles 1 or 2 hands automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
