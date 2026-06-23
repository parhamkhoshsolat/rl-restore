// ============================================================================
// Transport controls: play/pause, step <<|>>, a SCRUBBER (range input over the
// fractional position -> cross-fade), speed 0.5/1/2x, replay. 44px+ targets.
// ============================================================================

import type { PlayerApi, Speed } from '../../store/usePlayer';
import { Button, Segmented } from '../ui/Primitives';
import './transport.css';

const SPEEDS: { value: string; label: string }[] = [
  { value: '0.5', label: '0.5×' },
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
];

export function Transport({ player }: { player: PlayerApi }) {
  const { frames, position, playing, speed } = player;
  const maxIndex = Math.max(1, frames.length - 1);
  const atEnd = position >= maxIndex - 0.001;

  if (frames.length < 2) return null;

  return (
    <div className="transport">
      <div className="transport__buttons">
        <Button
          variant="icon"
          onClick={player.prev}
          disabled={position <= 0.001}
          aria-label="Previous step"
          title="Previous step"
        >
          ◀◀
        </Button>
        <Button
          variant="primary"
          className="transport__play"
          onClick={atEnd && !playing ? player.replay : player.toggle}
          aria-label={playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        >
          {playing ? '❚❚' : atEnd ? '↻' : '▶'}
          <span className="transport__play-label">{playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}</span>
        </Button>
        <Button variant="icon" onClick={player.next} disabled={atEnd} aria-label="Next step" title="Next step">
          ▶▶
        </Button>
      </div>

      <input
        className="transport__scrubber"
        type="range"
        min={0}
        max={maxIndex}
        step={0.01}
        value={position}
        onChange={(e) => player.seek(Number(e.target.value))}
        aria-label="Scrub steps"
        style={{ ['--pct' as string]: `${(position / maxIndex) * 100}%` }}
      />

      <Segmented<string>
        options={SPEEDS}
        value={String(speed)}
        onChange={(v) => player.setSpeed(Number(v) as Speed)}
        size="sm"
        ariaLabel="Playback speed"
      />
    </div>
  );
}
