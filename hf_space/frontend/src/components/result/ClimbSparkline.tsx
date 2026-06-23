// Quality climb sparkline — cumulative quality across steps, gradient stroke.
import { useId } from 'react';
import type { DisplayFrame } from '../../store/usePlayer';
import './sparkline.css';

export function ClimbSparkline({ frames }: { frames: DisplayFrame[] }) {
  const gid = useId().replace(/:/g, '');
  if (frames.length < 2) return null;
  const W = 320;
  const H = 84;
  const pad = 8;
  const qs = frames.map((f) => f.cumulativeQuality);
  const min = Math.min(...qs);
  const max = Math.max(...qs);
  const span = max - min || 1;
  const n = frames.length;

  const pts = frames.map((f, i) => {
    const x = pad + (i / (n - 1)) * (W - pad * 2);
    const y = H - pad - ((f.cumulativeQuality - min) / span) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[n - 1][0].toFixed(1)} ${H - pad} L${pts[0][0].toFixed(1)} ${H - pad} Z`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Quality climb across steps">
      <defs>
        <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent-a)" />
          <stop offset="1" stopColor="var(--success)" />
        </linearGradient>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(79,124,255,0.28)" />
          <stop offset="1" stopColor="rgba(79,124,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${gid})`} />
      <path d={line} fill="none" stroke={`url(#stroke-${gid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === n - 1 ? 4 : 2.5} fill={i === n - 1 ? 'var(--success)' : 'var(--accent-a)'} />
      ))}
    </svg>
  );
}
