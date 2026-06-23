// ============================================================================
// Radial quality gauge. The arc fills 0..1 and its color interpolates
// amber -> blue -> green (color = meaning). The big number counts to the
// current quality. Framer Motion animates both; reduced-motion -> instant.
// ============================================================================

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { gaugeColor, gaugeGlow } from '../../lib/color';
import { fmtDb } from '../../lib/format';
import './quality-gauge.css';

interface Props {
  /** continuous 0..1 fill (already interpolated by the player) */
  fill: number;
  /** quality value (dB) to display big */
  quality: number;
  /** metric label, e.g. "PSNR (dB)" or "Sharpness (est.)" */
  metricLabel: string;
  reducedMotion: boolean;
}

const SIZE = 240;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
// 270-degree sweep, gap at the bottom
const SWEEP = 0.75; // fraction of full circle used
const START_OFFSET = CIRC * (1 - SWEEP) * 0.5;

export function QualityGauge({ fill, quality, metricLabel, reducedMotion }: Props) {
  const mvFill = useMotionValue(fill);
  const mvQ = useMotionValue(quality);

  useEffect(() => {
    if (reducedMotion) {
      mvFill.set(fill);
      mvQ.set(quality);
      return;
    }
    const c1 = animate(mvFill, fill, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    const c2 = animate(mvQ, quality, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    return () => {
      c1.stop();
      c2.stop();
    };
  }, [fill, quality, reducedMotion, mvFill, mvQ]);

  // dash offset for the visible arc (only the SWEEP portion is "active" track)
  const dashOffset = useTransform(mvFill, (f) => {
    const visible = SWEEP * f;
    return CIRC - CIRC * visible;
  });
  const stroke = useTransform(mvFill, (f) => gaugeColor(f));
  const glow = useTransform(mvFill, (f) => `drop-shadow(0 0 10px ${gaugeGlow(f, 0.55)})`);
  const qText = useTransform(mvQ, (v) => fmtDb(v));

  return (
    <div className="gauge" role="img" aria-label={`${metricLabel}: ${fmtDb(quality)}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="gauge__svg">
        {/* track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRC * SWEEP} ${CIRC}`}
          strokeDashoffset={-START_OFFSET}
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
        />
        {/* active arc */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: dashOffset, filter: glow }}
          transform={`rotate(${90 + (1 - SWEEP) * 180} ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="gauge__center">
        <motion.div className="gauge__num mono">{qText}</motion.div>
        <div className="gauge__unit mono">{metricLabel}</div>
      </div>
    </div>
  );
}
