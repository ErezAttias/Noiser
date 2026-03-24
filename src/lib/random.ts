/**
 * Generates a random seed integer suitable for the PRNG.
 */
export function generateSeed(): number {
  return (Math.random() * 2 ** 31) | 0;
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
