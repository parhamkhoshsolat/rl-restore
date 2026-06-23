// ============================================================================
// App shell + flow. Single-page progressive on desktop: landing -> (method
// picker + input + studio) stacked in one scroll. Mobile is the same vertical
// stack with a sticky bottom CTA. Warmup splash gates on /api/health.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store/appStore';
import { useTheme } from './lib/useTheme';
import { Header } from './components/shell/Header';
import { WarmupSplash } from './components/shell/WarmupSplash';
import { Landing } from './screens/Landing';
import { ControlBar } from './screens/ControlBar';
import { InputZone } from './screens/InputZone';
import { Studio } from './screens/Studio';
import { Button } from './components/ui/Primitives';
import './styles/app.css';

export function App() {
  const [warm, setWarm] = useState(false);
  const { theme, toggle } = useTheme();

  const stage = useAppStore((s) => s.stage);
  const setStage = useAppStore((s) => s.setStage);
  const loadMethods = useAppStore((s) => s.loadMethods);
  const methodsError = useAppStore((s) => s.methodsError);
  const input = useAppStore((s) => s.input);
  const result = useAppStore((s) => s.result);
  const reset = useAppStore((s) => s.reset);

  const studioRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (warm) loadMethods();
  }, [warm, loadMethods]);

  const goStudio = () => {
    setStage('studio');
    requestAnimationFrame(() =>
      setTimeout(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60),
    );
  };

  const onReady = () => {
    requestAnimationFrame(() =>
      setTimeout(() => studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60),
    );
  };

  const goHome = () => {
    reset();
    setStage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {!warm && <WarmupSplash onReady={() => setWarm(true)} />}
      <Header theme={theme} onToggleTheme={toggle} onHome={goHome} />

      <main className="app">
        {stage === 'landing' && <Landing onStart={goStudio} />}

        {stage === 'studio' && (
          <div className="app__studio-flow">
            <div className="app__crumbs">
              <button onClick={goHome}>← Home</button>
              <span className="app__crumbs-sep">/</span>
              <span>Restore studio</span>
            </div>

            {!input ? (
              <div ref={inputRef} className="app__section">
                <InputZone onReady={onReady} />
              </div>
            ) : (
              <>
                <div ref={studioRef} className="app__section">
                  <ControlBar />
                </div>
                <div className="app__section">
                  <Studio />
                </div>
              </>
            )}

            {methodsError && (
              <div className="app__banner" role="alert">
                Couldn't reach the server ({methodsError.message}). You can still explore the demo with
                sample data.
              </div>
            )}
          </div>
        )}
      </main>

      {/* sticky bottom CTA on mobile */}
      {stage === 'landing' && (
        <div className="app__sticky-cta">
          <Button variant="primary" onClick={goStudio}>
            Restore a photo →
          </Button>
        </div>
      )}
      {stage === 'studio' && input && !result && (
        <div className="app__sticky-cta">
          <Button variant="primary" onClick={() => useAppStore.getState().runRestore()}>
            Restore now →
          </Button>
        </div>
      )}

      <footer className="app__footer">
        <span>RL-Restore — a course demo of explainable, tool-by-tool image restoration.</span>
        <span className="app__footer-dim">
          Agent +2.93 · fine-tuned +3.67 · HQ Restore +4.15 · Monolith +4.03 dB on DIV2K test · Enhance is
          generative (Real-ESRGAN 4×) — synthesized detail, no PSNR.
        </span>
      </footer>
    </>
  );
}
