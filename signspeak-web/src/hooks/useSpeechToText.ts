/**
 * useSpeechToText.ts - Web Speech API hook for real-time speech recognition
 * Captures speech from microphone and provides live captions
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSpeechToTextOptions {
  language?: string; // BCP 47 language tag (default: 'en-US')
  continuous?: boolean; // Continuous recognition (default: true)
  interimResults?: boolean; // Include interim results (default: true)
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechToTextReturn {
  // State
  isListening: boolean;
  isSupported: boolean;
  currentTranscript: string; // Latest interim or final transcript
  finalTranscript: string; // Accumulated final transcript
  error: string | null;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook for real-time speech-to-text using Web Speech API
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    onTranscript,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef(''); // Keep track across re-renders
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // Keep callback refs up to date
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  // Check browser support and initialize (only once)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) {
      const errMsg = 'Speech Recognition API not supported in this browser. Try Chrome or Edge.';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      console.log('[SpeechToText] Started listening');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update final transcript
      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript;
        setFinalTranscript(finalTranscriptRef.current);
        setCurrentTranscript(newFinalTranscript.trim());
        onTranscriptRef.current?.(newFinalTranscript.trim(), true);
      } else if (interimTranscript) {
        setCurrentTranscript(interimTranscript);
        onTranscriptRef.current?.(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[SpeechToText] Error:', event.error);

      // Handle different error types
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Try speaking louder.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied.';
          break;
        case 'network':
          errorMessage = 'Network error occurred.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      onErrorRef.current?.(errorMessage);

      // Auto-restart on some recoverable errors
      if (event.error === 'no-speech' && isListening) {
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              recognition.start();
            } catch (err) {
              console.log('[SpeechToText] Could not restart after no-speech error');
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('[SpeechToText] Stopped listening');
      setIsListening(false);

      // Auto-restart if continuous mode and still supposed to be listening
      if (continuous && isListening) {
        try {
          recognition.start();
        } catch (err) {
          console.log('[SpeechToText] Could not auto-restart:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [continuous, interimResults, language]); // Removed onTranscript and onError from dependencies

  /**
   * Start listening to speech
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech Recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Ignore "already started" error
      if ((err as Error).message.includes('already started')) {
        console.log('[SpeechToText] Already listening');
      } else {
        console.error('[SpeechToText] Start error:', err);
        setError((err as Error).message);
      }
    }
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /**
   * Reset accumulated transcripts
   */
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setCurrentTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    currentTranscript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
