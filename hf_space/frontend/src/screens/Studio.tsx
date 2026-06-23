// ============================================================================
// Studio — the main view. Runs the step-by-step restoration: large canvas
// (left ~62%) + telemetry sidebar (right ~38%, stacks below on mobile), the
// horizontal stepper, and transport controls. Below sits the result/compare
// section (before/after slider, recap chips, downloads, decision panel).
//
// Flow inside the studio:
//   - if no result yet & not restoring -> the run pad (review input, hit Restore)
//   - while restoring -> the "thinking" canvas state
//   - once result -> the player + result section
// Single-pass (monolith) collapses the stepper to Degraded -> Restored.
// ============================================================================

import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { usePlayer } from '../store/usePlayer';
import { ImageCanvas } from '../components/hero/ImageCanvas';
import { TelemetrySidebar } from '../components/hero/TelemetrySidebar';
import { Stepper } from '../components/hero/Stepper';
import { Transport } from '../components/hero/Transport';
import { ResultSection } from './ResultSection';
import { Button, Pill, Spinner } from '../components/ui/Primitives';
import './studio.css';

export function Studio() {
  const input = useAppStore((s) => s.input);
  const method = useAppStore((s) => s.method);
  const restoring = useAppStore((s) => s.restoring);
  const result = useAppStore((s) => s.result);
  const resultB = useAppStore((s) => s.resultB);
  const restoreError = useAppStore((s) => s.restoreError);
  const runRestore = useAppStore((s) => s.runRestore);
  const setInput = useAppStore((s) => s.setInput);

  const player = usePlayer(result);

  // auto-play once a result lands
  useEffect(() => {
    if (result && player.frames.length > 1) {
      const t = setTimeout(() => player.play(), 420);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!input) return null;

  // --- idle: the pre-restore UI is the ControlBar above; render nothing here -
  if (!result && !restoring && !restoreError) return null;

  // --- error -----------------------------------------------------------------
  if (restoreError && !restoring) {
    return (
      <section className="studio">
        <div className="runpad runpad--error">
          <div className="runpad__preview">
            <img src={input.previewUrl} alt="input" />
          </div>
          <div className="runpad__meta">
            <Pill tone="danger">restoration failed</Pill>
            <h2 className="runpad__title">{restoreError.message}</h2>
            <p className="runpad__desc">
              {restoreError.kind === 'too_large'
                ? 'Try a smaller image or use the simulator examples.'
                : 'This is usually transient on CPU. Give it another go.'}
            </p>
            <div className="runpad__actions">
              {restoreError.retriable && (
                <Button variant="primary" onClick={runRestore}>
                  ↻ Retry
                </Button>
              )}
              <Button variant="ghost" onClick={() => setInput(null)}>
                Choose a different photo
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- hero player (restoring or result) ------------------------------------
  return (
    <section className="studio">
      <div className="studio__hero">
        <div className="studio__canvas">
          <ImageCanvas
            frames={result ? player.frames : []}
            position={player.position}
            thinking={restoring}
            reducedMotion={player.reducedMotion}
          />
          {result && player.frames.length >= 2 && (
            <Stepper frames={player.frames} position={player.position} onSeekStep={player.seekStep} />
          )}
          {result && <Transport player={player} />}
          {restoring && <ThinkingPad input={input} method={method} />}
        </div>

        <aside className="studio__side">
          {result ? (
            <TelemetrySidebar player={player} result={result} />
          ) : (
            <div className="studio__side-skeleton">
              <Spinner size={26} />
              <span>Reading the agent's decisions…</span>
            </div>
          )}
        </aside>
      </div>

      {result && (
        <ResultSection
          result={result}
          resultB={resultB}
          before={result.steps[0]?.image ?? input.previewUrl}
        />
      )}
    </section>
  );
}

function ThinkingPad({ input, method }: { input: { previewUrl: string }; method: string }) {
  const verb = method === 'monolith' ? 'The monolith is restoring the image' : 'The agent is analyzing the damage';
  return (
    <div className="thinkpad" role="status" aria-live="polite">
      <Spinner />
      <span>{verb}…</span>
      <span className="thinkpad__sub">running on CPU — a few seconds</span>
      <img className="thinkpad__hidden" src={input.previewUrl} alt="" aria-hidden />
    </div>
  );
}

// (method display names come from methodLabel in config/registry)
