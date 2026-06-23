// ============================================================================
// Transport / player for the step-by-step hero. Holds a fractional `position`
// over the visible frames so the SCRUBBER can cross-fade (state interpolation,
// NOT video). play/pause auto-advances; speed scales the per-step dwell time.
// STOP frames (image === null) are folded into the previous frame for display.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RestoreResponse, RestoreStep } from '../api/types';
import { prefersReducedMotion } from '../lib/format';

export interface DisplayFrame {
  /** the step this frame represents (STOP folds onto previous image) */
  step: RestoreStep;
  /** resolved image to show (STOP reuses previous frame's image) */
  image: string;
  cumulativeQuality: number;
  delta: number;
  isStop: boolean;
  nodeLabel: string;
}

export type Speed = 0.5 | 1 | 2;

const BASE_DWELL_MS = 1400; // time a step holds before auto-advancing at 1x

export function buildFrames(result: RestoreResponse | null): DisplayFrame[] {
  if (!result) return [];
  const frames: DisplayFrame[] = [];
  let lastImage = '';
  for (const step of result.steps) {
    const isStop = step.image === null;
    const image = step.image ?? lastImage;
    if (step.image) lastImage = step.image;
    frames.push({
      step,
      image,
      cumulativeQuality: step.quality,
      delta: step.quality_delta,
      isStop,
      nodeLabel: step.label,
    });
  }
  return frames;
}

export interface PlayerApi {
  frames: DisplayFrame[];
  /** integer index of the frame the UI treats as "current" (rounded position) */
  index: number;
  /** continuous position in [0, frames.length-1] for scrub cross-fades */
  position: number;
  playing: boolean;
  speed: Speed;
  qMin: number;
  qMax: number;
  reducedMotion: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (pos: number) => void; // fractional
  seekStep: (i: number) => void; // snap to integer step
  setSpeed: (s: Speed) => void;
  replay: () => void;
}

export function usePlayer(result: RestoreResponse | null): PlayerApi {
  const frames = useMemo(() => buildFrames(result), [result]);
  const reducedMotion = prefersReducedMotion();

  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const maxIndex = Math.max(0, frames.length - 1);
  const index = Math.round(position);

  const qMin = frames.length ? Math.min(...frames.map((f) => f.cumulativeQuality)) : 0;
  const qMax = frames.length ? Math.max(...frames.map((f) => f.cumulativeQuality)) : 1;

  // reset when a new result arrives
  useEffect(() => {
    setPosition(0);
    setPlaying(false);
  }, [result]);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  // animation loop — advances `position` toward the next frame, dwelling at each
  useEffect(() => {
    if (!playing || frames.length < 2) {
      stop();
      return;
    }
    const dwell = BASE_DWELL_MS / speed;
    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setPosition((p) => {
        const advance = dt / dwell; // frames-per-ms * ms
        const np = p + advance;
        if (np >= maxIndex) {
          setPlaying(false);
          return maxIndex;
        }
        return np;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return stop;
  }, [playing, speed, frames.length, maxIndex, stop]);

  const play = useCallback(() => {
    if (frames.length < 2) return;
    setPosition((p) => (p >= maxIndex ? 0 : p)); // replay if at end
    setPlaying(true);
  }, [frames.length, maxIndex]);

  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? setPlaying(false) : play()), [playing, play]);

  const next = useCallback(() => {
    setPlaying(false);
    setPosition((p) => Math.min(maxIndex, Math.floor(p + 1)));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setPlaying(false);
    setPosition((p) => Math.max(0, Math.ceil(p - 1)));
  }, []);

  const seek = useCallback(
    (pos: number) => {
      setPlaying(false);
      setPosition(Math.max(0, Math.min(maxIndex, pos)));
    },
    [maxIndex],
  );

  const seekStep = useCallback(
    (i: number) => {
      setPlaying(false);
      setPosition(Math.max(0, Math.min(maxIndex, i)));
    },
    [maxIndex],
  );

  const replay = useCallback(() => {
    setPosition(0);
    requestAnimationFrame(() => play());
  }, [play]);

  return {
    frames,
    index,
    position,
    playing,
    speed,
    qMin,
    qMax,
    reducedMotion,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    seekStep,
    setSpeed,
    replay,
  };
}
