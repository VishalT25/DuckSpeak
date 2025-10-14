/**
 * sequenceClassifier.ts - Sequence classifier for dynamic gestures using DTW
 *
 * This classifier handles temporal sequences of hand landmarks for dynamic ASL signs
 * that involve motion over time (e.g., waving, circular motions, directional movements).
 *
 * Uses Dynamic Time Warping (DTW) to compare sequences of different lengths,
 * then applies k-NN voting to determine the most likely gesture.
 */

export interface SequenceClassificationResult {
  label: string;
  confidence: number;
  probabilities?: Record<string, number>;
  distance?: number;
}

export interface SequenceClassifier {
  fit(sequences: Float32Array[][], labels: string[]): void;
  predict(sequence: Float32Array[]): SequenceClassificationResult | null;
  getClasses(): string[];
  export(): SequenceClassifierData;
  import(data: SequenceClassifierData): void;
}

export interface SequenceClassifierData {
  type: string;
  classes: string[];
  params: Record<string, unknown>;
}

/**
 * Dynamic Time Warping distance between two sequences
 * Uses windowed DTW for efficiency
 */
function dtwDistance(
  seq1: Float32Array[],
  seq2: Float32Array[],
  windowSize?: number
): number {
  const n = seq1.length;
  const m = seq2.length;

  // If no window specified, use 10% of max length
  const w = windowSize || Math.max(Math.floor(Math.max(n, m) * 0.1), 5);

  // Initialize DTW matrix with infinity
  const dtw: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(Infinity));

  dtw[0][0] = 0;

  // Fill DTW matrix with windowed constraint
  for (let i = 1; i <= n; i++) {
    // Apply Sakoe-Chiba band constraint
    const jStart = Math.max(1, i - w);
    const jEnd = Math.min(m, i + w);

    for (let j = jStart; j <= jEnd; j++) {
      // Euclidean distance between frames
      const cost = euclideanDistance(seq1[i - 1], seq2[j - 1]);

      // Take minimum of three paths
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],     // insertion
        dtw[i][j - 1],     // deletion
        dtw[i - 1][j - 1]  // match
      );
    }
  }

  return dtw[n][m];
}

/**
 * Euclidean distance between two feature vectors
 */
function euclideanDistance(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Feature dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * DTW-based k-NN Sequence Classifier
 */
export class DTWSequenceClassifier implements SequenceClassifier {
  private k: number;
  private sequences: Float32Array[][] = [];
  private labels: string[] = [];
  private classes: string[] = [];
  private windowSize?: number;

  constructor(k: number = 3, windowSize?: number) {
    this.k = k;
    this.windowSize = windowSize;
  }

  fit(sequences: Float32Array[][], labels: string[]): void {
    if (sequences.length !== labels.length || sequences.length === 0) {
      throw new Error('Invalid training data');
    }

    // Validate all sequences have same feature dimension
    const featureDim = sequences[0][0].length;
    for (const seq of sequences) {
      for (const frame of seq) {
        if (frame.length !== featureDim) {
          throw new Error(
            `Inconsistent feature dimensions: expected ${featureDim}, got ${frame.length}`
          );
        }
      }
    }

    this.sequences = sequences;
    this.labels = labels;
    this.classes = [...new Set(labels)].sort();

    console.log(
      `[DTW Classifier] Trained with ${sequences.length} sequences, ` +
      `${this.classes.length} classes, feature dim: ${featureDim}`
    );
  }

  predict(sequence: Float32Array[]): SequenceClassificationResult | null {
    if (this.sequences.length === 0) {
      console.warn('[DTW Classifier] Not trained yet');
      return null;
    }

    if (!sequence || sequence.length === 0) {
      console.warn('[DTW Classifier] Empty sequence');
      return null;
    }

    // Compute DTW distances to all training sequences
    const distances = this.sequences.map((trainSeq, i) => ({
      distance: dtwDistance(sequence, trainSeq, this.windowSize),
      label: this.labels[i],
    }));

    // Sort by distance and take top k
    distances.sort((a, b) => a.distance - b.distance);
    const kNearest = distances.slice(0, this.k);

    // Count votes
    const votes = new Map<string, number>();
    kNearest.forEach(({ label }) => {
      votes.set(label, (votes.get(label) || 0) + 1);
    });

    // Find majority
    let maxVotes = 0;
    let predictedLabel = kNearest[0].label;

    votes.forEach((count, label) => {
      if (count > maxVotes) {
        maxVotes = count;
        predictedLabel = label;
      }
    });

    // Confidence as fraction of k neighbors
    const confidence = maxVotes / this.k;

    // Compute probabilities for all classes
    const probabilities: Record<string, number> = {};
    this.classes.forEach((cls) => {
      probabilities[cls] = (votes.get(cls) || 0) / this.k;
    });

    // Use inverse distance for more confidence info
    const minDistance = kNearest[0].distance;

    return {
      label: predictedLabel,
      confidence,
      probabilities,
      distance: minDistance,
    };
  }

  getClasses(): string[] {
    return [...this.classes];
  }

  export(): SequenceClassifierData {
    return {
      type: 'dtw-sequence',
      classes: this.classes,
      params: {
        k: this.k,
        windowSize: this.windowSize,
        sequences: this.sequences.map((seq) =>
          seq.map((frame) => Array.from(frame))
        ),
        labels: this.labels,
      },
    };
  }

  import(data: SequenceClassifierData): void {
    if (data.type !== 'dtw-sequence') {
      throw new Error(`Invalid classifier type: expected dtw-sequence, got ${data.type}`);
    }

    this.k = data.params.k as number;
    this.windowSize = data.params.windowSize as number | undefined;
    this.classes = data.classes;

    const seqsArray = data.params.sequences as number[][][];
    this.sequences = seqsArray.map((seq) =>
      seq.map((frame) => new Float32Array(frame))
    );
    this.labels = data.params.labels as string[];

    console.log(
      `[DTW Classifier] Imported ${this.sequences.length} sequences, ` +
      `${this.classes.length} classes`
    );
  }
}

/**
 * Normalize sequence length using linear interpolation
 * Useful for preprocessing before training
 */
export function normalizeSequenceLength(
  sequence: Float32Array[],
  targetLength: number
): Float32Array[] {
  if (sequence.length === targetLength) {
    return sequence;
  }

  const normalized: Float32Array[] = [];
  const indices = Array.from(
    { length: targetLength },
    (_, i) => (i * (sequence.length - 1)) / (targetLength - 1)
  );

  for (const idx of indices) {
    const idxLow = Math.floor(idx);
    const idxHigh = Math.min(Math.ceil(idx), sequence.length - 1);
    const weight = idx - idxLow;

    if (idxLow === idxHigh) {
      normalized.push(sequence[idxLow]);
    } else {
      // Linear interpolation between frames
      const frameLow = sequence[idxLow];
      const frameHigh = sequence[idxHigh];
      const interpolated = new Float32Array(frameLow.length);

      for (let i = 0; i < frameLow.length; i++) {
        interpolated[i] = frameLow[i] * (1 - weight) + frameHigh[i] * weight;
      }

      normalized.push(interpolated);
    }
  }

  return normalized;
}

/**
 * Create a sequence classifier instance
 */
export function createSequenceClassifier(
  type: 'dtw' = 'dtw',
  params?: { k?: number; windowSize?: number }
): SequenceClassifier {
  if (type === 'dtw') {
    return new DTWSequenceClassifier(params?.k ?? 3, params?.windowSize);
  }

  throw new Error(`Unknown sequence classifier type: ${type}`);
}

/**
 * Validate a sequence for consistent dimensions
 */
export function validateSequence(sequence: Float32Array[]): boolean {
  if (!sequence || sequence.length === 0) return false;

  const firstDim = sequence[0].length;
  return sequence.every((frame) => frame.length === firstDim);
}
