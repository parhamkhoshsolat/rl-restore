// ============================================================================
// Landing / hero. Headline + subhead + CTA, a LOOPING pre-baked restoration
// animation (replays a bundled sample chain via the player engine), and a
// "How it works" 3-step strip. Honest positioning: legibility, not peak PSNR.
// ============================================================================

import { useEffect } from 'react';
import { MOCK_HERO_CHAIN } from '../api/mock';
import { usePlayer } from '../store/usePlayer';
import { ImageCanvas } from '../components/hero/ImageCanvas';
import { Stepper } from '../components/hero/Stepper';
import { Button, Pill } from '../components/ui/Primitives';
import { AGENT_GAIN_OVERALL, MONOLITH_GAIN_OVERALL, ORACLE_CEILING } from '../config/registry';
import './landing.css';

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Pick a photo',
    body: 'Upload, snap a camera shot, choose an example, or synthesize damage with the simulator.',
    emoji: '🖼️',
  },
  {
    n: '02',
    title: 'The agent reasons',
    body: 'It inspects the damage and applies named tools one at a time — deblur, denoise, de-JPEG.',
    emoji: '🧠',
  },
  {
    n: '03',
    title: 'Watch quality climb',
    body: 'Every step shows its tool, its plain-English reason, and the dB it added. Then it knows when to stop.',
    emoji: '📈',
  },
  {
    n: '04',
    title: 'Make it crisp (optional)',
    body: 'Run the generative Enhance finisher — it upscales 4× and synthesizes real detail the restorers can only blur.',
    emoji: '🔍',
  },
];

export function Landing({ onStart }: { onStart: () => void }) {
  const player = usePlayer(MOCK_HERO_CHAIN);

  // auto-loop the hero animation
  useEffect(() => {
    const start = setTimeout(() => player.play(), 600);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!player.playing && player.index >= player.frames.length - 1 && player.frames.length > 1) {
      const t = setTimeout(() => player.replay(), 1600);
      return () => clearTimeout(t);
    }
  }, [player]);

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__copy">
          <Pill tone="accent">🧠 explainable image restoration</Pill>
          <h1 className="landing__headline">
            Watch an AI repair a photo,
            <br />
            <span className="landing__headline-accent">one decision at a time.</span>
          </h1>
          <p className="landing__sub">
            Most restorers hand you a fixed image and a shrug. This agent shows its work — choosing one
            named tool per step while the quality meter climbs. Honest by design: the monolith baseline
            scores higher on raw PSNR, but it can't tell you <em>why</em>.
          </p>
          <div className="landing__cta-row">
            <Button variant="primary" className="landing__cta" onClick={onStart}>
              Restore a photo →
            </Button>
            <div className="landing__stats">
              <Stat label="Agent" value={`+${AGENT_GAIN_OVERALL.toFixed(2)} dB`} tone="accent" />
              <Stat label="Monolith" value={`+${MONOLITH_GAIN_OVERALL.toFixed(2)} dB`} tone="success" />
              <Stat label="Oracle ceiling" value={`+${ORACLE_CEILING.toFixed(2)} dB`} tone="muted" />
            </div>
          </div>
        </div>

        <div className="landing__demo">
          <ImageCanvas
            frames={player.frames}
            position={player.position}
            reducedMotion={player.reducedMotion}
          />
          <Stepper frames={player.frames} position={player.position} onSeekStep={player.seekStep} />
          <div className="landing__demo-cap">
            <span className="landing__demo-live">
              <i /> live preview
            </span>
            a real agent rollout on a moderate-damage photo
          </div>
        </div>
      </section>

      <section className="landing__how">
        <h2 className="landing__how-title">How it works</h2>
        <div className="landing__steps">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="landing__step">
              <div className="landing__step-top">
                <span className="landing__step-emoji">{s.emoji}</span>
                <span className="landing__step-n mono">{s.n}</span>
              </div>
              <h3 className="landing__step-title">{s.title}</h3>
              <p className="landing__step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'accent' | 'success' | 'muted' }) {
  return (
    <div className={`landing__stat landing__stat--${tone}`}>
      <span className="landing__stat-val mono">{value}</span>
      <span className="landing__stat-lab">{label}</span>
    </div>
  );
}
