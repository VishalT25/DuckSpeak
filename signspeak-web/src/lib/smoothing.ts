/**
 * smoothing.ts - Temporal smoothing for stable predictions
 */

import type { Classifier, ClassificationResult } from './classifier';

export interface SmoothingOptions {
  windowSize?: number;
  minHoldFrames?: number;
  minConfidence?: number;
}

/**
 * Smoothed classifier wrapper with temporal filtering
 */
export class SmoothedClassifier {
  private baseClassifier: Classifier;
  private windowSize: number;
  private minHoldFrames: number;
  private minConfidence: number;

  private predictionHistory: string[] = [];
  private confidenceHistory: number[] = [];
  private currentStableLabel: string | null = null;
  private stableCount: number = 0;

  constructor(classifier: Classifier, options: SmoothingOptions = {}) {
    this.baseClassifier = classifier;
    this.windowSize = options.windowSize ?? 15;
    this.minHoldFrames = options.minHoldFrames ?? 8;
    this.minConfidence = options.minConfidence ?? 0.6;
  }

  /**
   * Predict with temporal smoothing
   */
  predict(x: Float32Array): ClassificationResult | null {
    // Get raw prediction from base classifier
    const rawResult = this.baseClassifier.predict(x);

    // Add to history
    this.predictionHistory.push(rawResult.label);
    this.confidenceHistory.push(rawResult.confidence);

    // Keep only recent history
    if (this.predictionHistory.length > this.windowSize) {
      this.predictionHistory.shift();
      this.confidenceHistory.shift();
    }

    // Need minimum history
    if (this.predictionHistory.length < Math.ceil(this.windowSize / 2)) {
      return null;
    }

    // Majority vote over window
    const voteCounts = new Map<string, number>();
    this.predictionHistory.forEach((label) => {
      voteCounts.set(label, (voteCounts.get(label) || 0) + 1);
    });

    let maxVotes = 0;
    let majorityLabel = this.predictionHistory[0];

    voteCounts.forEach((count, label) => {
      if (count > maxVotes) {
        maxVotes = count;
        majorityLabel = label;
      }
    });

    // Average confidence over window
    const avgConfidence =
      this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length;

    // Check if confidence meets threshold
    if (avgConfidence < this.minConfidence) {
      this.currentStableLabel = null;
      this.stableCount = 0;
      return null;
    }

    // Check stability - require consistent label for minHoldFrames
    if (majorityLabel === this.currentStableLabel) {
      this.stableCount++;
    } else {
      this.currentStableLabel = majorityLabel;
      this.stableCount = 1;
    }

    // Emit only if stable for required frames
    if (this.stableCount >= this.minHoldFrames) {
      return {
        label: majorityLabel,
        confidence: avgConfidence,
        probabilities: rawResult.probabilities,
      };
    }

    return null;
  }

  /**
   * Get raw prediction without smoothing
   */
  predictRaw(x: Float32Array): ClassificationResult {
    return this.baseClassifier.predict(x);
  }

  /**
   * Reset smoothing state
   */
  reset(): void {
    this.predictionHistory = [];
    this.confidenceHistory = [];
    this.currentStableLabel = null;
    this.stableCount = 0;
  }

  /**
   * Update smoothing parameters
   */
  updateParams(options: SmoothingOptions): void {
    if (options.windowSize !== undefined) {
      this.windowSize = options.windowSize;
    }
    if (options.minHoldFrames !== undefined) {
      this.minHoldFrames = options.minHoldFrames;
    }
    if (options.minConfidence !== undefined) {
      this.minConfidence = options.minConfidence;
    }

    this.reset();
  }

  /**
   * Get current smoothing parameters
   */
  getParams(): Required<SmoothingOptions> {
    return {
      windowSize: this.windowSize,
      minHoldFrames: this.minHoldFrames,
      minConfidence: this.minConfidence,
    };
  }

  /**
   * Get underlying classifier
   */
  getClassifier(): Classifier {
    return this.baseClassifier;
  }
}

/**
 * Create smoothed classifier
 */
export function createSmoothedClassifier(
  classifier: Classifier,
  options?: SmoothingOptions
): SmoothedClassifier {
  return new SmoothedClassifier(classifier, options);
}
