// ============================================================================
// Gauge color interpolation: amber (low) -> blue (mid) -> green (high).
// Color carries meaning, so this is shared by the radial gauge, the stepper
// fill, and the delta chips.
// ============================================================================

type RGB = [number, number, number];

const AMBER: RGB = [242, 163, 60]; // #F2A33C
const BLUE: RGB = [79, 124, 255]; // #4F7CFF
const GREEN: RGB = [61, 214, 140]; // #3DD68C

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function rgb([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** t in [0,1] -> amber..blue..green. The piecewise split lands blue at the mid. */
export function gaugeColor(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  if (c < 0.5) return rgb(mix(AMBER, BLUE, c / 0.5));
  return rgb(mix(BLUE, GREEN, (c - 0.5) / 0.5));
}

export function gaugeColorRGB(t: number): RGB {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? mix(AMBER, BLUE, c / 0.5) : mix(BLUE, GREEN, (c - 0.5) / 0.5);
}

/** Same hue family but a translucent glow string for box-shadows. */
export function gaugeGlow(t: number, alpha = 0.5): string {
  const [r, g, b] = gaugeColorRGB(t);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}
