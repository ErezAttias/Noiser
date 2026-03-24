import { renderTexture } from './renderTexture';
import { EXPORT_WIDTH, EXPORT_HEIGHT } from './constants';

export function exportPng(
  colors: string[],
  chaos: number,
  grain: number,
  seed: number,
  width: number = EXPORT_WIDTH,
  height: number = EXPORT_HEIGHT,
): void {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Use sub-pixel grain sampling so grain character matches the preview's
  // DPR-dense pixel grid, without relying on canvas downsampling.
  const dpr = window.devicePixelRatio || 1;
  const grainDensity = dpr > 1 ? Math.round(dpr * 1.5) : 1;
  renderTexture(ctx, width, height, colors, chaos, grain, seed, grainDensity);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noiser-' + seed + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
