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
  renderTexture(ctx, width, height, colors, chaos, grain, seed);
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
