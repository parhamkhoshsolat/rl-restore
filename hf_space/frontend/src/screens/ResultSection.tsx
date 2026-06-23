// ============================================================================
// Result actions + payoff. The image, the step-by-step, and the quality gauge
// all live in the player above — so this section deliberately does NOT repeat
// them (no second before/after, no recap chips, no duplicate gain). It holds the
// slim run summary + downloads, the "why soft?" teaching note, the Enhance
// finisher (the crisp climax), an optional A/B compare, and the Q-value panel.
// ============================================================================

import { useState } from 'react';
import type { RestoreResponse } from '../api/types';
import { useAppStore } from '../store/appStore';
import { DecisionPanel } from '../components/result/DecisionPanel';
import { EnhancePanel } from '../components/result/EnhancePanel';
import { TeachNote } from '../components/result/TeachNote';
import { Button, Pill } from '../components/ui/Primitives';
import { methodLabel as fmtMethod } from '../config/registry';
import { fmtDelta } from '../lib/format';
import { buildComparisonCard, downloadRestored, triggerDownload } from '../lib/download';
import './result-section.css';

interface Props {
  result: RestoreResponse;
  resultB: RestoreResponse | null;
  before: string;
}

export function ResultSection({ result, resultB, before }: Props) {
  const [cardBusy, setCardBusy] = useState(false);
  const enhanceAvailable = useAppStore((s) => s.methodsData?.enhance_available ?? false);
  const methodLabel = fmtMethod(result.method);

  const onCard = async () => {
    setCardBusy(true);
    try {
      const url = await buildComparisonCard(result, before, methodLabel);
      triggerDownload(url, `rl-restore-comparison-${result.method}.png`);
    } finally {
      setCardBusy(false);
    }
  };

  return (
    <div className="result">
      {/* slim summary + downloads — image / steps / gain already live in the player */}
      <div className="result__summary">
        <div className="result__facts">
          <Fact label="Method" value={methodLabel} />
          <Fact label={result.quality_metric} value={`${fmtDelta(result.summary.total_quality_delta)} dB`} />
          <Fact label="Steps to STOP" value={`${result.summary.n_tool_steps} / 3`} />
          <Fact label="Time" value={`${(result.summary.elapsed_ms / 1000).toFixed(1)}s`} />
          <Fact label="Size" value={`${result.input.w}×${result.input.h}`} />
        </div>
        <div className="result__downloads">
          <Button variant="primary" onClick={() => downloadRestored(result)}>
            ⬇ Download PNG
          </Button>
          <Button variant="outline" onClick={onCard} disabled={cardBusy}>
            {cardBusy ? '…' : '🖼'} Comparison card
          </Button>
        </div>
      </div>

      {/* why soft? → the generative finisher (the crisp climax) */}
      <TeachNote q="Why is it still a little soft?">
        Every restorer here — the agent and the single-pass CNNs — is trained to minimise{' '}
        <strong>pixel error</strong> (L1/L2). When the model is unsure, the lowest-error guess is the blurry{' '}
        <strong>average</strong> of all plausible pixels, so it regresses to the mean and looks soft. The Enhance
        step below uses a <strong>generative</strong> model trained to look real — it invents plausible detail
        instead of averaging.
      </TeachNote>
      {enhanceAvailable && <EnhancePanel restored={result.final_image} />}

      {/* A/B compare (only when a second method was run) */}
      {resultB && <CompareStrip a={result} b={resultB} before={before} />}

      {/* Q-value explainability (collapsed) */}
      <DecisionPanel result={result} />
    </div>
  );
}

function CompareStrip({ a, b, before }: { a: RestoreResponse; b: RestoreResponse; before: string }) {
  const la = fmtMethod(a.method);
  const lb = fmtMethod(b.method);
  return (
    <div className="compare">
      <div className="compare__head">
        <h3>
          A / B — {la} vs {lb}
        </h3>
        <span className="compare__note">same input, two restorers. Legibility vs. raw PSNR.</span>
      </div>
      <div className="compare__row">
        <CompareCell label={la} result={a} accent="accent" />
        <CompareCell label="input" img={before} />
        <CompareCell label={lb} result={b} accent="success" />
      </div>
    </div>
  );
}

function CompareCell({
  label,
  result,
  img,
  accent,
}: {
  label: string;
  result?: RestoreResponse;
  img?: string;
  accent?: 'accent' | 'success';
}) {
  const src = result?.final_image ?? img!;
  return (
    <figure className="compare__cell">
      <img src={src} alt={label} />
      <figcaption>
        <Pill tone={accent === 'success' ? 'success' : accent === 'accent' ? 'accent' : 'neutral'}>{label}</Pill>
        {result && (
          <span className="compare__gain mono">
            {fmtDelta(result.summary.total_quality_delta)} dB · {result.summary.n_tool_steps} steps
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="result__fact">
      <span className="result__fact-val">{value}</span>
      <span className="result__fact-lab">{label}</span>
    </div>
  );
}

// (method display names come from methodLabel in config/registry)
