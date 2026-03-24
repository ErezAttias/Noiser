const HEX_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

/**
 * Validates that a string is a valid hex color (#rgb or #rrggbb).
 */
export function isValidHex(hex: string): boolean {
  return HEX_REGEX.test(hex.trim());
}

/**
 * Normalizes a hex color to lowercase #rrggbb format.
 */
export function normalizeHex(hex: string): string {
  const h = hex.trim().toLowerCase();
  // Expand 3-char shorthand (#abc -> #aabbcc)
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

/**
 * Converts a #rrggbb hex string to an {r, g, b} object (0-255).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

/**
 * Converts r, g, b values (0-255) to a #rrggbb hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
