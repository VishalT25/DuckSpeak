/**
 * tts.ts - Text-to-speech using Web Speech API
 */

/**
 * Check if TTS is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Speak text using Web Speech API
 */
export function speak(text: string, options: SpeechSynthesisUtterance['rate'] = 1): void {
  if (!isTTSAvailable()) {
    console.warn('Text-to-speech not available');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (isTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  if (!isTTSAvailable()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Get available voices
 */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!isTTSAvailable()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Set voice by name or index
 */
export function setVoice(utterance: SpeechSynthesisUtterance, voiceNameOrIndex: string | number): void {
  const voices = getVoices();

  if (typeof voiceNameOrIndex === 'number') {
    if (voiceNameOrIndex >= 0 && voiceNameOrIndex < voices.length) {
      utterance.voice = voices[voiceNameOrIndex];
    }
  } else {
    const voice = voices.find((v) => v.name === voiceNameOrIndex);
    if (voice) {
      utterance.voice = voice;
    }
  }
}

/**
 * Simple TTS class with debouncing
 */
export class TextToSpeech {
  private lastSpoken: string | null = null;
  private lastSpokenAt: number = 0;
  private debounceMs: number;

  constructor(debounceMs: number = 1000) {
    this.debounceMs = debounceMs;
  }

  speak(text: string, force: boolean = false): void {
    // Avoid repeating same text
    const now = Date.now();
    if (!force && text === this.lastSpoken && now - this.lastSpokenAt < this.debounceMs) {
      return;
    }

    this.lastSpoken = text;
    this.lastSpokenAt = now;
    speak(text);
  }

  stop(): void {
    stopSpeaking();
  }

  reset(): void {
    this.lastSpoken = null;
    this.lastSpokenAt = 0;
  }
}

/**
 * Check for Speech Recognition API (optional STT feature)
 */
export function isSTTAvailable(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Simple speech recognition wrapper (optional)
 */
export class SpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;

  constructor() {
    if (!isSTTAvailable()) {
      throw new Error('Speech recognition not available');
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }

  start(onResult: (text: string) => void, onError?: (error: Error) => void): void {
    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      if (onError) {
        onError(new Error(event.error));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
    this.isListening = true;
  }

  stop(): void {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }
}
