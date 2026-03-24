import { createRng } from "./random";
import { hexToRgb } from "./color";

/**
 * Deterministic gradient texture renderer.
 *
 * Pipeline:
 *   1. Continuous noise-based color weight fields (no discrete shapes)
 *   2. Multi-scale domain warping via hash-based FBM noise (controlled by `chaos`)
 *   3. Perceptual color blending in Oklab space
 *   4. Luminance-aware grain integration (controlled by `grain`)
 *   5. Subtle contrast shaping for depth
 *
 * All randomness flows through `createRng(seed)` so identical inputs always
 * produce identical output.
 */

// ── Oklab color space conversions ─────────────────────────────────────────

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v =
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return v * 255;
}

function linearRgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToLinearRgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/**
 * Fast integer hash for deterministic per-pixel grain.
 * Returns a float in [0, 1). Uses Murmur3-style mixing for
 * high-quality distribution across adjacent coordinates.
 */
function pixelHash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 16), -1262866561) | 0;
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

export function renderTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  chaos: number,
  grain: number,
  seed: number,
  grainDensity: number = 1,
): void {
  const rng = createRng(seed);
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // ── Parse colors to Oklab ───────────────────────────────────────────
  const oklabColors = colors.map((c) => {
    const rgb = hexToRgb(c);
    return linearRgbToOklab(
      srgbToLinear(rgb.r),
      srgbToLinear(rgb.g),
      srgbToLinear(rgb.b),
    );
  });

  // ── Hash-based 2D noise ─────────────────────────────────────────────
  const HASH_SIZE = 512;
  const hashTable = new Float32Array(HASH_SIZE);
  for (let i = 0; i < HASH_SIZE; i++) {
    hashTable[i] = rng() * 2 - 1;
  }

  function valueNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // Quintic smoothstep for C2 continuity (no visible grid artifacts)
    const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);

    const h00 =
      hashTable[
        (((ix * 1597 + iy * 51749) % HASH_SIZE) + HASH_SIZE) % HASH_SIZE
      ];
    const h10 =
      hashTable[
        ((((ix + 1) * 1597 + iy * 51749) % HASH_SIZE) + HASH_SIZE) % HASH_SIZE
      ];
    const h01 =
      hashTable[
        (((ix * 1597 + (iy + 1) * 51749) % HASH_SIZE) + HASH_SIZE) % HASH_SIZE
      ];
    const h11 =
      hashTable[
        ((((ix + 1) * 1597 + (iy + 1) * 51749) % HASH_SIZE) + HASH_SIZE) %
          HASH_SIZE
      ];

    const top = h00 + (h10 - h00) * sx;
    const bottom = h01 + (h11 - h01) * sx;
    return top + (bottom - top) * sy;
  }

  function fbm(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 1;
    let totalAmp = 0;
    let freq = 1;

    for (let i = 0; i < octaves; i++) {
      value += valueNoise(x * freq, y * freq) * amplitude;
      totalAmp += amplitude;
      amplitude *= 0.5;
      freq *= 2.0;
    }

    return value / totalAmp;
  }

  // ── STAGE 1: Continuous noise-based color weight fields ─────────────
  // Each color gets unique noise offsets for its weight landscape.
  // No discrete shapes — just smooth FBM fields that determine how
  // much each color contributes at every point.
  const colorCount = oklabColors.length;

  // Per-color noise offsets (seeded, widely separated in noise space)
  const colorNoiseOffsets: Array<[number, number]> = [];
  for (let ci = 0; ci < colorCount; ci++) {
    colorNoiseOffsets.push([rng() * 1000, rng() * 1000]);
  }

  // Per-color dominance: first color leads, later colors are accents
  const colorDominance: number[] = [];
  for (let ci = 0; ci < colorCount; ci++) {
    colorDominance.push(ci === 0 ? 1.4 : ci < colorCount / 2 ? 1.0 : 0.7);
  }

  // Base frequency for color weight fields — scales with chaos so
  // low chaos produces very broad, gentle fields
  const colorFieldFreq = 0.5 + rng() * 0.3 + chaos * 1.8;
  // Per-color angle rotation so fields aren't axis-aligned
  const colorAngles: number[] = [];
  for (let ci = 0; ci < colorCount; ci++) {
    colorAngles.push(rng() * Math.PI * 2);
  }

  // ── Noise offsets for domain warping ────────────────────────────────
  const noiseBaseX = rng() * 1000;
  const noiseBaseY = rng() * 1000;
  const noiseBaseX2 = rng() * 1000;
  const noiseBaseY2 = rng() * 1000;

  // ── Pre-generate grain values ───────────────────────────────────────
  // grainDensity controls sub-pixel grain resolution:
  //   1  → white noise via sequential RNG (preview path, unchanged)
  //   >1 → hash-based sub-pixel sampling (export path, resolution-independent)
  const gd = Math.max(1, Math.round(grainDensity));
  const useHashGrain = grain > 0 && gd > 1;
  const pixelCount = width * height;
  let grainValues: Float32Array | null = null;
  let grainValues2: Float32Array | null = null;
  let grainHashSeed1 = 0;
  let grainHashSeed2 = 0;
  if (grain > 0) {
    if (useHashGrain) {
      // Derive deterministic hash seeds from the main RNG.
      grainHashSeed1 = (rng() * 2 ** 31) | 0;
      grainHashSeed2 = (rng() * 2 ** 31) | 0;
    } else {
      grainValues = new Float32Array(pixelCount);
      grainValues2 = new Float32Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        grainValues[i] = rng();
        grainValues2[i] = rng();
      }
    }
  }

  // ── Chaos remapping ─────────────────────────────────────────────────
  // Cubic remap so the low end of the slider is genuinely calm.
  // chaos=0.00 → 0.000, chaos=0.10 → 0.001, chaos=0.25 → 0.016,
  // chaos=0.50 → 0.125, chaos=1.00 → 1.000
  const c3 = chaos * chaos * chaos;
  const c2 = chaos * chaos;

  // ── Multi-scale warp parameters (chaos-dependent) ───────────────────
  const largeWarpScale = 0.002 + c2 * 0.005;
  const largeWarpAmp = c3 * 130;
  const fineWarpScale = 0.008 + c2 * 0.022;
  const fineWarpAmp = c3 * 50;
  const largeOctaves = 2 + Math.floor(chaos * 2);
  const fineOctaves = 1 + Math.floor(chaos * 3);

  // ── Color field noise parameters ────────────────────────────────────
  // 1 octave at low chaos (single smooth layer), up to 4 at max
  const fieldOctaves = 1 + Math.floor(chaos * 3);

  // Exp sharpness for color weight separation: gentle at low chaos
  const expSharpness = 0.8 + chaos * 2.2;

  // Use the shorter dimension as reference so warp looks uniform
  // across non-square canvases.
  const refSize = Math.min(width, height);

  // ── RENDER ──────────────────────────────────────────────────────────
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;

      // ── Multi-scale domain warping ──────────────────────────────
      let wnx = nx;
      let wny = ny;

      if (c3 > 0.0001) {
        // Large-scale warp: broad compositional flow
        const lx = noiseBaseX + nx * largeWarpScale * refSize;
        const ly = noiseBaseY + ny * largeWarpScale * refSize;
        const largeDx = fbm(lx, ly, largeOctaves) * largeWarpAmp / refSize;
        const largeDy = fbm(lx + 31.7, ly + 47.3, largeOctaves) * largeWarpAmp / refSize;

        // Fine-scale warp: organic micro-detail
        const fx = noiseBaseX2 + nx * fineWarpScale * refSize;
        const fy = noiseBaseY2 + ny * fineWarpScale * refSize;
        const fineDx = fbm(fx, fy, fineOctaves) * fineWarpAmp / refSize;
        const fineDy = fbm(fx + 91.1, fy + 63.5, fineOctaves) * fineWarpAmp / refSize;

        wnx += largeDx + fineDx;
        wny += largeDy + fineDy;
      }

      // ── Continuous color field blending ─────────────────────────
      // Each color's influence is a smooth FBM noise field — no shapes,
      // no centers, no radii. Just continuous weight landscapes.
      let tw = 0;
      let cL = 0;
      let ca = 0;
      let cb = 0;

      for (let ci = 0; ci < colorCount; ci++) {
        const [offX, offY] = colorNoiseOffsets[ci];
        const angle = colorAngles[ci];
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Rotate warped coordinates per-color so fields aren't parallel
        const rx = wnx * cosA - wny * sinA;
        const ry = wnx * sinA + wny * cosA;

        // Sample FBM at color's unique noise offset
        const noiseVal = fbm(
          offX + rx * colorFieldFreq,
          offY + ry * colorFieldFreq,
          fieldOctaves,
        );

        // Map noise from [-1,1] to a soft positive weight.
        // expSharpness is low at low chaos → very gentle separation,
        // high at high chaos → strong color regions.
        const weight = Math.exp(expSharpness * noiseVal * colorDominance[ci]);

        const lab = oklabColors[ci];
        cL += lab[0] * weight;
        ca += lab[1] * weight;
        cb += lab[2] * weight;
        tw += weight;
      }

      cL /= tw;
      ca /= tw;
      cb /= tw;

      // ── Luminance-aware grain in Oklab ──────────────────────────
      if (grain > 0) {
        // Scale grain with resolution so it looks identical at any render size.
        const resScale = Math.min(1, Math.sqrt(refSize / 1365));
        const grainStrength = grain * 0.35 * resScale;

        // Parabolic luminance factor: peaks at mid-tones, gentle in shadows/highlights
        const lumFactor = 0.35 + 0.65 * (4 * cL * (1 - cL));

        let gv1: number;
        let gv2: number;

        if (useHashGrain) {
          // Sub-pixel sampling with variance-preserving normalization.
          // Sum gd×gd centered sub-samples and divide by sqrt(N) to
          // maintain the same RMS intensity as white noise, while the
          // averaging shifts the distribution toward Gaussian — producing
          // the refined, film-like character that the preview gets from
          // its DPR-dense pixel grid being perceived by the eye.
          const gdSq = gd * gd;
          const sqrtN = Math.sqrt(gdSq);
          let s1 = 0;
          let s2 = 0;
          for (let sy = 0; sy < gd; sy++) {
            for (let sx = 0; sx < gd; sx++) {
              s1 += pixelHash(x * gd + sx, y * gd + sy, grainHashSeed1) - 0.5;
              s2 += pixelHash(x * gd + sx, y * gd + sy, grainHashSeed2) - 0.5;
            }
          }
          // Variance-preserving: stddev stays σ, but distribution is
          // bell-shaped (fewer extreme speckles, more uniform texture).
          // Clamp to prevent rare extreme tails.
          gv1 = Math.max(0, Math.min(1, s1 / sqrtN + 0.5));
          gv2 = Math.max(0, Math.min(1, s2 / sqrtN + 0.5));
        } else {
          const gi = y * width + x;
          gv1 = grainValues![gi];
          gv2 = grainValues2![gi];
        }

        // Luminance grain — perceptible texture
        cL += (gv1 - 0.5) * grainStrength * lumFactor;

        // Chroma grain for material integration (not just monochrome noise)
        const chromaGrain =
          (gv2 - 0.5) * grainStrength * 0.25 * lumFactor;
        ca += chromaGrain;
        cb += chromaGrain;
      }

      // ── Subtle contrast S-curve for atmospheric depth ───────────
      const deviation = cL - 0.5;
      cL = cL + 0.08 * deviation * (1 - Math.abs(deviation) * 2);

      // ── Oklab → sRGB ───────────────────────────────────────────
      const [lr, lg, lb] = oklabToLinearRgb(cL, ca, cb);
      const sr = linearToSrgb(Math.max(0, Math.min(1, lr)));
      const sg = linearToSrgb(Math.max(0, Math.min(1, lg)));
      const sb = linearToSrgb(Math.max(0, Math.min(1, lb)));

      const pi = (y * width + x) * 4;
      data[pi] = sr < 0 ? 0 : sr > 255 ? 255 : sr;
      data[pi + 1] = sg < 0 ? 0 : sg > 255 ? 255 : sg;
      data[pi + 2] = sb < 0 ? 0 : sb > 255 ? 255 : sb;
      data[pi + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
