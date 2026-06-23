// ============================================================================
// Telemetry sidebar (right ~38%, stacks below on mobile): radial gauge + a big
// counting dB number, a floating "+Δ dB" chip per step, and a current-step card
// (tool name + plain-English gloss). This is the presenter's teaching readout.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerApi } from '../../store/usePlayer';
import type { RestoreResponse } from '../../api/types';
import { QualityGauge } from './QualityGauge';
import { glossForTool, prettyToolName, TOOL_KIND_UI, inferKind } from '../../config/registry';
import { fmtDelta, qualityToFill } from '../../lib/format';
import { Pill } from '../ui/Primitives';
import './telemetry.css';

interface Props {
  player: PlayerApi;
  result: RestoreResponse;
}

export function TelemetrySidebar({ player, result }: Props) {
  const { frames, position, index, qMin, qMax, reducedMotion } = player;
  if (!frames.length) return null;

  // interpolate quality continuously for the gauge
  const lo = Math.floor(position);
  const hi = Math.min(frames.length - 1, lo + 1);
  const t = position - lo;
  const q = frames[lo].cumulativeQuality + (frames[hi].cumulativeQuality - frames[lo].cumulativeQuality) * t;
  const fill = qualityToFill(q, qMin, qMax);

  const current = frames[index];
  const isInput = current.step.action_index < 0 && current.step.action_name === 'input';
  const isStop = current.isStop;
  const kind = isInput || isStop ? null : inferKind(current.step.action_name);
  const kindUi = kind ? TOOL_KIND_UI[kind] : null;

  return (
    <div className="telemetry">
      <div className="telemetry__gauge-wrap">
        <QualityGauge fill={fill} quality={q} metricLabel={metricShort(result.quality_metric)} reducedMotion={reducedMotion} />
        {/* floating +Δ chip for the current step */}
        <AnimatePresence mode="popLayout">
          {current.delta !== 0 && !isStop && (
            <motion.div
              key={`delta-${index}`}
              className="telemetry__delta"
              initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {fmtDelta(current.delta)} dB
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* current-step card */}
      <div className="telemetry__card">
        <div className="telemetry__card-head">
          <span className="telemetry__step-no mono">
            {isInput ? 'START' : isStop ? 'DONE' : `STEP ${current.step.index}`}
          </span>
          {kindUi && (
            <Pill tone="accent">
              {kindUi.emoji} {kindUi.label}
            </Pill>
          )}
          {isStop && <Pill tone="success">✓ Agent stopped</Pill>}
        </div>
        <div className="telemetry__tool">{prettyToolName(current.step.action_name)}</div>
        <p className="telemetry__gloss">
          {isInput
            ? 'The starting degraded photo. Watch the quality climb as the agent applies named tools.'
            : isStop
              ? 'The agent judged the image good enough and chose to STOP — no further tool would help.'
              : glossForTool(current.step.action_name, kind ?? undefined)}
        </p>
      </div>
    </div>
  );
}

function metricShort(metric: string): string {
  if (/psnr/i.test(metric)) return 'PSNR · dB';
  if (/sharp/i.test(metric)) return 'Sharpness · est.';
  return metric;
}
