// ============================================================================
// Draggable before/after slider (pointer + touch). Uses clip-path on the
// "after" layer; the handle is keyboard-accessible (arrow keys). GPU-only.
// ============================================================================

import { useCallback, useId, useRef, useState } from 'react';
import './before-after.css';

interface Props {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfter({ before, after, beforeLabel = 'Before', afterLabel = 'After' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percent
  const dragging = useRef(false);
  const id = useId();

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4));
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4));
    if (e.key === 'Home') setPos(0);
    if (e.key === 'End') setPos(100);
  };

  return (
    <div
      className="ba"
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img className="ba__img" src={before} alt={beforeLabel} draggable={false} />
      <img
        className="ba__img ba__img--after"
        src={after}
        alt={afterLabel}
        draggable={false}
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />
      <span className="ba__tag ba__tag--l">{beforeLabel}</span>
      <span className="ba__tag ba__tag--r">{afterLabel}</span>

      <div className="ba__handle" style={{ left: `${pos}%` }}>
        <button
          className="ba__grip"
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-controls={id}
          onKeyDown={onKey}
        >
          <span className="ba__grip-arrows">⟨ ⟩</span>
        </button>
      </div>
    </div>
  );
}
