// Small formatting helpers for metrics (tabular, signed dB, etc.).

export function fmtDb(v: number, digits = 2): string {
  return v.toFixed(digits);
}

export function fmtDelta(v: number, digits = 2): string {
  const s = v >= 0 ? '+' : '−';
  return `${s}${Math.abs(v).toFixed(digits)}`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Map a quality value to a 0..1 fill for the gauge given the run's range. */
export function qualityToFill(q: number, qMin: number, qMax: number): number {
  if (qMax <= qMin) return 0.5;
  return clamp((q - qMin) / (qMax - qMin), 0, 1);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
