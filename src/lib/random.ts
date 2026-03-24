/**
 * Generates a random seed integer suitable for the PRNG.
 */
export function generateSeed(): number {
  return (Math.random() * 2 ** 31) | 0;
}

/**
 * Converts HSL values to a hex color string.
 */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Picks a value from weighted ranges.
 * Each entry: [weight, min, max].
 */
function weightedRange(ranges: [number, number, number][]): number {
  const total = ranges.reduce((sum, [w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [weight, min, max] of ranges) {
    roll -= weight;
    if (roll <= 0) return min + Math.random() * (max - min);
  }
  const last = ranges[ranges.length - 1];
  return last[1] + Math.random() * (last[2] - last[1]);
}

/**
 * Generates a curated random configuration that produces
 * visually pleasing textures. Uses color harmony strategies,
 * weighted chaos/grain distributions, and a fresh seed.
 */
export function generateRandomConfig(): {
  colors: string[];
  chaos: number;
  grain: number;
  seed: number;
} {
  const baseHue = Math.random() * 360;

  // Pick a harmony strategy
  const strategies = ["analogous", "complementary", "triadic", "split"] as const;
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];

  const colorCount = 2 + Math.floor(Math.random() * 3); // 2–4 colors
  const colors: string[] = [];

  for (let i = 0; i < colorCount; i++) {
    let hue: number;

    switch (strategy) {
      case "analogous":
        hue = baseHue + (Math.random() * 40 - 20); // ±20°
        break;
      case "complementary":
        hue = i % 2 === 0
          ? baseHue + (Math.random() * 20 - 10)
          : baseHue + 180 + (Math.random() * 20 - 10);
        break;
      case "triadic":
        hue = baseHue + (i % 3) * 120 + (Math.random() * 20 - 10);
        break;
      case "split":
        if (i === 0) hue = baseHue;
        else hue = baseHue + (i % 2 === 0 ? 150 : 210) + (Math.random() * 20 - 10);
        break;
    }

    const saturation = 50 + Math.random() * 40; // 50–90%
    const lightness = 40 + Math.random() * 40;  // 40–80%
    colors.push(hslToHex(hue, saturation, lightness));
  }

  // Chaos: mostly subtle, occasionally wild
  const chaos = weightedRange([
    [70, 0.05, 0.25],
    [20, 0.25, 0.5],
    [10, 0.5, 0.9],
  ]);

  // Grain: mostly light
  const grain = weightedRange([
    [80, 0.1, 0.4],
    [20, 0.4, 0.6],
  ]);

  return {
    colors,
    chaos: Math.round(chaos * 100) / 100,
    grain: Math.round(grain * 100) / 100,
    seed: generateSeed(),
  };
}

/**
 * Creates a seeded PRNG using the mulberry32 algorithm.
 * Returns a function that produces deterministic floats in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
