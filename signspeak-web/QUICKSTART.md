# SignSpeak Web — Quickstart Guide

## Installation (5 minutes)

### Option 1: From scratch with Vite

```bash
# Create new Vite project
npm create vite@latest signspeak-web -- --template react-ts

# Navigate to directory
cd signspeak-web

# Install dependencies
npm install @mediapipe/tasks-vision zustand idb-keyval

# Copy all source files from this repository to src/

# Start dev server
npm run dev
```

### Option 2: Clone existing project

```bash
# If this is a git repository
git clone <repository-url>
cd signspeak-web

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will open at `http://localhost:3000`.

## First-Time Workflow (15-20 minutes)

### Step 1: Collect Training Data

1. **Open the app** → Go to **"Collect & Train"** tab
2. **Allow camera access** when prompted
3. **Select a sign** (e.g., "hello")
4. **Click "Start Capture"**
5. **Perform the sign** with your hand clearly visible
6. **Hold steady** while it captures 100 samples (takes ~10-15 seconds)
7. **Repeat** for 5-10 different signs

**Recommended starter set** (quick demo):
- hello
- yes
- no
- thank_you
- please
- stop
- help
- good
- bad
- ily

**Tips**:
- ✅ Good lighting is critical
- ✅ Plain background works best
- ✅ Center hand in camera view
- ✅ Slightly vary position/angle between samples
- ⏱️ 60-100 samples per sign (takes ~15 seconds each)

### Step 2: Train the Model

1. After collecting data for all signs, click **"Train Model"**
2. Training completes in <1 second
3. You'll see: "Model trained successfully! X samples, Y classes"

### Step 3: Test Recognition

1. Go to **"Recognize"** tab
2. **Perform a sign** you trained on
3. See the **prediction** appear in real-time
4. Watch it appear in the **transcript**
5. Click **"🔊 Speak"** to hear the text-to-speech

## Advanced Features

### Fingerspelling Mode

1. In **Recognize** tab, click **"Letter Mode"**
2. Perform static letter signs (A, B, C, D, E, I, L, O, Y supported by default)
3. Letters accumulate in the word buffer
4. Click **"Confirm Word"** to add to transcript

**To train more letters**: Collect data for A-Z in "Collect & Train", then retrain.

### Tune Recognition Parameters

1. Click **"⚙️ Settings"** in Recognize tab
2. Adjust sliders:
   - **k**: Lower = more sensitive, higher = more stable (try 3-7)
   - **Window Size**: Higher = more smoothing (try 10-20)
   - **Min Hold Frames**: Higher = less jitter (try 5-12)
   - **Min Confidence**: Higher = fewer false positives (try 50-80%)
3. Click **"Apply"**

### Export/Import Data

**Export**:
1. Go to "Collect & Train" tab
2. Click **"Export"**
3. Saves `signspeak-data-<timestamp>.json`

**Import**:
1. Click **"Import"**
2. Select previously exported JSON file
3. Data and model are restored

**Share datasets** with teammates for consistent models!

## Troubleshooting

### "No hands detected"

- Move hand closer to camera
- Improve lighting
- Check camera is working (test in another app)
- Try refreshing the page

### "No trained model found"

- You haven't trained a model yet
- Go to "Collect & Train" and train first
- If you imported data, make sure it included a model

### Predictions are wrong

- Collect more samples (100+ per sign recommended)
- Ensure consistent hand positioning during capture
- Try adjusting k value in settings (higher = more stable)
- Check lighting and background

### Predictions are jittery

- Increase "Window Size" (more smoothing)
- Increase "Min Hold Frames" (more stability)
- Increase "Min Confidence" (filter noise)

### Training fails

- Check browser console for errors (F12)
- Ensure you have at least 2 different labels with samples
- Try clearing data and starting fresh

### Camera permission denied

- Click the camera icon in address bar
- Allow camera access
- Refresh page

## Performance Optimization

### For best performance:

- Use **Chrome** or **Edge** (best MediaPipe support)
- Close other tabs (frees GPU resources)
- Use **good lighting** (improves detection FPS)
- Keep **hand in frame** (reduces processing time)
- Collect **diverse samples** (improves accuracy)

### Expected performance:

- Landmark detection: **20-30 FPS**
- Inference: **<30ms per frame**
- Training: **<1 second** for 2000 samples
- Overall latency: **~50-100ms** from sign to prediction

## Dataset Recommendations

| Use Case | Signs | Samples/Sign | Total Samples | Training Time |
|----------|-------|--------------|---------------|---------------|
| Quick demo | 5-10 | 60 | 300-600 | <1s |
| Good demo | 10-15 | 80-100 | 800-1500 | <1s |
| Production | 20-30 | 100-150 | 2000-4500 | <1s |
| A-Z letters | 26 | 100-200 | 2600-5200 | 1-2s |

## Common Signs Reference

### Essential Signs (High Priority)

- **Greetings**: hello, goodbye, nice_to_meet_you
- **Politeness**: please, thank_you, sorry, excuse_me
- **Questions**: what, where, when, who, why, how
- **Affirmation**: yes, no, maybe, okay
- **Help**: help, stop, wait, go, come
- **Needs**: water, food, bathroom, hungry, thirsty
- **Emotions**: happy, sad, angry, tired, sick

### Letters (Static A-Z)

Start with: **A, B, C, D, E, I, L, O, Y** (easiest static letters)

Harder: F, G, H, K, M, N, P, Q, R, S, T, U, V, W, X, Z (some are dynamic)

## Next Steps

1. ✅ Collect 10-20 signs with 60-100 samples each
2. ✅ Train model
3. ✅ Test recognition
4. ✅ Tune parameters for your lighting/camera setup
5. ✅ Export data for backup
6. 🚀 Build your demo/presentation!

## Resources

- **ASL Dictionary**: https://www.handspeak.com/word/
- **MediaPipe Hands**: https://google.github.io/mediapipe/solutions/hands
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**Ready to go!** Open the app and start with "Collect & Train" → "Recognize" 🎉
