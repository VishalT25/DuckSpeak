# Dataset Import Guide — Auto-Load ASL Training Data

## ✨ New Features Added

You can now automatically load ASL sign language datasets instead of manually collecting samples! Three options are available:

### 1. 📁 **Import Dataset** (Real ASL Data)
Load CSV or JSON files with hand landmark data

### 2. ✨ **Generate Sample** (Synthetic Data)
Create synthetic training data for quick testing

### 3. ℹ️ **Kaggle Instructions**
Learn how to download and use Kaggle ASL datasets

---

## Quick Start (Easiest)

### Generate Synthetic Dataset (Testing Only)

1. Go to **"Collect & Train"** tab
2. Click **"✨ Generate Sample"** button
3. Enter sign labels: `hello,yes,no,thanks,help,stop,please,sorry,good,bad`
4. Enter samples per sign: `60`
5. Click **OK**
6. Wait ~2 seconds for generation
7. Click **"Train Model"**
8. Go to **"Recognize"** tab and test!

**Note**: Synthetic data is random and won't recognize real signs. Use for UI testing only.

---

## Real ASL Datasets

### Option A: Kaggle ASL Datasets (Recommended)

**Available Datasets**:
- `asl-signs` - Full ASL vocabulary
- `asl-fingerspelling` - A-Z fingerspelling

**Step 1: Download from Kaggle**

```bash
# Install Kaggle CLI
pip install kaggle

# Get API credentials from kaggle.com/settings
# Download dataset
kaggle competitions download -c asl-signs
```

**Step 2: Convert to SignSpeak Format**

The Kaggle datasets come in Parquet/CSV format. You need to convert them to our format.

**Python conversion script** (save as `convert_kaggle.py`):

```python
import pandas as pd
import json
import numpy as np

# Load Kaggle data
df = pd.read_parquet('train.parquet')  # or train.csv

output = []

for idx, row in df.iterrows():
    # Kaggle format: columns for each landmark coordinate
    # Adjust based on actual column names

    # Example for landmark-based format:
    hand1_landmarks = []
    hand2_landmarks = []

    # Parse hand landmarks (adjust column names to match dataset)
    for i in range(21):
        # Left hand (adjust column prefix if needed)
        if f'left_hand_x_{i}' in df.columns:
            hand1_landmarks.append({
                'x': float(row[f'left_hand_x_{i}']),
                'y': float(row[f'left_hand_y_{i}']),
                'z': float(row.get(f'left_hand_z_{i}', 0))
            })

        # Right hand
        if f'right_hand_x_{i}' in df.columns:
            hand2_landmarks.append({
                'x': float(row[f'right_hand_x_{i}']),
                'y': float(row[f'right_hand_y_{i}']),
                'z': float(row.get(f'right_hand_z_{i}', 0))
            })

    landmarks = []
    if hand1_landmarks:
        landmarks.append(hand1_landmarks)
    if hand2_landmarks:
        landmarks.append(hand2_landmarks)

    output.append({
        'label': str(row['sign']),  # adjust column name
        'landmarks': landmarks
    })

# Save as JSON
with open('asl_dataset.json', 'w') as f:
    json.dump(output, f)

print(f"Converted {len(output)} samples to asl_dataset.json")
```

**Step 3: Import to SignSpeak**

1. Open SignSpeak app
2. Go to **"Collect & Train"** tab
3. Click **"📁 Import Dataset"**
4. Select your `asl_dataset.json` file
5. Wait for import to complete
6. Click **"Train Model"**
7. Done! 🎉

---

### Option B: CSV Format (Simple)

**CSV Format**:
```csv
label,x0,y0,x1,y1,x2,y2,...,x41,y41
hello,0.5,0.3,0.52,0.31,...
yes,0.6,0.4,0.61,0.42,...
```

**Requirements**:
- First column: sign label
- Next 84 columns: x,y coordinates for 21 landmarks × 2 hands
- Values normalized 0.0-1.0

**To import**:
1. Click **"📁 Import Dataset"**
2. Select your `.csv` file
3. Done!

---

### Option C: JSON Format (Recommended)

**JSON Format**:
```json
[
  {
    "label": "hello",
    "landmarks": [
      [
        {"x": 0.5, "y": 0.3, "z": 0},
        {"x": 0.52, "y": 0.31, "z": 0},
        ...21 landmarks for hand 1
      ],
      [
        {"x": 0.7, "y": 0.3, "z": 0},
        ...21 landmarks for hand 2 (optional)
      ]
    ]
  },
  ...more samples
]
```

**To import**:
1. Click **"📁 Import Dataset"**
2. Select your `.json` file
3. Done!

---

## File Format Details

### Hand Landmark Structure

Each hand has **21 landmarks** (MediaPipe format):

```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX (MCP, PIP, DIP, TIP)
9-12: MIDDLE (MCP, PIP, DIP, TIP)
13-16: RING (MCP, PIP, DIP, TIP)
17-20: PINKY (MCP, PIP, DIP, TIP)
```

**Coordinates**:
- `x`: 0.0 (left) to 1.0 (right)
- `y`: 0.0 (top) to 1.0 (bottom)
- `z`: depth (relative to wrist, can be 0)

---

## Kaggle Dataset Instructions (Full)

### Setup Kaggle CLI

```bash
# Install
pip install kaggle

# Get API token
# 1. Go to https://www.kaggle.com/settings
# 2. Click "Create New API Token"
# 3. Save kaggle.json to ~/.kaggle/

# Download dataset
kaggle competitions download -c asl-signs

# Extract
unzip asl-signs.zip
```

### Convert Parquet to JSON

```bash
# Install pandas
pip install pandas pyarrow

# Run conversion script
python convert_kaggle.py

# Result: asl_dataset.json
```

### Import to SignSpeak

```bash
# Open SignSpeak in browser
# Go to Collect & Train tab
# Click "Import Dataset"
# Select asl_dataset.json
# Click "Train Model"
```

---

## Troubleshooting

### "No valid data found in file"

- Check CSV has correct format (1 + 84 columns)
- Ensure values are numbers between 0.0-1.0
- Verify JSON structure matches example above

### "Import failed: invalid number"

- Some cells contain NaN or non-numeric values
- Clean your CSV/JSON file first
- Use `fillna(0)` in pandas

### "Feature dimension mismatch"

- Dataset must have exactly 84 features (42 per hand)
- Check your conversion script
- Verify all 21 landmarks per hand are present

### Import is slow

- Large datasets (>10k samples) take 10-30 seconds
- Browser may freeze temporarily - this is normal
- Consider splitting into smaller batches

---

## Dataset Sources

### Public ASL Datasets

1. **Kaggle ASL Competitions**
   - URL: https://www.kaggle.com/competitions/asl-signs
   - Format: Parquet with MediaPipe landmarks
   - Size: 10k+ samples
   - License: Competition rules

2. **WLASL Dataset**
   - URL: https://github.com/dxli94/WLASL
   - Format: Videos (need to extract landmarks)
   - Size: 2000+ signs
   - License: Research use

3. **MS-ASL Dataset**
   - URL: https://www.microsoft.com/en-us/research/project/ms-asl/
   - Format: Videos + text annotations
   - Size: 16k samples
   - License: Research use

---

## Creating Your Own Dataset

You can create a dataset by:

1. **Collect samples manually** (current method)
   - Most accurate for your specific signs
   - Takes time but produces best results

2. **Record videos + extract landmarks**
   - Record sign language videos
   - Use MediaPipe to extract landmarks
   - Convert to JSON format

3. **Mix approaches**
   - Import base dataset (e.g., A-Z letters)
   - Manually collect custom signs
   - Combine both for training

---

## Best Practices

✅ **Do**:
- Use real datasets for real recognition
- Verify landmark quality before import
- Start with small dataset (100-500 samples) for testing
- Increase to 1000+ for production

✅ **Don't**:
- Don't rely on synthetic data for real use
- Don't import datasets with missing landmarks
- Don't mix different landmark formats

---

## Example Workflow

### Quick Test (5 minutes)

```
1. Click "Generate Sample"
2. Enter: hello,yes,no,thanks,help
3. Enter: 60 samples
4. Click "Train Model"
5. Test in Recognize tab
```

### Production Setup (30 minutes)

```
1. Download Kaggle dataset
2. Convert to JSON format
3. Import 1000+ samples
4. Train model
5. Test accuracy
6. Export for backup
```

---

## Support

- Check browser console (F12) for detailed error messages
- Verify file format matches examples
- Test with small dataset first (10-20 samples)
- Use "Generate Sample" to verify system works

---

**Ready to auto-load datasets!** 🚀

Choose your option:
- **Quick test**: Generate Sample
- **Real data**: Import Dataset (CSV/JSON)
- **Large scale**: Follow Kaggle guide
