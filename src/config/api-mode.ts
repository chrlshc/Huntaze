export type ApiMode = 'real' | 'mock';

function normalize(mode: string | undefined): ApiMode {
  return mode?.toLowerCase() === 'mock' ? 'mock' : 'real';
}

/**
 * Global API mode switch.
 *
 * - `real` (default): real internal APIs (no MSW worker)
 * - `mock`: enable MSW + mock fixtures (video/demo mode)
 */
export function getApiMode(): ApiMode {
  return normalize(process.env.NEXT_PUBLIC_API_MODE ?? process.env.API_MODE ?? 'real');
}

export function isMockApiMode(): boolean {
  return getApiMode() === 'mock';
}

