/**
 * CapturePanel.tsx - Data capture control panel
 */

import { useState } from 'react';
import { DEFAULT_LABELS, LETTERS } from '../lib/labels';

interface CapturePanelProps {
  isCapturing: boolean;
  currentLabel: string;
  capturedCount: number;
  targetCount: number;
  onLabelChange: (label: string) => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
}

export function CapturePanel({
  isCapturing,
  currentLabel,
  capturedCount,
  targetCount,
  onLabelChange,
  onStartCapture,
  onStopCapture,
}: CapturePanelProps) {
  const [customLabel, setCustomLabel] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const allLabels = [...DEFAULT_LABELS, ...LETTERS];

  const handleLabelSelect = (label: string) => {
    onLabelChange(label);
    setShowCustom(false);
  };

  const handleCustomLabel = () => {
    if (customLabel.trim()) {
      onLabelChange(customLabel.trim());
      setCustomLabel('');
      setShowCustom(false);
    }
  };

  const progress = targetCount > 0 ? (capturedCount / targetCount) * 100 : 0;

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#fff' }}>Data Capture</h3>

      {/* Label selection */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>
          Select Sign Label:
        </label>

        {!showCustom ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {allLabels.slice(0, 12).map((label) => (
              <button
                key={label}
                onClick={() => handleLabelSelect(label)}
                disabled={isCapturing}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentLabel === label ? '#00ff00' : '#333',
                  color: currentLabel === label ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCapturing ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: currentLabel === label ? 'bold' : 'normal',
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              disabled={isCapturing}
              style={{
                padding: '8px 12px',
                backgroundColor: '#555',
                color: '#fff',
                border: '1px dashed #888',
                borderRadius: '4px',
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              + Custom
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Enter custom label"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomLabel()}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            />
            <button
              onClick={handleCustomLabel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#00ff00',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              OK
            </button>
            <button
              onClick={() => setShowCustom(false)}
              style={{
                padding: '8px 16px',
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
        )}

        <div style={{ fontSize: '14px', color: '#888' }}>
          Current: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{currentLabel || 'None'}</span>
        </div>
      </div>

      {/* Progress bar */}
      {isCapturing && (
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#333',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#00ff00',
                transition: 'width 0.2s',
              }}
            />
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#aaa' }}>
            Captured: {capturedCount} / {targetCount}
          </div>
        </div>
      )}

      {/* Capture button */}
      <button
        onClick={isCapturing ? onStopCapture : onStartCapture}
        disabled={!currentLabel}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isCapturing ? '#ff3333' : '#00ff00',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: currentLabel ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          fontSize: '16px',
        }}
      >
        {isCapturing ? `Stop Capture (${capturedCount}/${targetCount})` : 'Start Capture'}
      </button>

      {/* Tips */}
      {!isCapturing && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#222',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#888',
          }}
        >
          <strong style={{ color: '#fff' }}>Tips:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Ensure good lighting</li>
            <li>Center your hand in view</li>
            <li>Vary position/angle slightly</li>
            <li>Capture 60-100 samples per sign</li>
          </ul>
        </div>
      )}
    </div>
  );
}
