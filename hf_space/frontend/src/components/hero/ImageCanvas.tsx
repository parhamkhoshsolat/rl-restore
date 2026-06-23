// ============================================================================
// The large restoration canvas. Renders a cross-fade between the two frames
// adjacent to the fractional `position`, using a left-to-right reveal-wipe
// (clip-path) for the incoming frame — GPU-only (opacity + clip-path) for 60fps.
// A "thinking" shimmer overlay covers the single inference wait.
// ============================================================================

import { useMemo } from 'react';
import type { DisplayFrame } from '../../store/usePlayer';
import { prettyToolName } from '../../config/registry';
import './image-canvas.css';

interface Props {
  frames: DisplayFrame[];
  position: number; // fractional
  thinking?: boolean;
  reducedMotion: boolean;
}

export function ImageCanvas({ frames, position, thinking, reducedMotion }: Props) {
  const { lo, hi, t } = useMemo(() => {
    const loIdx = Math.floor(position);
    const hiIdx = Math.min(frames.length - 1, loIdx + 1);
    const frac = position - loIdx;
    return { lo: loIdx, hi: hiIdx, t: frac };
  }, [position, frames.length]);

  if (!frames.length) {
    return (
      <div className="canvas canvas--empty">
        <div className="canvas__placeholder">Awaiting image…</div>
      </div>
    );
  }

  const loFrame = frames[lo];
  const hiFrame = frames[hi];
  const sameFrame = lo === hi;

  // reveal-wipe: incoming frame is clipped left->right by t; when reduced motion,
  // we just hard-cut at the rounded frame.
  const wipe = reducedMotion ? (t > 0.5 ? 1 : 0) : t;
  const revealPct = Math.round(wipe * 100);

  return (
    <div className="canvas">
      <div className="canvas__stack">
        {/* base = lo frame (fully visible) */}
        <img className="canvas__img" src={loFrame.image} alt={loFrame.nodeLabel} draggable={false} />
        {/* incoming = hi frame, revealed left->right */}
        {!sameFrame && (
          <img
            className="canvas__img canvas__img--top"
            src={hiFrame.image}
            alt={hiFrame.nodeLabel}
            draggable={false}
            style={{
              clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
              opacity: reducedMotion ? (t > 0.5 ? 1 : 0) : 0.35 + 0.65 * wipe,
            }}
          />
        )}
        {/* wipe edge highlight (only while mid-transition) */}
        {!sameFrame && wipe > 0.02 && wipe < 0.98 && (
          <div className="canvas__wipe-edge" style={{ left: `${revealPct}%` }} aria-hidden />
        )}

        {/* corner label of the active frame */}
        <div className="canvas__badge">
          <span className="canvas__badge-dot" data-stop={hiFrame.isStop ? 'true' : 'false'} />
          {prettyToolName((wipe > 0.5 ? hiFrame : loFrame).step.action_name)}
        </div>

        {thinking && (
          <div className="canvas__thinking" role="status" aria-live="polite">
            <div className="canvas__shimmer" aria-hidden />
            <div className="canvas__thinking-label">
              <span className="canvas__pulse" />
              Agent is analyzing the damage…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
