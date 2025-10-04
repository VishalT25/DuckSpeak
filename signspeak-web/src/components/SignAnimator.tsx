/**
 * SignAnimator.tsx - Visual sign animation component
 * Displays animated sign representations from text captions
 * Prototype using emoji, expandable to 3D avatars or motion models
 */

import { useEffect, useState, useRef } from 'react';
import { getSignAnimation, SignAnimation } from '../data/signMappings';

interface SignAnimatorProps {
  caption: string; // Current caption text
  isActive?: boolean; // Whether to show animations
  className?: string;
}

interface AnimationFrame {
  animation: SignAnimation;
  timestamp: number;
}

export function SignAnimator({ caption, isActive = true, className = '' }: SignAnimatorProps) {
  const [currentAnimation, setCurrentAnimation] = useState<SignAnimation | null>(null);
  const [animationQueue, setAnimationQueue] = useState<AnimationFrame[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const lastCaptionRef = useRef('');
  const animationTimeoutRef = useRef<number>();

  /**
   * Process new caption words and queue animations
   */
  useEffect(() => {
    if (!caption || !isActive || caption === lastCaptionRef.current) {
      return;
    }

    lastCaptionRef.current = caption;

    // Split caption into words and create animations
    const words = caption
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 0);

    // Queue animations for new words
    const newFrames: AnimationFrame[] = words.map(word => ({
      animation: getSignAnimation(word),
      timestamp: Date.now(),
    }));

    if (newFrames.length > 0) {
      setAnimationQueue(prev => [...prev, ...newFrames]);
    }
  }, [caption, isActive]);

  /**
   * Process animation queue
   */
  useEffect(() => {
    if (animationQueue.length === 0 || isAnimating) {
      return;
    }

    // Take next animation from queue
    const nextFrame = animationQueue[0];
    setCurrentAnimation(nextFrame.animation);
    setIsAnimating(true);

    // Remove from queue
    setAnimationQueue(prev => prev.slice(1));

    // Show animation for 1.5 seconds
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      setCurrentAnimation(null);
    }, 1500);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [animationQueue, isAnimating]);

  if (!isActive || !currentAnimation) {
    return (
      <div className={className} style={styles.container}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderText}>Waiting for captions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.container}>
      {/* Animation display */}
      <div style={styles.animationBox}>
        {/* Large emoji */}
        <div style={styles.emoji}>{currentAnimation.emoji || '❔'}</div>

        {/* Word label */}
        <div style={styles.wordLabel}>{currentAnimation.word}</div>

        {/* Description */}
        {currentAnimation.description && (
          <div style={styles.description}>{currentAnimation.description}</div>
        )}
      </div>

      {/* Queue indicator */}
      {animationQueue.length > 0 && (
        <div style={styles.queueIndicator}>
          +{animationQueue.length} more in queue
        </div>
      )}

      {/* Pulsing animation effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    minHeight: '300px',
  },

  animationBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    animation: 'pulse 1.5s ease-in-out',
  },

  emoji: {
    fontSize: '120px',
    lineHeight: '1',
    userSelect: 'none' as const,
  },

  wordLabel: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#00ff00',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
  },

  description: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center' as const,
    maxWidth: '300px',
    fontStyle: 'italic' as const,
  },

  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  placeholderText: {
    fontSize: '16px',
    color: '#666',
    fontStyle: 'italic' as const,
  },

  queueIndicator: {
    marginTop: '20px',
    padding: '8px 16px',
    backgroundColor: '#333',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#00ffff',
    fontWeight: 'bold' as const,
  },
};
