/**
 * classifier.ts - Lightweight classifiers for sign recognition
 */

export interface ClassificationResult {
  label: string;
  confidence: number;
  probabilities?: Record<string, number>;
}

export interface Classifier {
  fit(X: Float32Array[], y: string[]): void;
  predict(x: Float32Array): ClassificationResult;
  getClasses(): string[];
  export(): ClassifierData;
  import(data: ClassifierData): void;
}

export interface ClassifierData {
  type: string;
  classes: string[];
  params: Record<string, unknown>;
}

/**
 * K-Nearest Neighbors classifier
 */
export class KNNClassifier implements Classifier {
  private k: number;
  private X: Float32Array[] = [];
  private y: string[] = [];
  private classes: string[] = [];

  constructor(k: number = 5) {
    this.k = k;
  }

  fit(X: Float32Array[], y: string[]): void {
    if (X.length !== y.length || X.length === 0) {
      throw new Error('Invalid training data');
    }

    this.X = X;
    this.y = y;
    this.classes = [...new Set(y)].sort();
  }

  predict(x: Float32Array): ClassificationResult {
    if (this.X.length === 0) {
      throw new Error('Classifier not trained');
    }

    // Compute distances to all training samples
    const distances = this.X.map((xi, i) => ({
      distance: this.squaredEuclideanDistance(x, xi),
      label: this.y[i],
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

    // Compute confidence as fraction of k neighbors
    const confidence = maxVotes / this.k;

    // Compute probabilities for all classes
    const probabilities: Record<string, number> = {};
    this.classes.forEach((cls) => {
      probabilities[cls] = (votes.get(cls) || 0) / this.k;
    });

    return {
      label: predictedLabel,
      confidence,
      probabilities,
    };
  }

  private squaredEuclideanDistance(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }

  getClasses(): string[] {
    return [...this.classes];
  }

  export(): ClassifierData {
    return {
      type: 'knn',
      classes: this.classes,
      params: {
        k: this.k,
        X: this.X.map((x) => Array.from(x)),
        y: this.y,
      },
    };
  }

  import(data: ClassifierData): void {
    if (data.type !== 'knn') {
      throw new Error('Invalid classifier type');
    }

    this.k = data.params.k as number;
    this.X = (data.params.X as number[][]).map((x) => new Float32Array(x));
    this.y = data.params.y as string[];
    this.classes = data.classes;
  }
}

/**
 * Simple Logistic Regression (one-vs-rest)
 */
export class LogisticRegressionClassifier implements Classifier {
  private learningRate: number;
  private iterations: number;
  private models: Map<string, Float32Array> = new Map();
  private classes: string[] = [];

  constructor(learningRate: number = 0.1, iterations: number = 100) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  fit(X: Float32Array[], y: string[]): void {
    if (X.length !== y.length || X.length === 0) {
      throw new Error('Invalid training data');
    }

    this.classes = [...new Set(y)].sort();
    const numFeatures = X[0].length;

    // Train one-vs-rest models
    this.classes.forEach((targetClass) => {
      // Binary labels: 1 for target class, 0 for others
      const binaryY = y.map((label) => (label === targetClass ? 1 : 0));

      // Initialize weights
      const weights = new Float32Array(numFeatures + 1); // +1 for bias

      // Gradient descent
      for (let iter = 0; iter < this.iterations; iter++) {
        const gradients = new Float32Array(numFeatures + 1);

        // Compute gradients
        X.forEach((xi, i) => {
          const prediction = this.sigmoid(this.dotProduct(xi, weights));
          const error = prediction - binaryY[i];

          // Update gradients
          gradients[0] += error; // bias
          for (let j = 0; j < numFeatures; j++) {
            gradients[j + 1] += error * xi[j];
          }
        });

        // Update weights
        for (let j = 0; j < weights.length; j++) {
          weights[j] -= (this.learningRate * gradients[j]) / X.length;
        }
      }

      this.models.set(targetClass, weights);
    });
  }

  predict(x: Float32Array): ClassificationResult {
    if (this.models.size === 0) {
      throw new Error('Classifier not trained');
    }

    // Compute scores for each class
    const scores = new Map<string, number>();
    this.classes.forEach((cls) => {
      const weights = this.models.get(cls)!;
      const score = this.sigmoid(this.dotProduct(x, weights));
      scores.set(cls, score);
    });

    // Find class with highest score
    let maxScore = -Infinity;
    let predictedLabel = this.classes[0];

    scores.forEach((score, label) => {
      if (score > maxScore) {
        maxScore = score;
        predictedLabel = label;
      }
    });

    // Normalize scores to probabilities
    const totalScore = Array.from(scores.values()).reduce((a, b) => a + b, 0);
    const probabilities: Record<string, number> = {};

    scores.forEach((score, label) => {
      probabilities[label] = score / totalScore;
    });

    return {
      label: predictedLabel,
      confidence: maxScore,
      probabilities,
    };
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  private dotProduct(x: Float32Array, weights: Float32Array): number {
    let sum = weights[0]; // bias
    for (let i = 0; i < x.length; i++) {
      sum += x[i] * weights[i + 1];
    }
    return sum;
  }

  getClasses(): string[] {
    return [...this.classes];
  }

  export(): ClassifierData {
    const modelsArray: Record<string, number[]> = {};
    this.models.forEach((weights, cls) => {
      modelsArray[cls] = Array.from(weights);
    });

    return {
      type: 'logistic',
      classes: this.classes,
      params: {
        learningRate: this.learningRate,
        iterations: this.iterations,
        models: modelsArray,
      },
    };
  }

  import(data: ClassifierData): void {
    if (data.type !== 'logistic') {
      throw new Error('Invalid classifier type');
    }

    this.learningRate = data.params.learningRate as number;
    this.iterations = data.params.iterations as number;
    this.classes = data.classes;

    const modelsArray = data.params.models as Record<string, number[]>;
    this.models.clear();

    Object.entries(modelsArray).forEach(([cls, weights]) => {
      this.models.set(cls, new Float32Array(weights));
    });
  }
}

/**
 * Create classifier instance
 */
export function createClassifier(type: 'knn' | 'logistic' = 'knn', params?: Record<string, number>): Classifier {
  if (type === 'knn') {
    return new KNNClassifier(params?.k ?? 5);
  } else {
    return new LogisticRegressionClassifier(params?.learningRate ?? 0.1, params?.iterations ?? 100);
  }
}
