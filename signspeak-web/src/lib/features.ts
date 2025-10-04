/**
 * features.ts - Feature engineering for hand landmarks
 */

import type { HandLandmarks } from './landmarks';

/**
 * Normalize landmarks to be translation, scale, and rotation invariant
 */
export function normalizeLandmarks(landmarks: HandLandmarks): Float32Array {
  if (landmarks.length !== 21) {
    throw new Error('Expected 21 landmarks');
  }

  // 1. Translate to wrist origin (landmark 0)
  const wrist = landmarks[0];
  const translated = landmarks.map((lm) => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z,
  }));

  // 2. Scale by wrist → middle finger MCP distance (landmark 9)
  const middleMcp = translated[9];
  const scale = Math.sqrt(middleMcp.x ** 2 + middleMcp.y ** 2 + middleMcp.z ** 2);

  if (scale < 1e-6) {
    // Degenerate case - return zeros
    return new Float32Array(42).fill(0);
  }

  const scaled = translated.map((lm) => ({
    x: lm.x / scale,
    y: lm.y / scale,
    z: lm.z / scale,
  }));

  // 3. Rotation normalization - align index_mcp → pinky_mcp to +x axis
  const indexMcp = scaled[5];
  const pinkyMcp = scaled[17];

  const dx = pinkyMcp.x - indexMcp.x;
  const dy = pinkyMcp.y - indexMcp.y;

  const angle = Math.atan2(dy, dx);
  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  // Apply 2D rotation
  const rotated = scaled.map((lm) => ({
    x: lm.x * cosA - lm.y * sinA,
    y: lm.x * sinA + lm.y * cosA,
    z: lm.z, // Keep z as-is for now
  }));

  // 4. Flatten to feature vector (using x, y only for 2D - 42 features)
  const features = new Float32Array(42);
  rotated.forEach((lm, i) => {
    features[i * 2] = lm.x;
    features[i * 2 + 1] = lm.y;
  });

  return features;
}

/**
 * Extract additional geometric features (distances and angles)
 */
export function extractGeometricFeatures(landmarks: HandLandmarks): Float32Array {
  // Key landmark indices
  const WRIST = 0;
  const THUMB_TIP = 4;
  const INDEX_TIP = 8;
  const MIDDLE_TIP = 12;
  const RING_TIP = 16;
  const PINKY_TIP = 20;

  const keyIndices = [WRIST, THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];

  // Compute pairwise distances (15 pairs from 6 landmarks)
  const distances: number[] = [];
  for (let i = 0; i < keyIndices.length; i++) {
    for (let j = i + 1; j < keyIndices.length; j++) {
      const lm1 = landmarks[keyIndices[i]];
      const lm2 = landmarks[keyIndices[j]];

      const dist = Math.sqrt(
        (lm1.x - lm2.x) ** 2 +
        (lm1.y - lm2.y) ** 2 +
        (lm1.z - lm2.z) ** 2
      );

      distances.push(dist);
    }
  }

  return new Float32Array(distances);
}

/**
 * Convert landmarks to full feature vector
 * Includes normalized landmarks + optional geometric features
 */
export function toFeatureVector(
  landmarks: HandLandmarks,
  includeGeometric: boolean = false
): Float32Array {
  const normalized = normalizeLandmarks(landmarks);

  if (!includeGeometric) {
    return normalized;
  }

  const geometric = extractGeometricFeatures(landmarks);

  // Concatenate
  const combined = new Float32Array(normalized.length + geometric.length);
  combined.set(normalized, 0);
  combined.set(geometric, normalized.length);

  return combined;
}

/**
 * Calculate feature vector dimensionality
 */
export function getFeatureDimension(includeGeometric: boolean = false): number {
  const base = 42; // 21 landmarks × 2 coords (x, y)
  const geometric = includeGeometric ? 15 : 0; // 15 pairwise distances

  return base + geometric;
}

/**
 * Validate feature vector
 */
export function isValidFeature(feature: Float32Array): boolean {
  if (feature.length !== 42 && feature.length !== 57 && feature.length !== 84 && feature.length !== 114) {
    return false;
  }

  // Check for NaN or Inf
  for (let i = 0; i < feature.length; i++) {
    if (!isFinite(feature[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Convert multiple hands to feature vector
 * For 2-hand signs, concatenates both hand features
 */
export function toMultiHandFeatureVector(
  landmarksList: HandLandmarks[],
  includeGeometric: boolean = false
): Float32Array {
  if (landmarksList.length === 0) {
    // No hands detected - return zeros
    const size = includeGeometric ? 114 : 84; // 2 hands × (42 or 57)
    return new Float32Array(size).fill(0);
  }

  if (landmarksList.length === 1) {
    // Only one hand - pad with zeros for the second hand
    const hand1Features = toFeatureVector(landmarksList[0], includeGeometric);
    const hand2Features = new Float32Array(hand1Features.length).fill(0);

    // Concatenate
    const combined = new Float32Array(hand1Features.length * 2);
    combined.set(hand1Features, 0);
    combined.set(hand2Features, hand1Features.length);

    return combined;
  }

  // Two hands detected - concatenate both
  const hand1Features = toFeatureVector(landmarksList[0], includeGeometric);
  const hand2Features = toFeatureVector(landmarksList[1], includeGeometric);

  // Concatenate
  const combined = new Float32Array(hand1Features.length * 2);
  combined.set(hand1Features, 0);
  combined.set(hand2Features, hand1Features.length);

  return combined;
}

/**
 * Get feature dimension for multi-hand mode
 */
export function getMultiHandFeatureDimension(includeGeometric: boolean = false): number {
  return getFeatureDimension(includeGeometric) * 2; // 84 or 114 (for 2 hands)
}
