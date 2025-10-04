# SignSpeak Web — Real-Time ASL Recognition

A browser-only MVP for real-time American Sign Language recognition using MediaPipe Hands, React, TypeScript, and lightweight ML (KNN/Logistic Regression). No backend required — everything runs on-device in your browser.

## Features

- **Real-time hand tracking** with MediaPipe Hands (~20-30 FPS)
- **Lightweight classification** using KNN (5-NN) or Logistic Regression
- **Temporal smoothing** for stable predictions (majority voting + min hold frames)
- **On-device training** in-browser (<1 second for ~2000 samples)
- **Persistent storage** using IndexedDB (idb-keyval)
- **Text-to-speech** via Web Speech API
- **Fingerspelling mode** for A-Z letter recognition and word building
- **Data import/export** for sharing datasets and models
- **Two-tab interface**:
  - **Recognize** — Live sign recognition with transcript and TTS
  - **Collect & Train** — Data capture and model training

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Hand Tracking**: @mediapipe/tasks-vision
- **ML**: Custom KNN & Logistic Regression (pure TypeScript)
- **State**: Zustand
- **Storage**: idb-keyval (IndexedDB)
- **TTS**: Web Speech API

## Quick Start

### Installation

```bash
# Clone or create the project
cd signspeak-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`.

### First-Time Setup

1. **Go to "Collect & Train" tab**
2. **Collect data** for 10-20 signs:
   - Select a sign label (e.g., "hello", "yes", "no")
   - Click "Start Capture"
   - Perform the sign with your hand in view
   - Wait for 100 samples to be captured
   - Repeat for other signs
3. **Train the model**:
   - Click "Train Model" button
   - Training takes <1 second
4. **Go to "Recognize" tab**:
   - Perform signs in front of camera
   - See predictions in real-time
   - Use "Speak" to hear the transcript

### Recommended Dataset

- **60-100 samples per sign** (minimum)
- **10-20 different signs** for a good demo
- **Total: 600-2000 samples**
- Training time: <1 second

### Suggested Signs for Quick Demo

Start with these common ASL signs:

- **Greetings**: hello, goodbye
- **Basic**: yes, no, please, thank_you
- **Help**: help, stop, where, bathroom
- **Emotions**: good, bad, sorry
- **Special**: ily (I love you)

## Usage Guide

### Recognize Tab

**Main Features**:
- Live camera feed with hand landmark overlay
- Current sign prediction with confidence bar
- Transcript of recognized signs
- TTS controls to speak the transcript

**Controls**:
- **🔊 Speak** — Speak the current transcript using TTS
- **Clear** — Clear the transcript
- **Letter Mode** — Enable fingerspelling mode for A-Z recognition
- **⚙️ Settings** — Tune recognition parameters

**Fingerspelling Mode**:
1. Click "Letter Mode" to activate
2. Perform static letter signs (A, B, C, D, E, I, L, O, Y supported by default)
3. Letters accumulate in the word buffer
4. Click "Confirm Word" to add to transcript and speak

**Settings Panel**:
- **k (KNN neighbors)**: 1-15 (default: 5)
  - Lower = more sensitive, higher = more stable
- **Window Size**: 5-30 frames (default: 15)
  - Smoothing window for majority voting
- **Min Hold Frames**: 1-20 (default: 8)
  - Consecutive frames required for stable prediction
- **Min Confidence**: 0-100% (default: 60%)
  - Minimum confidence threshold

### Collect & Train Tab

**Workflow**:
1. **Select sign label** from preset list or enter custom
2. **Start Capture** — Perform sign in camera view
3. **Wait for 100 samples** (auto-stops)
4. **Repeat** for all signs you want to recognize
5. **Train Model** — Fast training in browser
6. **Export/Import** — Save/load your dataset and model

**Data Management**:
- **Export** — Download dataset + model as JSON
- **Import** — Load previously exported data
- **Clear All** — Delete all data and model (with confirmation)

**Tips for Good Data**:
- ✅ Good, consistent lighting
- ✅ Plain background (reduces noise)
- ✅ Center hand in frame
- ✅ Vary hand position/angle slightly for each sample (robustness)
- ✅ Keep hand still during static signs
- ✅ 60-100 samples per sign minimum
- ❌ Avoid rapid movements during capture
- ❌ Don't block hand with other objects

## Performance

- **Landmark detection**: ~20-30 FPS on modern laptops
- **Inference**: <30 ms per frame
- **Training**: <1 second for ~2000 samples (KNN)
- **Feature vector**: 42 dimensions (21 landmarks × 2D coords)

## Feature Engineering

Landmarks are normalized for robustness:

1. **Translation**: Centered at wrist (landmark 0)
2. **Scale**: Normalized by wrist → middle MCP distance
3. **Rotation**: Aligned so index MCP → pinky MCP points along +x axis
4. **Output**: Flat Float32Array of 42 values (x, y coords only)

This makes recognition invariant to:
- Hand position in frame
- Distance from camera
- Hand orientation

## Classifiers

### KNN (Default)

- Fast training and inference
- k=5 recommended
- Works well with small datasets (600+ samples)
- No hyperparameter tuning needed

### Logistic Regression (Optional)

- Slightly more accurate
- One-vs-rest strategy
- 100 iterations, learning rate 0.1
- Better generalization with more data

To switch: Modify `createClassifier()` call in code.

## Browser Compatibility

**Tested on**:
- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ⚠️ (limited MediaPipe support)

**Requirements**:
- WebRTC camera access
- IndexedDB support
- Web Speech API (for TTS)

## Troubleshooting

### Camera not working

- Check browser permissions
- Ensure no other app is using the camera
- Try different browser

### Low accuracy

- Collect more samples (100+ per sign)
- Ensure good lighting
- Keep hand centered in frame
- Try increasing k value in settings
- Reduce min confidence threshold

### Hand not detected

- Move hand closer to camera
- Improve lighting
- Use plain background
- Check MediaPipe initialization in console

### Model not loading

- Go to Collect & Train tab
- Train a model first
- Check browser console for errors

### Predictions too jittery

- Increase "Window Size" (more smoothing)
- Increase "Min Hold Frames" (more stability)
- Increase "Min Confidence" (filter low-confidence)

### Predictions too slow

- Decrease "Window Size"
- Decrease "Min Hold Frames"
- Lower "Min Confidence"

## Architecture

```
signspeak-web/
├── src/
│   ├── lib/                    # Core libraries
│   │   ├── landmarks.ts        # MediaPipe hand tracking
│   │   ├── features.ts         # Feature engineering
│   │   ├── classifier.ts       # KNN & Logistic Regression
│   │   ├── smoothing.ts        # Temporal filtering
│   │   ├── storage.ts          # IndexedDB persistence
│   │   ├── labels.ts           # Label definitions
│   │   ├── tts.ts              # Text-to-speech
│   │   └── fingerspelling.ts   # Letter mode utilities
│   ├── components/             # React components
│   │   ├── CameraView.tsx      # Video element
│   │   ├── OverlayCanvas.tsx   # Landmark drawing
│   │   ├── ConfidenceBar.tsx   # Confidence visualization
│   │   ├── SettingsDrawer.tsx  # Settings panel
│   │   └── CapturePanel.tsx    # Data capture controls
│   ├── pages/                  # Main pages
│   │   ├── Recognize.tsx       # Recognition interface
│   │   └── CollectTrain.tsx    # Data collection interface
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── styles.css              # Global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## Extending the Project

### Add New Signs

1. Go to Collect & Train
2. Enter custom label
3. Capture 60-100 samples
4. Retrain model

### Full A-Z Fingerspelling

1. Collect data for all 26 letters (100+ samples each)
2. Update `LETTERS` in `src/lib/labels.ts`
3. Train model with letter data

### Dynamic Gestures (Future)

Current implementation handles **static signs only**. For dynamic gestures:
- Track landmark sequences over time
- Use LSTM or temporal CNN
- Requires backend for heavier models

### Custom Classifier

Implement `Classifier` interface in `src/lib/classifier.ts`:

```typescript
class MyClassifier implements Classifier {
  fit(X: Float32Array[], y: string[]): void { ... }
  predict(x: Float32Array): ClassificationResult { ... }
  // ...
}
```

### Add More Features

Modify `src/lib/features.ts`:
- Enable z-coordinate (3D)
- Add pairwise distances
- Compute finger angles

```typescript
const features = toFeatureVector(landmarks, true); // Include geometric features
```

## Data Privacy

- **All processing on-device** — no data sent to servers
- **Local storage only** — data stays in your browser (IndexedDB)
- **Export/Import** — full control over your data
- **No analytics or tracking**

## Known Limitations

- **Static signs only** — no motion/gesture sequences
- **Single hand** — multi-hand not implemented
- **Lighting sensitive** — MediaPipe performance varies
- **Browser-dependent** — Safari has limited support
- **No fine-tuning** — fixed feature extraction

## Performance Tips

- Use Chrome/Edge for best performance
- Close other tabs to free GPU resources
- Good lighting improves detection rate
- Plain background reduces false positives
- Calibrate settings for your use case

## License

MIT License — Free to use, modify, and distribute.

## Credits

- **MediaPipe** — Google's hand tracking solution
- **idb-keyval** — Simple IndexedDB wrapper
- **Zustand** — Lightweight state management
- **Vite** — Fast build tool

## Support

For issues or questions:
- Check browser console for errors
- Verify MediaPipe initialization
- Review dataset quality and size
- Try different browsers

---

**Built for rapid prototyping and hackathons** 🚀

Ready to recognize signs in 36 hours!
