/**
 * SettingsDrawer.tsx - Settings panel for smoothing parameters
 */

import { useState } from 'react';
import type { SmoothingOptions } from '../lib/smoothing';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  params: Required<SmoothingOptions> & { k: number };
  onUpdate: (params: Partial<Required<SmoothingOptions> & { k: number }>) => void;
}

export function SettingsDrawer({ isOpen, onClose, params, onUpdate }: SettingsDrawerProps) {
  const [localParams, setLocalParams] = useState(params);

  if (!isOpen) return null;

  const handleChange = (key: keyof typeof localParams, value: number) => {
    const updated = { ...localParams, [key]: value };
    setLocalParams(updated);
  };

  const handleApply = () => {
    onUpdate(localParams);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '300px',
        backgroundColor: '#1a1a1a',
        borderLeft: '2px solid #333',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Settings</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>
          k (KNN neighbors): {localParams.k}
        </label>
        <input
          type="range"
          min="1"
          max="15"
          value={localParams.k}
          onChange={(e) => handleChange('k', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Number of nearest neighbors for classification
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>
          Window Size: {localParams.windowSize}
        </label>
        <input
          type="range"
          min="5"
          max="30"
          value={localParams.windowSize}
          onChange={(e) => handleChange('windowSize', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Number of frames for majority voting
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>
          Min Hold Frames: {localParams.minHoldFrames}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={localParams.minHoldFrames}
          onChange={(e) => handleChange('minHoldFrames', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Consecutive frames required for stable prediction
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '14px' }}>
          Min Confidence: {(localParams.minConfidence * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={localParams.minConfidence * 100}
          onChange={(e) => handleChange('minConfidence', parseInt(e.target.value) / 100)}
          style={{ width: '100%' }}
        />
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Minimum confidence threshold for predictions
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Apply
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
