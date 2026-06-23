// ============================================================================
// Cold-start "Warming up…" splash, gated on /api/health. Polls until the models
// report loaded (or we are in mock mode). Dismisses with a fade.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { getHealth } from '../../api/client';
import './warmup.css';

export function WarmupSplash({ onReady }: { onReady: () => void }) {
  const [ready, setReady] = useState(false);
  const [dots, setDots] = useState(0);
  const tries = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const h = await getHealth();
        tries.current += 1;
        if (cancelled) return;
        if (h.status === 'ok' && (h.models_loaded ?? true)) {
          setReady(true);
          setTimeout(onReady, 480);
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!cancelled) {
        // give up gating after ~12s so we never trap the user behind the splash
        if (tries.current > 8) {
          setReady(true);
          setTimeout(onReady, 300);
          return;
        }
        setTimeout(poll, 1400);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 420);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`warmup ${ready ? 'is-ready' : ''}`} role="status" aria-live="polite">
      <div className="warmup__inner">
        <div className="warmup__orb">
          <span className="warmup__orb-ring" />
          <span className="warmup__orb-core" />
        </div>
        <div className="warmup__title">Warming up the restoration models{'.'.repeat(dots)}</div>
        <div className="warmup__sub">Loading the agent, its 12 tools, and the monolith baseline on CPU.</div>
      </div>
    </div>
  );
}
