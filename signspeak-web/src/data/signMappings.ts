/**
 * signMappings.ts - Word-to-sign animation mapping
 * Simple emoji/GIF mappings for prototype sign animations
 * Can be replaced with 3D avatar or motion model later
 */

export interface SignAnimation {
  word: string;
  emoji?: string;
  gifUrl?: string;
  description?: string;
}

/**
 * Sign animation mappings
 * Format: word -> emoji or GIF URL
 */
export const SIGN_MAPPINGS: Record<string, SignAnimation> = {
  // Greetings
  hello: { word: 'hello', emoji: '👋', description: 'Wave hand' },
  hi: { word: 'hi', emoji: '👋', description: 'Wave hand' },
  goodbye: { word: 'goodbye', emoji: '👋', description: 'Wave hand' },
  bye: { word: 'bye', emoji: '👋', description: 'Wave hand' },

  // Common words
  yes: { word: 'yes', emoji: '✅', description: 'Fist nodding up and down' },
  no: { word: 'no', emoji: '❌', description: 'Index and middle fingers opening/closing' },
  please: { word: 'please', emoji: '🙏', description: 'Circular motion on chest' },
  thanks: { word: 'thanks', emoji: '🙏', description: 'Hand moving from chin outward' },
  thank_you: { word: 'thank_you', emoji: '🙏', description: 'Hand moving from chin outward' },
  sorry: { word: 'sorry', emoji: '😔', description: 'Fist circling on chest' },

  // Questions
  help: { word: 'help', emoji: '🆘', description: 'Thumbs up on flat palm' },
  where: { word: 'where', emoji: '❓', description: 'Index finger shaking side to side' },
  what: { word: 'what', emoji: '❓', description: 'Hands turning up with confused expression' },
  who: { word: 'who', emoji: '❓', description: 'Index finger circling around mouth' },
  when: { word: 'when', emoji: '❓', description: 'Index finger pointing to wrist' },
  why: { word: 'why', emoji: '❓', description: 'Index finger tapping forehead' },
  how: { word: 'how', emoji: '❓', description: 'Hands turning palms up' },

  // Emotions
  good: { word: 'good', emoji: '👍', description: 'Thumbs up' },
  bad: { word: 'bad', emoji: '👎', description: 'Thumbs down' },
  happy: { word: 'happy', emoji: '😊', description: 'Hands brushing up chest' },
  sad: { word: 'sad', emoji: '😢', description: 'Hands moving down face' },
  love: { word: 'love', emoji: '❤️', description: 'Crossed arms over chest' },
  like: { word: 'like', emoji: '👍', description: 'Thumb up from chest' },

  // Actions
  stop: { word: 'stop', emoji: '✋', description: 'Palm facing forward' },
  go: { word: 'go', emoji: '🚀', description: 'Index fingers pointing forward' },
  come: { word: 'come', emoji: '👆', description: 'Index finger beckoning' },
  eat: { word: 'eat', emoji: '🍽️', description: 'Fingers to mouth' },
  drink: { word: 'drink', emoji: '🥤', description: 'Thumb to mouth' },
  sleep: { word: 'sleep', emoji: '😴', description: 'Hand under tilted head' },

  // People
  i: { word: 'i', emoji: '👤', description: 'Index finger pointing to self' },
  me: { word: 'me', emoji: '👤', description: 'Index finger pointing to self' },
  you: { word: 'you', emoji: '👉', description: 'Index finger pointing forward' },
  we: { word: 'we', emoji: '👥', description: 'Index finger sweeping from self to others' },

  // Places
  bathroom: { word: 'bathroom', emoji: '🚻', description: 'Letter T shaking' },
  home: { word: 'home', emoji: '🏠', description: 'Fingers forming roof shape' },
  school: { word: 'school', emoji: '🏫', description: 'Hands clapping together' },
  work: { word: 'work', emoji: '💼', description: 'Fists tapping together' },

  // Special
  ily: { word: 'ily', emoji: '🤟', description: 'I Love You sign' },
  ok: { word: 'ok', emoji: '👌', description: 'OK hand gesture' },
  nice: { word: 'nice', emoji: '✨', description: 'Open hand moving forward' },

  // Fingerspelling letters (subset)
  a: { word: 'a', emoji: '🅰️', description: 'Fist with thumb to side' },
  b: { word: 'b', emoji: '🅱️', description: 'Flat hand, thumb across palm' },
  c: { word: 'c', emoji: '©️', description: 'Curved hand forming C' },
  d: { word: 'd', emoji: 'D', description: 'Index up, other fingers touching thumb' },
  e: { word: 'e', emoji: 'E', description: 'Fingers curled down' },
  i_letter: { word: 'i', emoji: 'I', description: 'Pinky up' },
  l: { word: 'l', emoji: 'L', description: 'L-shape with thumb and index' },
  o: { word: 'o', emoji: '⭕', description: 'Fingers forming O' },
  y: { word: 'y', emoji: 'Y', description: 'Thumb and pinky out' },
};

/**
 * Get sign animation for a word
 * Returns default if not found
 */
export function getSignAnimation(word: string): SignAnimation {
  const normalized = word.toLowerCase().trim();
  return SIGN_MAPPINGS[normalized] || {
    word: normalized,
    emoji: '❔',
    description: 'No animation available',
  };
}

/**
 * Get emoji for a word (quick access)
 */
export function getSignEmoji(word: string): string {
  return getSignAnimation(word).emoji || '❔';
}

/**
 * Check if a sign animation exists
 */
export function hasSignAnimation(word: string): boolean {
  return !!SIGN_MAPPINGS[word.toLowerCase().trim()];
}

/**
 * Get all available sign words
 */
export function getAvailableSignWords(): string[] {
  return Object.keys(SIGN_MAPPINGS);
}
