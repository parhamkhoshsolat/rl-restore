// ============================================================================
// Magnifier loupe — hover/drag a circular lens that shows the image at native
// zoom. Essential for the 4x enhance: a big upscale shrunk to fit a canvas hides
// the very detail it adds; the loupe surfaces real pixels. Pointer + touch.
// ============================================================================

import { useRef, useState } from 'react';
import './loupe.css';

interface LensState {
  x: number;
  y: number;
  bx: number;
  by: number;
  bw: number;
  bh: number;
  show: boolean;
}
const HIDDEN: LensState = { x: 0, y: 0, bx: 0, by: 0, bw: 0, bh: 0, show: false };

export function LoupeImage({ src, zoom = 2.6, size = 158 }: { src: string; zoom?: number; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<LensState>(HIDDEN);

  const update = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      setLens(HIDDEN);
      return;
    }
    const bw = r.width * zoom;
    const bh = r.height * zoom;
    setLens({ x, y, bw, bh, bx: size / 2 - x * zoom, by: size / 2 - y * zoom, show: true });
  };

  return (
    <div
      className="loupe"
      ref={ref}
      onPointerMove={(e) => update(e.clientX, e.clientY)}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerLeave={() => setLens(HIDDEN)}
      onPointerUp={() => setLens(HIDDEN)}
    >
      <img className="loupe__img" src={src} alt="Enhanced result — drag to magnify" draggable={false} />
      {lens.show && (
        <span
          className="loupe__lens"
          style={{
            left: lens.x - size / 2,
            top: lens.y - size / 2,
            width: size,
            height: size,
            backgroundImage: `url(${src})`,
            backgroundSize: `${lens.bw}px ${lens.bh}px`,
            backgroundPosition: `${lens.bx}px ${lens.by}px`,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
