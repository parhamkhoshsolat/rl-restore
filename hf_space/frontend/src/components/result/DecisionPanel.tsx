// ============================================================================
// "What the agent decided" — expandable panel showing each step's q_values as
// small bar charts (chosen action highlighted, STOP value shown), a plain-
// English caption, and an early-STOP callout when the chain stopped before 3.
// Only renders for sequential methods that carry q_values.
// ============================================================================

import { useState } from 'react';
import type { RestoreResponse, RestoreStep } from '../../api/types';
import { STOP_ACTION_INDEX } from '../../api/types';
import { prettyToolName, inferKind, TOOL_KIND_UI } from '../../config/registry';
import { Pill } from '../ui/Primitives';
import './decision-panel.css';

interface Props {
  result: RestoreResponse;
}

function actionShort(idx: number): string {
  if (idx === STOP_ACTION_INDEX) return 'STOP';
  const kinds = ['B', 'B', 'B', 'B', 'N', 'N', 'N', 'N', 'J', 'J', 'J', 'J'];
  const num = (idx % 4) + 1;
  return `${kinds[idx] ?? '?'}${num}`;
}

function QBars({ step }: { step: RestoreStep }) {
  const q = step.q_values;
  if (!q || q.length === 0) return null;
  const max = Math.max(...q);
  const min = Math.min(...q, 0);
  const span = max - min || 1;
  const chosen = step.action_index;

  return (
    <div className="qbars" role="img" aria-label={`Q-values for ${step.label}`}>
      {q.map((v, i) => {
        const h = ((v - min) / span) * 100;
        const isChosen = i === chosen;
        const isStop = i === STOP_ACTION_INDEX;
        return (
          <div key={i} className="qbars__col" title={`${actionShort(i)}: ${v.toFixed(2)}`}>
            <div className="qbars__bar-wrap">
              <div
                className={`qbars__bar ${isChosen ? 'is-chosen' : ''} ${isStop ? 'is-stop' : ''}`}
                style={{ height: `${Math.max(3, h)}%` }}
              />
            </div>
            <div className={`qbars__tick mono ${isChosen ? 'is-chosen' : ''} ${isStop ? 'is-stop' : ''}`}>
              {actionShort(i)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DecisionPanel({ result }: Props) {
  const [open, setOpen] = useState(false);
  const decisionSteps = result.steps.filter((s) => s.q_values && s.q_values.length > 0);
  if (decisionSteps.length === 0) return null;

  const nTools = result.summary.n_tool_steps;
  const earlyStop = result.summary.chain.includes(STOP_ACTION_INDEX) && nTools < 3;

  return (
    <div className="decision">
      <button className="decision__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="decision__toggle-l">
          🔍 What the agent decided
          <span className="decision__sub">per-step Q-values · chosen action highlighted</span>
        </span>
        <span className={`decision__chev ${open ? 'is-open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="decision__body">
          {earlyStop && (
            <div className="decision__callout">
              <Pill tone="success">Early STOP</Pill>
              <span>
                The agent stopped after {nTools} tool{nTools === 1 ? '' : 's'} (max is 3) — it judged the
                STOP value higher than any remaining tool. Knowing when to <em>stop</em> is part of the policy.
              </span>
            </div>
          )}
          <div className="decision__legend">
            <span><i className="dot dot--chosen" /> chosen</span>
            <span><i className="dot dot--stop" /> STOP value</span>
            <span className="decision__legend-key">B = deblur · N = denoise · J = de-JPEG (1–4 by strength)</span>
          </div>

          <div className="decision__steps">
            {decisionSteps.map((s) => {
              const isStopStep = s.action_index === STOP_ACTION_INDEX;
              const kind = isStopStep ? null : inferKind(s.action_name);
              const kindUi = kind ? TOOL_KIND_UI[kind] : null;
              return (
                <div key={s.index} className="decision__step">
                  <div className="decision__step-head">
                    <span className="decision__step-no mono">{s.label}</span>
                    {kindUi ? (
                      <Pill tone="accent">{kindUi.emoji} {prettyToolName(s.action_name)}</Pill>
                    ) : (
                      <Pill tone="success">✓ chose STOP</Pill>
                    )}
                  </div>
                  <QBars step={s} />
                  <p className="decision__caption">
                    {isStopStep
                      ? `STOP had the highest value (${s.q_values![STOP_ACTION_INDEX].toFixed(2)}) — no tool was expected to improve the image further.`
                      : `Picked ${prettyToolName(s.action_name)} — its value (${s.q_values![s.action_index].toFixed(
                          2,
                        )}) beat STOP (${s.q_values![STOP_ACTION_INDEX].toFixed(2)}) and every other tool.`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
