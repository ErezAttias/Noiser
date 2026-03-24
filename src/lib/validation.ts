import { isValidHex } from "./color";
import {
  MIN_COLORS,
  MAX_COLORS,
  DEFAULT_COLORS,
} from "./constants";
import { generateSeed } from "./random";

/**
 * Filters to valid hex colors, enforces min/max count,
 * and pads with defaults if the list is too short.
 */
export function validateColors(colors: string[]): string[] {
  let valid = colors.filter(isValidHex);

  // Pad with defaults if below minimum
  while (valid.length < MIN_COLORS) {
    const fallback = DEFAULT_COLORS[valid.length % DEFAULT_COLORS.length];
    valid.push(fallback);
  }

  // Truncate if above maximum
  if (valid.length > MAX_COLORS) {
    valid = valid.slice(0, MAX_COLORS);
  }

  return valid;
}

/**
 * Clamps a numeric value to [min, max].
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Returns a valid seed integer, or generates a new one
 * if the input is not a finite number.
 */
export function validateSeed(seed: unknown): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed | 0;
  }
  return generateSeed();
}
