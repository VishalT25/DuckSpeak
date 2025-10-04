# Real ASL Data Collection Guide — Step-by-Step

## 🎯 Quick Start (15 Minutes to Working Model)

Follow this guide to collect real ASL sign data and get a working recognition system.

---

## Before You Start

### What You Need:
- ✅ Working webcam
- ✅ Good lighting (natural light or lamp)
- ✅ Plain background (wall, sheet, etc.)
- ✅ 15-20 minutes of time
- ✅ Knowledge of 5-10 ASL signs (or look them up)

### Recommended First Signs:
Choose **5-10 signs** that are:
- ✅ Visually distinct from each other
- ✅ Easy to remember
- ✅ Commonly used

**Suggested Starter Set**:
1. **hello** - Wave near face (1 hand)
2. **yes** - Fist nodding motion (1 hand)
3. **no** - Index + middle fingers closing (1 hand)
4. **thank you** - Fingers to chin, move forward (1 hand)
5. **please** - Circular motion on chest (1 hand)
6. **help** - Fist on flat palm, lift up (2 hands)
7. **stop** - Flat hand, palm forward (1 hand)
8. **sorry** - Fist circles on chest (1 hand)
9. **water** - W shape tapping chin (1 hand)
10. **food** - Fingers to mouth (1 hand)

---

## Step-by-Step Collection Process

### Setup (2 minutes)

1. **Clear old data** (if you used synthetic):
   ```
   Go to "Collect & Train" tab
   Click "Clear All" button
   Confirm deletion
   ```

2. **Position yourself**:
   - Sit 2-3 feet from camera
   - Face camera directly
   - Ensure your hands are in frame
   - Check lighting (no shadows on hands)

3. **Test camera**:
   - You should see green landmarks on your hand
   - Wave your hand to verify tracking works
   - Adjust position if landmarks don't appear

---

### For Each Sign (2-3 minutes per sign)

#### Example: Collecting "hello"

**Step 1: Learn the Sign**

Look up ASL "hello" if you don't know it:
- Open hand, palm facing forward
- Move hand side to side (wave)
- Near your head/face

**Step 2: Select Label**

```
In the "Data Capture" panel:
1. Click the "hello" button (or enter custom label)
2. Verify "Current: hello" is shown
```

**Step 3: Start Capture**

```
1. Click "Start Capture" button
2. Button turns red with "⏺ CAPTURING"
3. Counter shows: "Captured: 0/100"
```

**Step 4: Perform the Sign**

```
IMPORTANT: Hold the sign STEADY!

✅ Do:
- Position your hand in the sign shape
- Hold it still in one position
- Keep hand in camera view
- Maintain the same pose
- Let it auto-capture 100 samples (~10 seconds)

❌ Don't:
- Make the full motion/movement
- Move hand around too much
- Block hand with other objects
- Change hand shape during capture
```

**Step 5: Wait for Completion**

```
Watch the counter:
"Captured: 10/100"
"Captured: 20/100"
...
"Captured: 100/100"

Auto-stops when complete
Alert: "Saved 100 samples for 'hello'"
Click OK
```

**Step 6: Repeat for Next Sign**

```
Select "yes" → Start Capture → Hold steady → Wait for 100
Select "no" → Start Capture → Hold steady → Wait for 100
...and so on
```

---

## ⚡ Quick Collection Tips

### Speed Up Collection:

**Batch Similar Signs**:
- Do all 1-hand signs first
- Then all 2-hand signs
- Minimizes setup time

**Use Keyboard Shortcuts**:
- Keep one hand on keyboard
- Other hand performs sign
- Reduces clicking

**Stay in Position**:
- Don't move from your seat
- Keep lighting consistent
- Maintain same distance from camera

---

## 🎯 Quality Tips for Better Recognition

### 1. **Hand Position** ✋

**Good**:
- Hand centered in frame
- Clearly visible
- No occlusion
- Good separation from background

**Bad**:
- Hand at edge of frame
- Partially cut off
- Behind other objects
- Blending with background

### 2. **Lighting** 💡

**Good**:
- Even lighting on hand
- No harsh shadows
- Natural light from window
- Soft overhead lamp

**Bad**:
- Backlighting (hand in shadow)
- Strong side light (half shadow)
- Too dark
- Flickering light

### 3. **Variation** 🔄

**Add subtle variation during capture**:
- Slight rotation (5-10 degrees)
- Small position shifts
- Minor angle changes
- Makes model more robust!

**Don't**:
- Keep hand perfectly still (too rigid)
- Move too much (blurry/inconsistent)
- Change sign entirely

### 4. **Sign Distinctiveness** 🎨

**Choose signs that look different**:
- ✅ Different hand shapes
- ✅ Different orientations
- ✅ 1-hand vs 2-hand
- ✅ Different finger positions

**Avoid signs that are too similar**:
- ❌ "yes" and "no" both use fist
- ❌ Multiple pointing gestures
- ❌ Very subtle differences

---

## After Collection: Training

### Step 1: Verify Data

```
Check the "Dataset" panel:
- Total samples: Should be ~600+ (100 per sign × 6 signs)
- Labels: Should show all your signs
- Each label: ~100 samples

Example:
  hello: 100 samples
  yes: 100 samples
  no: 100 samples
  thank_you: 100 samples
  please: 100 samples
  help: 100 samples
```

### Step 2: Train Model

```
1. Click "Train Model" button
2. Wait ~1 second
3. Alert: "Model trained successfully! 600 samples, 6 classes"
4. Click OK
```

### Step 3: Test Recognition

```
1. Go to "Recognize" tab
2. Perform each sign you trained
3. Should see label + confidence appear
4. Hold sign steady for 1-2 seconds
5. Should see it in transcript!
```

---

## Troubleshooting Collection

### "No hand detected" during capture

**Solutions**:
- Move hand closer to camera
- Improve lighting
- Use plain background
- Remove jewelry/watch that might interfere
- Try other hand

### Counter not increasing

**Solutions**:
- Make sure hand landmarks appear (green lines)
- Check browser console for errors (F12)
- Verify "Start Capture" button is red/active
- Refresh page and try again

### Capture is too slow

**Causes**:
- Runs at ~10 FPS normally
- 100 samples = ~10 seconds
- This is expected

**Speed up**:
- Can't really speed up (limited by camera FPS)
- Just be patient
- 10 seconds per sign is fast!

### Hand landmarks are jittery/incorrect

**Solutions**:
- Improve lighting
- Clean camera lens
- Update browser
- Try different browser (Chrome recommended)
- Check GPU acceleration is enabled

---

## What Happens During Capture?

### Behind the Scenes:

1. **Every frame** (~10 FPS):
   ```
   → Camera captures video frame
   → MediaPipe detects hand(s)
   → Extracts 21 landmarks per hand
   → Normalizes coordinates
   → Converts to 84-feature vector
   → Stores in memory
   → Updates counter
   ```

2. **When 100 samples reached**:
   ```
   → Stops capture automatically
   → Saves all 100 feature vectors to IndexedDB
   → Updates dataset statistics
   → Shows confirmation alert
   ```

3. **In storage**:
   ```
   → Each sample: 84 numbers (2 hands × 42 features)
   → 100 samples = 8,400 numbers
   → Stored locally in your browser
   → Persists across sessions
   ```

---

## Advanced: Fine-Tuning Collection

### Adjust Sample Count

If you want more/fewer samples per sign:

**Current**: 100 samples per sign (default)

**To change**:
1. Edit `CollectTrain.tsx`
2. Find: `const [targetCount] = useState(100);`
3. Change to: `const [targetCount] = useState(150);` (for 150 samples)

**Recommendations**:
- Minimum: 50 samples (fast but less accurate)
- Sweet spot: 100 samples (default)
- High quality: 150-200 samples (slower but more robust)

### Capture Rate

**Current**: ~10 FPS (captures 10 samples/second)

This is limited by:
- Camera frame rate
- MediaPipe processing speed
- Browser performance

**Can't be increased** without code changes to skip frames.

---

## Expected Results

### After Collection + Training:

| Metric | Expected Value |
|--------|---------------|
| Collection time | 2-3 min per sign |
| Total for 6 signs | ~15 minutes |
| Training time | <1 second |
| Recognition accuracy | 85-95% |
| Recognition speed | ~50-100ms |
| Confidence when correct | 70-95% |

### Recognition Performance:

**Same person, same lighting**:
- Accuracy: 90-95% ✅
- Works great!

**Different person**:
- Accuracy: 40-60% ⚠️
- Needs retraining for new person

**Different lighting**:
- Accuracy: 70-85% ⚠️
- Somewhat robust

**Different angle/distance**:
- Accuracy: 60-80% ⚠️
- Normalization helps but not perfect

---

## Next Steps After First Collection

### 1. Export Your Data

```
Click "Export" button
Downloads: signspeak-data-[timestamp].json
Save this file as backup!
```

**Why**:
- If browser data clears, you lose everything
- Can share with teammates
- Can restore later with "Import"

### 2. Add More Signs

```
Just continue collecting:
- Select new sign label
- Start capture
- Repeat

Model will include new signs when retrained
```

### 3. Improve Accuracy

**If recognition is poor**:
- Collect more samples (150-200 per sign)
- Ensure better lighting
- Use more distinct signs
- Add variation during capture

### 4. Share Dataset

```
Export → Send JSON file → Teammate imports
Now you both have same model!
```

---

## Common Mistakes to Avoid

❌ **Moving too much during capture**
→ Hold sign steady in one position

❌ **Performing full sign motion**
→ Just hold the static hand shape

❌ **Too few samples**
→ Use at least 60-100 per sign

❌ **Signs too similar**
→ Choose visually distinct signs

❌ **Bad lighting**
→ Ensure hands are well-lit

❌ **Not exporting data**
→ Always export as backup!

❌ **Expecting instant recognition**
→ System needs 1-2 seconds to stabilize

❌ **Testing with different person**
→ Model is person-specific without diverse training data

---

## Ready to Start!

### Your Checklist:

- [ ] Camera working (green landmarks visible)
- [ ] Good lighting setup
- [ ] Plain background
- [ ] Know 5-10 ASL signs (or have reference ready)
- [ ] Cleared old synthetic data
- [ ] 15 minutes of focused time

### Go to "Collect & Train" Tab and Start! 🚀

**Remember**:
1. Select label
2. Click "Start Capture"
3. Hold sign steady
4. Wait for 100 samples
5. Repeat for all signs
6. Click "Train Model"
7. Test in "Recognize" tab

**You've got this!** 💪

---

Need help during collection? Check browser console (F12) for any errors or watch the counter to verify samples are being captured.
