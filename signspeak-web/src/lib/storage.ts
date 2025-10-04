/**
 * storage.ts - IndexedDB storage for datasets and models
 */

import { get, set, del } from 'idb-keyval';
import type { ClassifierData } from './classifier';

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

const DATASET_KEY = 'signspeak-dataset';
const MODEL_KEY = 'signspeak-model';

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
  return (await get<ClassifierData>(MODEL_KEY)) || null;
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
