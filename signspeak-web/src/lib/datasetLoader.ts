/**
 * datasetLoader.ts - Load ASL datasets from external sources
 */

import { toMultiHandFeatureVector } from './features';
import type { HandLandmarks } from './landmarks';

/**
 * Parse CSV format ASL dataset (e.g., from Kaggle)
 * Expected format: label, hand1_x0, hand1_y0, ..., hand2_x0, hand2_y0, ...
 */
export async function loadCSVDataset(csvText: string): Promise<{ X: Float32Array[]; y: string[] }> {
  const lines = csvText.trim().split('\n');
  const X: Float32Array[] = [];
  const y: string[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const label = values[0].trim();

    // Parse hand landmarks
    // Expecting: label, x0, y0, x1, y1, ... for 21 landmarks per hand
    // For 2 hands: 1 label + 84 coordinates (42 per hand)
    if (values.length < 85) {
      console.warn(`Skipping row ${i}: insufficient data (${values.length} columns)`);
      continue;
    }

    // Extract coordinates
    const coords: number[] = [];
    for (let j = 1; j < values.length; j++) {
      const val = parseFloat(values[j]);
      if (isNaN(val)) {
        console.warn(`Skipping row ${i}: invalid number at column ${j}`);
        break;
      }
      coords.push(val);
    }

    if (coords.length >= 84) {
      y.push(label);
      X.push(new Float32Array(coords.slice(0, 84)));
    }
  }

  return { X, y };
}

/**
 * Parse JSON format ASL dataset
 * Expected format: [{ label: "hello", landmarks: [[{x,y,z}, ...], [{x,y,z}, ...]] }, ...]
 */
export async function loadJSONDataset(jsonText: string): Promise<{ X: Float32Array[]; y: string[] }> {
  try {
    const data = JSON.parse(jsonText);
    const X: Float32Array[] = [];
    const y: string[] = [];

    if (!Array.isArray(data)) {
      throw new Error('Expected JSON array format');
    }

    data.forEach((sample, idx) => {
      if (!sample.label || !sample.landmarks) {
        console.warn(`Skipping sample ${idx}: missing label or landmarks`);
        return;
      }

      // Convert landmarks to our format
      const landmarksList: HandLandmarks[] = [];

      if (Array.isArray(sample.landmarks)) {
        sample.landmarks.forEach((hand: any) => {
          if (Array.isArray(hand)) {
            const landmarks: HandLandmarks = hand.map((lm: any) => ({
              x: lm.x ?? 0,
              y: lm.y ?? 0,
              z: lm.z ?? 0,
            }));
            landmarksList.push(landmarks);
          }
        });
      }

      // Convert to feature vector
      const features = toMultiHandFeatureVector(landmarksList, false);

      y.push(sample.label);
      X.push(features);
    });

    return { X, y };
  } catch (error) {
    throw new Error('Failed to parse JSON dataset: ' + (error as Error).message);
  }
}

/**
 * Load dataset from file
 */
export async function loadDatasetFromFile(file: File): Promise<{ X: Float32Array[]; y: string[] }> {
  const text = await file.text();
  const filename = file.name.toLowerCase();

  if (filename.endsWith('.csv')) {
    return loadCSVDataset(text);
  } else if (filename.endsWith('.json')) {
    return loadJSONDataset(text);
  } else {
    throw new Error('Unsupported file format. Please use .csv or .json');
  }
}

/**
 * Generate realistic hand pose based on sign type
 */
function generateRealisticHandPose(
  signIndex: number,
  isRightHand: boolean = true
): HandLandmarks {
  const landmarks: HandLandmarks = [];

  // Base wrist position
  const wristX = isRightHand ? 0.5 : 0.45;
  const wristY = 0.6;

  // Add wrist (landmark 0)
  landmarks.push({ x: wristX, y: wristY, z: 0 });

  // Create different hand shapes based on sign index
  const handShape = signIndex % 5; // 5 different basic shapes

  // Finger configurations
  // 0: Open hand, 1: Fist, 2: Pointing, 3: OK sign, 4: Thumbs up

  const fingerConfigs = [
    // Open hand - all fingers extended
    { thumbSpread: 0.15, fingersCurl: 0.0, spread: 0.03 },
    // Fist - all fingers curled
    { thumbSpread: 0.08, fingersCurl: 0.15, spread: 0.01 },
    // Pointing - index extended, others curled
    { thumbSpread: 0.08, fingersCurl: 0.12, spread: 0.02 },
    // OK sign - thumb and index circle
    { thumbSpread: 0.12, fingersCurl: 0.08, spread: 0.025 },
    // Thumbs up - thumb extended, others curled
    { thumbSpread: 0.18, fingersCurl: 0.14, spread: 0.015 },
  ];

  const config = fingerConfigs[handShape];

  // Generate thumb (landmarks 1-4)
  for (let i = 1; i <= 4; i++) {
    landmarks.push({
      x: wristX - config.thumbSpread + (i * 0.03),
      y: wristY - (i * 0.04),
      z: 0,
    });
  }

  // Generate fingers (index, middle, ring, pinky)
  const fingers = [
    { baseX: -0.06, curl: handShape === 2 ? 0.0 : config.fingersCurl }, // Index
    { baseX: -0.02, curl: config.fingersCurl }, // Middle
    { baseX: 0.02, curl: config.fingersCurl }, // Ring
    { baseX: 0.06, curl: config.fingersCurl }, // Pinky
  ];

  fingers.forEach((finger, fingerIdx) => {
    for (let i = 1; i <= 4; i++) {
      const segmentY = wristY - 0.05 - (i * 0.035) + finger.curl;
      landmarks.push({
        x: wristX + finger.baseX + (fingerIdx * config.spread),
        y: segmentY,
        z: 0,
      });
    }
  });

  return landmarks;
}

/**
 * Add natural variation to landmarks
 */
function addNaturalVariation(landmarks: HandLandmarks, amount: number = 0.02): HandLandmarks {
  return landmarks.map((lm) => ({
    x: Math.max(0, Math.min(1, lm.x + (Math.random() - 0.5) * amount)),
    y: Math.max(0, Math.min(1, lm.y + (Math.random() - 0.5) * amount)),
    z: lm.z + (Math.random() - 0.5) * amount * 0.5,
  }));
}

/**
 * Generate sample synthetic dataset for testing
 * Creates realistic hand landmark data based on common hand shapes
 */
export function generateSampleDataset(
  labels: string[],
  samplesPerLabel: number = 50
): { X: Float32Array[]; y: string[] } {
  const X: Float32Array[] = [];
  const y: string[] = [];

  labels.forEach((label, labelIdx) => {
    // Determine if this sign uses 2 hands based on common patterns
    const twoHandSigns = ['help', 'thanks', 'thank_you', 'please', 'sorry'];
    const useSecondHand = twoHandSigns.includes(label.toLowerCase());

    for (let i = 0; i < samplesPerLabel; i++) {
      // Generate base realistic hand pose
      let hand1 = generateRealisticHandPose(labelIdx, true);

      // Add natural variation
      hand1 = addNaturalVariation(hand1, 0.025);

      const landmarksList: HandLandmarks[] = [hand1];

      // Add second hand if needed
      if (useSecondHand) {
        let hand2 = generateRealisticHandPose(labelIdx, false);
        hand2 = addNaturalVariation(hand2, 0.025);
        landmarksList.push(hand2);
      }

      // Convert to feature vector
      const features = toMultiHandFeatureVector(landmarksList, false);

      X.push(features);
      y.push(label);
    }
  });

  return { X, y };
}

/**
 * Download Kaggle ASL dataset (requires user to download manually)
 * Provides instructions for downloading
 */
export function getKaggleDatasetInstructions(): string {
  return `
To use Kaggle ASL datasets:

1. Install Kaggle CLI:
   npm install -g kaggle

2. Get Kaggle API credentials:
   - Go to kaggle.com/settings
   - Click "Create New API Token"
   - Place kaggle.json in ~/.kaggle/

3. Download dataset:
   kaggle competitions download -c asl-signs
   OR
   kaggle competitions download -c asl-fingerspelling

4. Extract and convert to JSON:
   - Unzip the downloaded file
   - Convert CSV to JSON format
   - Import using the "Import Dataset" button

Note: This app uses browser-only processing, so datasets must be
converted to compatible format first.

Alternative: Use the "Generate Sample Dataset" button to create
synthetic training data for testing.
  `.trim();
}

/**
 * Convert Kaggle parquet/CSV to our JSON format
 * This would need to be run in Node.js or Python, not in browser
 */
export function getConversionScript(): string {
  return `
# Python script to convert Kaggle ASL dataset to SignSpeak format

import pandas as pd
import json

# Load Kaggle dataset
df = pd.read_csv('train.csv')  # or .parquet

# Convert to SignSpeak format
output = []

for idx, row in df.iterrows():
    # Extract hand landmarks
    # Adjust column names based on actual dataset structure

    hand1_landmarks = []
    hand2_landmarks = []

    # Parse landmarks (adjust based on actual format)
    for i in range(21):
        hand1_landmarks.append({
            'x': row[f'hand1_x{i}'],
            'y': row[f'hand1_y{i}'],
            'z': row.get(f'hand1_z{i}', 0)
        })

        if f'hand2_x{i}' in row:
            hand2_landmarks.append({
                'x': row[f'hand2_x{i}'],
                'y': row[f'hand2_y{i}'],
                'z': row.get(f'hand2_z{i}', 0)
            })

    landmarks = [hand1_landmarks]
    if hand2_landmarks:
        landmarks.append(hand2_landmarks)

    output.append({
        'label': row['label'],
        'landmarks': landmarks
    })

# Save as JSON
with open('asl_dataset.json', 'w') as f:
    json.dump(output, f)

print(f"Converted {len(output)} samples")
  `.trim();
}
