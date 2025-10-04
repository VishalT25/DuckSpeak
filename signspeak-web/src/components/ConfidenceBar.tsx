/**
 * ConfidenceBar.tsx - Visual confidence indicator
 */

interface ConfidenceBarProps {
  confidence: number;
  label?: string;
  width?: number;
  height?: number;
}

export function ConfidenceBar({ confidence, label, width = 300, height = 30 }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  const fillWidth = (confidence * width);

  // Color based on confidence level
  const getColor = (conf: number): string => {
    if (conf >= 0.8) return '#00ff00'; // Green
    if (conf >= 0.6) return '#ffff00'; // Yellow
    return '#ff6600'; // Orange
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      {label && (
        <div style={{ marginBottom: '5px', fontSize: '14px', color: '#fff' }}>
          {label}
        </div>
      )}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#333',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${fillWidth}px`,
            height: '100%',
            backgroundColor: getColor(confidence),
            transition: 'width 0.2s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000',
            textShadow: '0 0 2px #fff',
          }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}
