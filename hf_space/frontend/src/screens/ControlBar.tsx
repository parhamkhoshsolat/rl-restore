// ============================================================================
// ControlBar — the single, compact pre/post-restore control. Replaces the old
// stacked clutter (full input picker + 4 big method cards + a separate "ready to
// restore" pad). One row: chosen photo (+ change) · compact restorer chips ·
// optional A/B · the Restore button. The image stage (player/result) lives below.
// ============================================================================

import { useAppStore } from '../store/appStore';
import { METHOD_ORDER, METHOD_REGISTRY, methodLabel } from '../config/registry';
import { Button } from '../components/ui/Primitives';
import './control-bar.css';

export function ControlBar() {
  const input = useAppStore((s) => s.input);
  const method = useAppStore((s) => s.method);
  const setMethod = useAppStore((s) => s.setMethod);
  const methodsData = useAppStore((s) => s.methodsData);
  const compareMode = useAppStore((s) => s.compareMode);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const runRestore = useAppStore((s) => s.runRestore);
  const setInput = useAppStore((s) => s.setInput);
  const restoring = useAppStore((s) => s.restoring);
  const result = useAppStore((s) => s.result);

  if (!input) return null;

  const present = new Set((methodsData?.methods ?? []).map((m) => m.id));
  const ids = METHOD_ORDER.filter((id) => present.has(id));
  const sel = METHOD_REGISTRY[method];

  return (
    <div className="ctl">
      <div className="ctl__photo">
        <img className="ctl__thumb" src={input.previewUrl} alt="chosen photo" />
        <button className="ctl__change" onClick={() => setInput(null)} disabled={restoring}>
          ↻ Change photo
        </button>
      </div>

      <div className="ctl__method">
        <span className="ctl__label">Restorer</span>
        <div className="ctl__chips" role="radiogroup" aria-label="Restorer">
          {ids.map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={method === id}
              className={`ctl__chip ${method === id ? 'is-active' : ''}`}
              onClick={() => setMethod(id)}
              disabled={restoring}
            >
              <span className="ctl__chip-emoji" aria-hidden>
                {METHOD_REGISTRY[id].emoji}
              </span>
              {methodLabel(id)}
            </button>
          ))}
        </div>
        <span className="ctl__hint">
          {sel.tagline} · <span className="mono">{sel.stat}</span>
        </span>
      </div>

      <div className="ctl__go">
        <label className="ctl__compare">
          <input type="checkbox" checked={compareMode} onChange={toggleCompare} disabled={restoring} />
          Compare A/B
        </label>
        <Button variant="primary" className="ctl__restore" onClick={runRestore} disabled={restoring}>
          {restoring ? 'Restoring…' : result ? '↻ Restore again' : `${sel.emoji} Restore →`}
        </Button>
      </div>
    </div>
  );
}
