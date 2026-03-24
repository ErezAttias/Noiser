export const MIN_COLORS = 2;
export const MAX_COLORS = 8;
export const EXPORT_WIDTH = 2048;
export const EXPORT_HEIGHT = 1365;
export const DEFAULT_COLORS = [
  "#ed625d",
  "#42b6c6",
  "#f79f88",
  "#b2dfe6",
  "#03232d",
];
export const DEFAULT_CHAOS = 0.2;
export const DEFAULT_GRAIN = 0.3;
export const CANVAS_PREVIEW_WIDTH = 900;
export const CANVAS_PREVIEW_HEIGHT = 600;

// ── Format Presets ──────────────────────────────────────────────────────────

export type FormatKey = "desktop" | "wide" | "square" | "mobile";

export type FormatPreset = {
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
};

function fmt(label: string, width: number, height: number): FormatPreset {
  return { label, width, height, aspectRatio: width / height };
}

export const FORMATS: Record<FormatKey, FormatPreset> = {
  desktop: fmt("Desktop", 2048, 1365),
  wide:    fmt("Wide",    1920, 1080),
  square:  fmt("Square",  1080, 1080),
  mobile:  fmt("Mobile",  1080, 1920),
};

export const FORMAT_KEYS: FormatKey[] = ["desktop", "wide", "square", "mobile"];
export const DEFAULT_FORMAT: FormatKey = "desktop";
export const PREVIEW_BASE_WIDTH = 900;
