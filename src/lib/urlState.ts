import type { AppState } from './types';

export function parseStateFromParams(params: URLSearchParams): Partial<AppState> {
  const result: Partial<AppState> = {};

  // Parse colors: URL-encoded hex colors separated by "-"
  // e.g. colors=%23ed625d-%2342b6c6-%23f79f88
  const colorsParam = params.get('colors');
  if (colorsParam) {
    const colors = colorsParam.split('-').filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
    if (colors.length >= 2) {
      result.colors = colors.map(c => c.toLowerCase());
    }
  }

  // Parse chaos
  const chaosParam = params.get('chaos');
  if (chaosParam !== null) {
    const chaos = parseFloat(chaosParam);
    if (!isNaN(chaos) && chaos >= 0 && chaos <= 1) {
      result.chaos = chaos;
    }
  }

  // Parse grain
  const grainParam = params.get('grain');
  if (grainParam !== null) {
    const grain = parseFloat(grainParam);
    if (!isNaN(grain) && grain >= 0 && grain <= 1) {
      result.grain = grain;
    }
  }

  // Parse seed
  const seedParam = params.get('seed');
  if (seedParam !== null) {
    const seed = parseInt(seedParam, 10);
    if (!isNaN(seed) && seed > 0) {
      result.seed = seed;
    }
  }

  return result;
}

export function parseStateFromUrl(): Partial<AppState> {
  return parseStateFromParams(new URLSearchParams(window.location.search));
}

export function syncStateToUrl(state: AppState): void {
  const params = new URLSearchParams();
  params.set('colors', state.colors.join('-'));
  params.set('chaos', state.chaos.toString());
  params.set('grain', state.grain.toString());
  params.set('seed', state.seed.toString());
  window.history.replaceState(null, '', '?' + params.toString());
}

export function createDebouncedUrlSync(delay: number = 300): (state: AppState) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (state: AppState) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      syncStateToUrl(state);
      timeoutId = null;
    }, delay);
  };
}
