// ============================================================================
// Damage simulator. Take a CLEAN photo (upload or example), pick a severity, and
// call /api/simulate to synthesize blur+noise+JPEG damage. Shows the clean ->
// degraded transition and the recipe, then loads the degraded image as the input
// (carrying the clean reference so the restore step can report TRUE PSNR).
// ============================================================================

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { postSimulate } from '../api/client';
import { isApiError } from '../api/client';
import { PRISTINE_EXAMPLES, urlToBlob } from '../config/examples';
import type { Severity, SimulateResponse } from '../api/types';
import { Button, Pill, Segmented, Spinner } from '../components/ui/Primitives';
import { fmtDb } from '../lib/format';
import './simulator.css';

const SEVERITIES: { value: Severity; label: string; sub: string }[] = [
  { value: 'mild', label: 'Mild', sub: 'light damage' },
  { value: 'moderate', label: 'Moderate', sub: 'visible damage' },
  { value: 'severe', label: 'Severe', sub: 'heavy damage' },
];

export function SimulatorPanel({
  onReady,
  accept,
  maxMb,
}: {
  onReady: () => void;
  accept: string;
  maxMb: number;
}) {
  const setInput = useAppStore((s) => s.setInput);
  const fileRef = useRef<HTMLInputElement>(null);

  const [cleanBlob, setCleanBlob] = useState<Blob | null>(null);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [sim, setSim] = useState<SimulateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('That file is not an image.');
        return;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`That image exceeds the ${maxMb} MB limit.`);
        return;
      }
      setError(null);
      setSim(null);
      setCleanBlob(file);
      setCleanUrl(URL.createObjectURL(file));
    },
    [maxMb],
  );

  const pickExample = useCallback(async (id: string) => {
    const ex = PRISTINE_EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setError(null);
    setSim(null);
    const blob = await urlToBlob(ex.src);
    setCleanBlob(blob);
    setCleanUrl(ex.src);
  }, []);

  const runSim = useCallback(async () => {
    if (!cleanBlob) return;
    setBusy(true);
    setError(null);
    try {
      const res = await postSimulate(cleanBlob, severity, { thenRestore: false });
      setSim(res);
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Simulation failed. Try again.');
    } finally {
      setBusy(false);
    }
  }, [cleanBlob, severity]);

  const useDegraded = useCallback(async () => {
    if (!sim) return;
    const degBlob = await urlToBlob(sim.degraded);
    const refBlob = await urlToBlob(sim.clean);
    setInput({
      blob: degBlob,
      previewUrl: sim.degraded,
      name: `simulated-${sim.severity}.png`,
      origin: 'simulator',
      reference: refBlob,
      sim,
    });
    onReady();
  }, [sim, setInput, onReady]);

  return (
    <div className="sim">
      <p className="sim__lead">
        Start from a clean photo and apply realistic damage — Gaussian blur, sensor noise, and JPEG
        compression — so you can watch the agent undo a known problem. Because we keep the clean original,
        the gauge shows <strong>true PSNR</strong>, not an estimate.
      </p>

      {!cleanUrl && (
        <div className="sim__source">
          <button className="sim__pick" onClick={() => fileRef.current?.click()}>
            <span aria-hidden>⬆</span> Upload a clean photo
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              hidden
              onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
            />
          </button>
          <span className="sim__or">or pick an example</span>
          <div className="sim__examples">
            {PRISTINE_EXAMPLES.map((ex) => (
              <button key={ex.id} className="sim__ex" onClick={() => pickExample(ex.id)} title={ex.label}>
                <img src={ex.src} alt={ex.label} />
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="sim__error" role="alert">
          ⚠ {error}
        </div>
      )}

      {cleanUrl && (
        <div className="sim__stage">
          <div className="sim__controls">
            <div className="sim__sev">
              <span className="sim__sev-label">Damage level</span>
              <Segmented<Severity>
                options={SEVERITIES.map((s) => ({
                  value: s.value,
                  label: (
                    <span className="sim__sev-opt">
                      {s.label}
                      <small>{s.sub}</small>
                    </span>
                  ),
                }))}
                value={severity}
                onChange={(v) => {
                  setSeverity(v);
                  setSim(null);
                }}
                ariaLabel="Damage severity"
              />
            </div>
            <div className="sim__actions">
              <Button variant="ghost" onClick={() => { setCleanUrl(null); setCleanBlob(null); setSim(null); }}>
                Change photo
              </Button>
              <Button variant="primary" onClick={runSim} disabled={busy}>
                {busy ? <Spinner /> : '🧪'} Apply {severity} damage
              </Button>
            </div>
          </div>

          <div className="sim__compare">
            <figure className="sim__frame">
              <img src={cleanUrl} alt="clean" />
              <figcaption>
                <Pill tone="success">clean</Pill>
              </figcaption>
            </figure>
            <div className="sim__arrow" aria-hidden>
              →
            </div>
            <figure className={`sim__frame ${busy ? 'is-busy' : ''}`}>
              {sim ? (
                <img src={sim.degraded} alt="degraded" />
              ) : (
                <div className="sim__placeholder">
                  {busy ? (
                    <>
                      <div className="sim__shimmer" />
                      <span>applying damage…</span>
                    </>
                  ) : (
                    <span>degraded preview</span>
                  )}
                </div>
              )}
              <figcaption>
                <Pill tone="warn">degraded</Pill>
                {sim && <span className="sim__psnr mono">PSNR {fmtDb(sim.psnr_degraded_vs_clean)} dB</span>}
              </figcaption>
            </figure>
          </div>

          {sim && (
            <div className="sim__result">
              <div className="sim__recipe">
                <RecipeStat label="Blur σ" value={sim.recipe.blur_sigma.toFixed(2)} />
                <RecipeStat label="Noise σ" value={sim.recipe.noise_sigma.toFixed(1)} />
                <RecipeStat label="JPEG q" value={String(sim.recipe.jpeg_quality)} />
                <RecipeStat label="seed" value={String(sim.seed)} mono />
              </div>
              <Button variant="primary" className="sim__use" onClick={useDegraded}>
                Restore this damaged photo →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecipeStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="sim__recipe-stat">
      <span className={`sim__recipe-val ${mono ? 'mono' : 'mono'}`}>{value}</span>
      <span className="sim__recipe-lab">{label}</span>
    </div>
  );
}
