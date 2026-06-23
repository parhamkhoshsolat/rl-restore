// ============================================================================
// Horizontal stepper: Degraded -> S1 -> S2 -> S3 -> Done. Cumulative dB under
// each node; the connecting line FILLS with the accent gradient as the player
// position advances; the active node pulses. Clicking a node seeks to it.
// Single-pass methods collapse to Degraded -> Restored (two nodes).
// ============================================================================

import type { DisplayFrame } from '../../store/usePlayer';
import { fmtDelta } from '../../lib/format';
import './stepper.css';

interface Props {
  frames: DisplayFrame[];
  position: number; // fractional
  onSeekStep: (i: number) => void;
}

export function Stepper({ frames, position, onSeekStep }: Props) {
  if (frames.length < 2) return null;
  const maxIndex = frames.length - 1;
  const fillPct = (position / maxIndex) * 100;

  return (
    <div className="stepper" role="group" aria-label="Restoration steps">
      <div className="stepper__track">
        <div className="stepper__track-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <ol className="stepper__nodes">
        {frames.map((f, i) => {
          const reached = position >= i - 0.001;
          const active = Math.round(position) === i;
          const cum = f.cumulativeQuality;
          return (
            <li key={i} className="stepper__node">
              <button
                className={`stepper__dot ${reached ? 'is-reached' : ''} ${active ? 'is-active' : ''} ${
                  f.isStop ? 'is-stop' : ''
                }`}
                onClick={() => onSeekStep(i)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${f.nodeLabel}, quality ${cum.toFixed(2)}`}
              >
                {f.isStop ? '✓' : i === 0 ? '•' : i}
              </button>
              <div className="stepper__label">{f.nodeLabel}</div>
              <div className="stepper__cum mono">{cum.toFixed(2)}</div>
              {i > 0 && !f.isStop && f.delta !== 0 && (
                <div className="stepper__delta mono">{fmtDelta(f.delta)}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
