/**
 * fingerspelling.ts - Fingerspelling mode utilities
 */

import { LETTERS } from './labels';

/**
 * Fingerspelling buffer for word construction
 */
export class FingerspellingBuffer {
  private buffer: string[] = [];
  private maxLength: number;
  private lastLetterTime: number = 0;
  private letterDebounceMs: number;

  constructor(maxLength: number = 20, letterDebounceMs: number = 500) {
    this.maxLength = maxLength;
    this.letterDebounceMs = letterDebounceMs;
  }

  /**
   * Add a letter to the buffer
   */
  addLetter(letter: string): boolean {
    // Check if it's a valid letter
    if (!LETTERS.includes(letter as typeof LETTERS[number])) {
      return false;
    }

    // Debounce - prevent adding same letter too quickly
    const now = Date.now();
    if (now - this.lastLetterTime < this.letterDebounceMs) {
      return false;
    }

    this.lastLetterTime = now;

    if (this.buffer.length < this.maxLength) {
      this.buffer.push(letter);
      return true;
    }

    return false;
  }

  /**
   * Get current buffer as string
   */
  getWord(): string {
    return this.buffer.join('');
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
    this.lastLetterTime = 0;
  }

  /**
   * Remove last letter (backspace)
   */
  backspace(): void {
    this.buffer.pop();
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Get buffer length
   */
  length(): number {
    return this.buffer.length;
  }

  /**
   * Get buffer as array
   */
  getLetters(): string[] {
    return [...this.buffer];
  }
}

/**
 * Fingerspelling mode manager
 */
export class FingerspellingMode {
  private buffer: FingerspellingBuffer;
  private isActive: boolean = false;
  private onWordComplete?: (word: string) => void;

  constructor(onWordComplete?: (word: string) => void) {
    this.buffer = new FingerspellingBuffer();
    this.onWordComplete = onWordComplete;
  }

  /**
   * Activate fingerspelling mode
   */
  activate(): void {
    this.isActive = true;
    this.buffer.clear();
  }

  /**
   * Deactivate fingerspelling mode
   */
  deactivate(): void {
    this.isActive = false;
    this.buffer.clear();
  }

  /**
   * Toggle mode on/off
   */
  toggle(): boolean {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
    return this.isActive;
  }

  /**
   * Check if mode is active
   */
  isEnabled(): boolean {
    return this.isActive;
  }

  /**
   * Process a prediction in fingerspelling mode
   */
  processPrediction(label: string): void {
    if (!this.isActive) return;

    // Check if it's a letter
    if (LETTERS.includes(label as typeof LETTERS[number])) {
      this.buffer.addLetter(label);
    }
  }

  /**
   * Confirm/commit current word
   */
  confirmWord(): string | null {
    if (!this.isActive || this.buffer.isEmpty()) {
      return null;
    }

    const word = this.buffer.getWord();
    this.buffer.clear();

    if (this.onWordComplete) {
      this.onWordComplete(word);
    }

    return word;
  }

  /**
   * Get current buffer state
   */
  getCurrentWord(): string {
    return this.buffer.getWord();
  }

  /**
   * Backspace last letter
   */
  backspace(): void {
    this.buffer.backspace();
  }

  /**
   * Clear buffer without deactivating
   */
  clearBuffer(): void {
    this.buffer.clear();
  }

  /**
   * Get buffer length
   */
  getBufferLength(): number {
    return this.buffer.length();
  }
}

/**
 * Check if label is a letter
 */
export function isLetter(label: string): boolean {
  return LETTERS.includes(label as typeof LETTERS[number]);
}

/**
 * Format fingerspelled word for display
 */
export function formatFingerspelledWord(word: string): string {
  // Capitalize first letter
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
