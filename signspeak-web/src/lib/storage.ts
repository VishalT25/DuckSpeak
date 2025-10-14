/**
 * storage.ts - IndexedDB storage for datasets and models
 */

import { get, set, del } from 'idb-keyval';
import type { ClassifierData } from './classifier';
import type { SequenceClassifierData } from './sequenceClassifier';

export interface DatasetSample {
  label: string;
  features: number[]; // Serialized Float32Array
  timestamp: number;
}

export interface Dataset {
  samples: DatasetSample[];
  createdAt: number;
  updatedAt: number;
}

// New: Sequence dataset for dynamic gestures
export interface SequenceSample {
  label: string;
  sequence: number[][]; // Serialized Float32Array[]
  timestamp: number;
  duration: number; // milliseconds
}

export interface SequenceDataset {
  samples: SequenceSample[];
  createdAt: number;
  updatedAt: number;
}

const DATASET_KEY = 'signspeak-dataset';
const MODEL_KEY = 'signspeak-model';
const SEQUENCE_DATASET_KEY = 'signspeak-sequence-dataset';
const SEQUENCE_MODEL_KEY = 'signspeak-sequence-model';

/**
 * Save training samples for a label
 */
export async function saveSamples(label: string, features: Float32Array[]): Promise<void> {
  const dataset = await loadDataset();

  const newSamples: DatasetSample[] = features.map((f) => ({
    label,
    features: Array.from(f),
    timestamp: Date.now(),
  }));

  dataset.samples.push(...newSamples);
  dataset.updatedAt = Date.now();

  await set(DATASET_KEY, dataset);
}

/**
 * Load entire dataset
 */
export async function loadDataset(): Promise<Dataset> {
  const existing = await get<Dataset>(DATASET_KEY);

  if (existing) {
    return existing;
  }

  // Initialize empty dataset
  return {
    samples: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get all samples as training arrays
 */
export async function getAllSamples(): Promise<{ X: Float32Array[]; y: string[] }> {
  const dataset = await loadDataset();

  const X = dataset.samples.map((s) => new Float32Array(s.features));
  const y = dataset.samples.map((s) => s.label);

  return { X, y };
}

/**
 * Get samples for a specific label
 */
export async function getSamplesByLabel(label: string): Promise<Float32Array[]> {
  const dataset = await loadDataset();

  return dataset.samples
    .filter((s) => s.label === label)
    .map((s) => new Float32Array(s.features));
}

/**
 * Get sample counts per label
 */
export async function getSampleCounts(): Promise<Record<string, number>> {
  const dataset = await loadDataset();

  const counts: Record<string, number> = {};

  dataset.samples.forEach((s) => {
    counts[s.label] = (counts[s.label] || 0) + 1;
  });

  return counts;
}

/**
 * Clear dataset
 */
export async function clearDataset(): Promise<void> {
  await del(DATASET_KEY);
}

/**
 * Delete samples for a specific label
 */
export async function deleteSamplesByLabel(label: string): Promise<void> {
  const dataset = await loadDataset();

  dataset.samples = dataset.samples.filter((s) => s.label !== label);
  dataset.updatedAt = Date.now();

  await set(DATASET_KEY, dataset);
}

/**
 * Save trained model
 */
export async function saveModel(model: ClassifierData): Promise<void> {
  await set(MODEL_KEY, model);
}

/**
 * Load trained model
 */
export async function loadModel(): Promise<ClassifierData | null> {
  const existingModel = await get<ClassifierData>(MODEL_KEY);

  if (existingModel) {
    return existingModel;
  }

  // If no model exists, try to load the default pre-trained model
  try {
    console.log('[Storage] No model found, loading default pre-trained model...');
    const response = await fetch('/default-model.json');

    if (!response.ok) {
      console.log('[Storage] Default model not found');
      return null;
    }

    const data = await response.json();

    // Check if it's the combined format (dataset + model) or just the model
    let model: ClassifierData | null = null;

    if (data.model) {
      // Combined format
      model = data.model;
      // Also load the dataset if available
      if (data.dataset) {
        await set(DATASET_KEY, data.dataset);
        console.log('[Storage] Default dataset loaded');
      }
    } else if (data.type && Array.isArray(data.classes)) {
      // Direct model format
      model = data as ClassifierData;
    }

    if (model) {
      // Save it to IndexedDB so we don't need to fetch it again
      await set(MODEL_KEY, model);
      console.log('[Storage] Default model loaded and saved');
      return model;
    }

    return null;
  } catch (error) {
    console.error('[Storage] Failed to load default model:', error);
    return null;
  }
}

/**
 * Clear saved model
 */
export async function clearModel(): Promise<void> {
  await del(MODEL_KEY);
}

/**
 * Export dataset to JSON
 */
export async function exportDatasetJSON(): Promise<string> {
  const dataset = await loadDataset();
  return JSON.stringify(dataset, null, 2);
}

/**
 * Import dataset from JSON
 */
export async function importDatasetJSON(json: string): Promise<void> {
  try {
    const dataset = JSON.parse(json) as Dataset;

    // Validate structure
    if (!Array.isArray(dataset.samples)) {
      throw new Error('Invalid dataset format');
    }

    await set(DATASET_KEY, dataset);
  } catch (error) {
    throw new Error('Failed to import dataset: ' + (error as Error).message);
  }
}

/**
 * Export model to JSON
 */
export async function exportModelJSON(): Promise<string> {
  const model = await loadModel();

  if (!model) {
    throw new Error('No model to export');
  }

  return JSON.stringify(model, null, 2);
}

/**
 * Import model from JSON
 */
export async function importModelJSON(json: string): Promise<void> {
  try {
    const model = JSON.parse(json) as ClassifierData;

    // Validate structure
    if (!model.type || !Array.isArray(model.classes)) {
      throw new Error('Invalid model format');
    }

    await set(MODEL_KEY, model);
  } catch (error) {
    throw new Error('Failed to import model: ' + (error as Error).message);
  }
}

/**
 * Export both dataset and model as single JSON
 */
export async function exportAllJSON(): Promise<string> {
  const dataset = await loadDataset();
  const model = await loadModel();

  return JSON.stringify(
    {
      dataset,
      model,
      exportedAt: Date.now(),
    },
    null,
    2
  );
}

/**
 * Import both dataset and model from JSON
 */
export async function importAllJSON(json: string): Promise<void> {
  try {
    const data = JSON.parse(json);

    if (data.dataset) {
      await set(DATASET_KEY, data.dataset);
    }

    if (data.model) {
      await set(MODEL_KEY, data.model);
    }
  } catch (error) {
    throw new Error('Failed to import data: ' + (error as Error).message);
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  sampleCount: number;
  labelCount: number;
  hasModel: boolean;
  datasetSize: number;
}> {
  const dataset = await loadDataset();
  const model = await loadModel();

  const labels = new Set(dataset.samples.map((s) => s.label));

  return {
    sampleCount: dataset.samples.length,
    labelCount: labels.size,
    hasModel: model !== null,
    datasetSize: JSON.stringify(dataset).length,
  };
}

// ============================================================================
// SEQUENCE DATASET FUNCTIONS (for dynamic gestures)
// ============================================================================

/**
 * Save sequence sample
 */
export async function saveSequence(
  label: string,
  sequence: Float32Array[],
  duration: number
): Promise<void> {
  const dataset = await loadSequenceDataset();

  const newSample: SequenceSample = {
    label,
    sequence: sequence.map((frame) => Array.from(frame)),
    timestamp: Date.now(),
    duration,
  };

  dataset.samples.push(newSample);
  dataset.updatedAt = Date.now();

  await set(SEQUENCE_DATASET_KEY, dataset);
}

/**
 * Load sequence dataset
 */
export async function loadSequenceDataset(): Promise<SequenceDataset> {
  const existing = await get<SequenceDataset>(SEQUENCE_DATASET_KEY);

  if (existing) {
    return existing;
  }

  return {
    samples: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get all sequences as training arrays
 */
export async function getAllSequences(): Promise<{
  sequences: Float32Array[][];
  labels: string[];
}> {
  const dataset = await loadSequenceDataset();

  const sequences = dataset.samples.map((s) =>
    s.sequence.map((frame) => new Float32Array(frame))
  );
  const labels = dataset.samples.map((s) => s.label);

  return { sequences, labels };
}

/**
 * Get sequence sample counts per label
 */
export async function getSequenceSampleCounts(): Promise<Record<string, number>> {
  const dataset = await loadSequenceDataset();

  const counts: Record<string, number> = {};

  dataset.samples.forEach((s) => {
    counts[s.label] = (counts[s.label] || 0) + 1;
  });

  return counts;
}

/**
 * Clear sequence dataset
 */
export async function clearSequenceDataset(): Promise<void> {
  await del(SEQUENCE_DATASET_KEY);
}

/**
 * Save trained sequence model
 */
export async function saveSequenceModel(model: SequenceClassifierData): Promise<void> {
  await set(SEQUENCE_MODEL_KEY, model);
}

/**
 * Load trained sequence model
 */
export async function loadSequenceModel(): Promise<SequenceClassifierData | null> {
  return (await get<SequenceClassifierData>(SEQUENCE_MODEL_KEY)) || null;
}

/**
 * Clear saved sequence model
 */
export async function clearSequenceModel(): Promise<void> {
  await del(SEQUENCE_MODEL_KEY);
}

/**
 * Get sequence storage statistics
 */
export async function getSequenceStorageStats(): Promise<{
  sampleCount: number;
  labelCount: number;
  hasModel: boolean;
  datasetSize: number;
  avgSequenceLength: number;
}> {
  const dataset = await loadSequenceDataset();
  const model = await loadSequenceModel();

  const labels = new Set(dataset.samples.map((s) => s.label));

  const avgLength =
    dataset.samples.length > 0
      ? dataset.samples.reduce((sum, s) => sum + s.sequence.length, 0) /
        dataset.samples.length
      : 0;

  return {
    sampleCount: dataset.samples.length,
    labelCount: labels.size,
    hasModel: model !== null,
    datasetSize: JSON.stringify(dataset).length,
    avgSequenceLength: Math.round(avgLength),
  };
}

/**
 * Export sequence dataset and model
 */
export async function exportSequenceDataJSON(): Promise<string> {
  const dataset = await loadSequenceDataset();
  const model = await loadSequenceModel();

  return JSON.stringify(
    {
      dataset,
      model,
      exportedAt: Date.now(),
    },
    null,
    2
  );
}

/**
 * Import sequence dataset and model
 */
export async function importSequenceDataJSON(json: string): Promise<void> {
  try {
    const data = JSON.parse(json);

    if (data.dataset) {
      await set(SEQUENCE_DATASET_KEY, data.dataset);
    }

    if (data.model) {
      await set(SEQUENCE_MODEL_KEY, data.model);
    }
  } catch (error) {
    throw new Error('Failed to import sequence data: ' + (error as Error).message);
  }
}
