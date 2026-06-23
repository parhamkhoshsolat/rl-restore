// ============================================================================
// Input zone — tabbed: Upload (drag-drop) | Camera (file capture) | Examples
// (horizontal strip) | Damage simulator (mild/mod/severe via /api/simulate).
// Validates size/type against the API limits and surfaces recoverable errors.
// On success it sets the store's `input` and the page advances to the studio.
// ============================================================================

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { EXAMPLES, DAMAGED_EXAMPLES, PRISTINE_EXAMPLES, urlToBlob, type ExampleItem } from '../config/examples';
import { Pill, Segmented, Spinner } from '../components/ui/Primitives';
import { SimulatorPanel } from './SimulatorPanel';
import './input-zone.css';

type Tab = 'upload' | 'camera' | 'examples' | 'simulator';

const TABS: { value: Tab; label: string; emoji: string }[] = [
  { value: 'upload', label: 'Upload', emoji: '⬆' },
  { value: 'examples', label: 'Examples', emoji: '🖼' },
  { value: 'simulator', label: 'Damage simulator', emoji: '🧪' },
];

export function InputZone({ onReady }: { onReady: () => void }) {
  const limits = useAppStore((s) => s.methodsData?.limits);
  const setInput = useAppStore((s) => s.setInput);
  const [tab, setTab] = useState<Tab>('upload');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accept = 'image/png,image/jpeg,image/webp';
  const maxMb = limits?.max_upload_mb ?? 10;

  const validate = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) return 'That file is not an image. Try a PNG, JPEG, or WebP.';
      if (file.size > maxMb * 1024 * 1024)
        return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${maxMb} MB. Try a smaller one.`;
      return null;
    },
    [maxMb],
  );

  const acceptFile = useCallback(
    (file: File, origin: 'upload' | 'camera') => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setInput({ blob: file, previewUrl: url, name: file.name, origin });
      onReady();
    },
    [validate, setInput, onReady],
  );

  const useExample = useCallback(
    async (id: string) => {
      const ex = EXAMPLES.find((e) => e.id === id);
      if (!ex) return;
      setBusy(true);
      setError(null);
      try {
        const blob = await urlToBlob(ex.src);
        setInput({ blob, previewUrl: ex.src, name: `${ex.id}.jpg`, origin: 'example' });
        onReady();
      } catch {
        setError('Could not load that example. Try another.');
      } finally {
        setBusy(false);
      }
    },
    [setInput, onReady],
  );

  return (
    <section className="izone">
      <div className="izone__head">
        <h2 className="izone__title">Start with a photo</h2>
        <div className="izone__tabs">
          <Segmented<Tab>
            options={TABS.map((t) => ({
              value: t.value,
              label: (
                <span className="izone__tab">
                  <span aria-hidden>{t.emoji}</span>
                  {t.label}
                </span>
              ),
            }))}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setError(null);
            }}
            ariaLabel="Input source"
          />
        </div>
      </div>

      {error && (
        <div className="izone__error" role="alert">
          <span>⚠ {error}</span>
          <button className="izone__error-x" onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="izone__body">
        {tab === 'upload' && <UploadTab accept={accept} maxMb={maxMb} onFile={(f) => acceptFile(f, 'upload')} />}
        {tab === 'examples' && <ExamplesTab busy={busy} onPick={useExample} />}
        {tab === 'simulator' && <SimulatorPanel onReady={onReady} accept={accept} maxMb={maxMb} />}
      </div>
    </section>
  );
}

// --- Upload -----------------------------------------------------------------
function UploadTab({ accept, maxMb, onFile }: { accept: string; maxMb: number; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`drop ${drag ? 'is-drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className="drop__icon" aria-hidden>
        ⬆
      </div>
      <div className="drop__title">Drop a photo here, or click to browse</div>
      <div className="drop__hint">
        PNG · JPEG · WebP up to {maxMb} MB. Large images are auto-resized to 512&nbsp;px on the long edge.
      </div>
    </div>
  );
}

// --- Examples ---------------------------------------------------------------
function ExamplesTab({ busy, onPick }: { busy: boolean; onPick: (id: string) => void }) {
  return (
    <div className="examples">
      <div className="examples__lead">
        <span>
          <strong>Damaged</strong> photos restore right away; <strong>pristine</strong> ones are clean —
          send them straight through, or damage them in the simulator first.
        </span>
        {busy && <Spinner />}
      </div>
      <ExampleGroup title="Damaged — restore right away" items={DAMAGED_EXAMPLES} busy={busy} onPick={onPick} />
      <ExampleGroup title="Pristine — clean originals" items={PRISTINE_EXAMPLES} busy={busy} onPick={onPick} />
      <p className="examples__credit">Sample photos from the DIV2K (NTIRE) held-out test set, for demonstration.</p>
    </div>
  );
}

function ExampleGroup({
  title,
  items,
  busy,
  onPick,
}: {
  title: string;
  items: ExampleItem[];
  busy: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="examples__group">
      <div className="examples__group-title">{title}</div>
      <div className="examples__strip">
        {items.map((ex) => (
          <button key={ex.id} className="examples__item" onClick={() => onPick(ex.id)} disabled={busy}>
            <img src={ex.src} alt={ex.label} loading="lazy" />
            <div className="examples__meta">
              <span className="examples__label">{ex.label}</span>
              {ex.severity ? (
                <span className={`examples__sev examples__sev--${ex.severity}`}>{ex.severity}</span>
              ) : (
                <Pill>{ex.hint}</Pill>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
