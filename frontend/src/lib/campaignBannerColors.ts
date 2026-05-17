/** Default banner theme when no per-candidate RGB is stored. */
export const DEFAULT_BANNER_BG_HEX = '#0a1938';
export const DEFAULT_BANNER_ACCENT_HEX = '#d92a2a';

export const FALLBACK_BANNER_BG = { r: 10, g: 25, b: 56 } as const;
export const FALLBACK_BANNER_ACCENT = { r: 217, g: 42, b: 42 } as const;

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToCss(
  triplet: { r: number; g: number; b: number } | null | undefined,
  fallback: { r: number; g: number; b: number }
): string {
  const t = triplet ?? fallback;
  return `rgb(${t.r}, ${t.g}, ${t.b})`;
}
