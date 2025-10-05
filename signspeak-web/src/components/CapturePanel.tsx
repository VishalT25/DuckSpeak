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
        padding: '2rem',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h3 style={{
        marginTop: 0,
        marginBottom: '1.5rem',
        color: '#fff',
        fontSize: '1.5rem',
        fontWeight: 700,
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
      }}>
        Data Capture
      </h3>

      {/* Label selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.75rem',
          color: '#94a3b8',
          fontSize: '1rem',
          fontWeight: 500,
        }}>
          Select Sign Label:
        </label>

        {!showCustom ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {allLabels.slice(0, 12).map((label) => (
              <button
                key={label}
                onClick={() => handleLabelSelect(label)}
                disabled={isCapturing}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentLabel === label
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'rgba(51, 65, 85, 0.5)',
                  color: '#fff',
                  border: currentLabel === label ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: isCapturing ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: currentLabel === label ? 600 : 500,
                  transition: 'all 0.2s ease',
                  opacity: isCapturing ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isCapturing && currentLabel !== label) {
                    e.currentTarget.style.background = 'rgba(71, 85, 105, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCapturing && currentLabel !== label) {
                    e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)';
                  }
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              disabled={isCapturing}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(51, 65, 85, 0.5)',
                color: '#94a3b8',
                border: '1px dashed rgba(71, 85, 105, 0.5)',
                borderRadius: '0.5rem',
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                opacity: isCapturing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isCapturing) {
                  e.currentTarget.style.background = 'rgba(71, 85, 105, 0.7)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCapturing) {
                  e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              + Custom
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Enter custom label"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomLabel()}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleCustomLabel}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              OK
            </button>
            <button
              onClick={() => setShowCustom(false)}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'rgba(71, 85, 105, 0.5)',
                color: '#fff',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(71, 85, 105, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(71, 85, 105, 0.5)';
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={{
          fontSize: '1rem',
          color: '#94a3b8',
          marginTop: '0.75rem',
        }}>
          Current: <span style={{
            color: '#60a5fa',
            fontWeight: 600,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>
            {currentLabel || 'None'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {isCapturing && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '100%',
              height: '0.75rem',
              background: 'rgba(51, 65, 85, 0.5)',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              border: '1px solid rgba(71, 85, 105, 0.3)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.875rem',
            color: '#94a3b8',
            fontWeight: 500,
          }}>
            Captured: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{capturedCount}</span> / {targetCount}
          </div>
        </div>
      )}

      {/* Capture button */}
      <button
        onClick={isCapturing ? onStopCapture : onStartCapture}
        disabled={!currentLabel}
        style={{
          width: '100%',
          padding: '1rem',
          background: !currentLabel
            ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
            : isCapturing
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          border: '1px solid ' + (!currentLabel ? 'rgba(71, 85, 105, 0.3)' : isCapturing ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'),
          borderRadius: '0.75rem',
          cursor: currentLabel ? 'pointer' : 'not-allowed',
          fontWeight: 700,
          fontSize: '1.125rem',
          boxShadow: currentLabel && !isCapturing ? '0 4px 12px rgba(59, 130, 246, 0.3)' : isCapturing ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
          transition: 'all 0.2s ease',
          opacity: !currentLabel ? 0.5 : 1,
          fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          if (currentLabel) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            if (isCapturing) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            } else {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (currentLabel) {
            e.currentTarget.style.transform = 'translateY(0)';
            if (isCapturing) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            } else {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }
          }
        }}
      >
        {isCapturing ? `Stop Capture (${capturedCount}/${targetCount})` : 'Start Capture'}
      </button>

      {/* Tips */}
      {!isCapturing && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            borderRadius: '0.75rem',
          }}
        >
          <strong style={{
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>
            Tips:
          </strong>
          <ul style={{
            margin: '0.5rem 0 0',
            paddingLeft: '1.5rem',
            color: '#94a3b8',
            lineHeight: 1.8,
            fontSize: '0.875rem',
          }}>
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
