/**
 * Utilities for accessing LiveKit credentials in the browser.
 * Real applications should fetch tokens from a trusted backend.
 */

export interface LiveKitTokenOptions {
  /** Optional override token (e.g., user input). */
  tokenOverride?: string;
}

/**
 * Resolve the LiveKit server URL from environment variables.
 */
export function getLiveKitUrl(): string {
  const url = import.meta.env.VITE_LIVEKIT_URL;

  if (!url) {
    throw new Error(
      'LiveKit server URL not configured. For local dev set VITE_LIVEKIT_URL in your .env.local file.'
    );
  }

  return url;
}

/**
 * Retrieve a LiveKit token for development usage.
 * Accepts an optional override (e.g., from a form input).
 */
export function getLiveKitToken(options: LiveKitTokenOptions = {}): string {
  const { tokenOverride } = options;
  const token = tokenOverride?.trim() || import.meta.env.VITE_LIVEKIT_TOKEN;

  if (!token) {
    throw new Error(
      'LiveKit access token not provided. Set VITE_LIVEKIT_TOKEN or supply a token at runtime.'
    );
  }

  return token;
}

/**
 * Basic configuration validation helper.
 */
export function validateLiveKitConfig(): string | null {
  const url = import.meta.env.VITE_LIVEKIT_URL;
  const token = import.meta.env.VITE_LIVEKIT_TOKEN;

  if (!url) {
    return 'VITE_LIVEKIT_URL is not set';
  }

  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    return 'VITE_LIVEKIT_URL must start with ws:// or wss://';
  }

  if (!token) {
    return 'VITE_LIVEKIT_TOKEN is not set. Provide a token via env or user input.';
  }

  return null;
}
