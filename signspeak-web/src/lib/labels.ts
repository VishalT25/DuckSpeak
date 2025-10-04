/**
 * labels.ts - Sign language label definitions and utilities
 */

/**
 * Default phrase labels
 */
export const DEFAULT_LABELS = [
  'hello',
  'yes',
  'no',
  'thank_you',
  'please',
  'help',
  'stop',
  'where',
  'bathroom',
  'ily', // I love you
  'sorry',
  'good',
  'bad',
  'water',
  'hungry',
] as const;

/**
 * Static fingerspelling letters (subset for MVP)
 */
export const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'I', 'L', 'O', 'Y',
] as const;

/**
 * Convert machine label to natural text
 */
export function toNaturalText(label: string): string {
  const mapping: Record<string, string> = {
    hello: 'Hello',
    yes: 'Yes',
    no: 'No',
    thank_you: 'Thank you',
    please: 'Please',
    help: 'Help',
    stop: 'Stop',
    where: 'Where?',
    bathroom: 'Bathroom',
    ily: 'I love you',
    sorry: 'Sorry',
    good: 'Good',
    bad: 'Bad',
    water: 'Water',
    hungry: 'Hungry',
  };

  return mapping[label] || label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get label category (phrase or letter)
 */
export function getLabelCategory(label: string): 'phrase' | 'letter' | 'unknown' {
  if (DEFAULT_LABELS.includes(label as typeof DEFAULT_LABELS[number])) {
    return 'phrase';
  }

  if (LETTERS.includes(label as typeof LETTERS[number])) {
    return 'letter';
  }

  return 'unknown';
}

/**
 * Validate label
 */
export function isValidLabel(label: string): boolean {
  // Must be non-empty and alphanumeric + underscore
  return /^[a-zA-Z0-9_]+$/.test(label) && label.length > 0;
}

/**
 * Get all available labels
 */
export function getAllLabels(): string[] {
  return [...DEFAULT_LABELS, ...LETTERS];
}

/**
 * Get label display color (for UI)
 */
export function getLabelColor(label: string): string {
  const category = getLabelCategory(label);

  switch (category) {
    case 'phrase':
      return '#00FF00'; // Green
    case 'letter':
      return '#00FFFF'; // Cyan
    default:
      return '#FFFF00'; // Yellow
  }
}

/**
 * Get suggested labels for autocomplete
 */
export function getSuggestedLabels(query: string): string[] {
  const allLabels = getAllLabels();
  const lowerQuery = query.toLowerCase();

  return allLabels.filter((label) =>
    label.toLowerCase().includes(lowerQuery)
  );
}
