// ============================================================================
// Methods registry + tool glosses. Display copy uses the project's REAL measured
// numbers exclusively, and is honest about the central finding: the agent is the
// most EXPLAINABLE restorer, not the strongest; the generative finisher is the
// visible "wow". Numbers here must match the backend catalogue (routes.py).
// ============================================================================

import type { MethodId, Severity } from '../api/types';

export interface MethodUI {
  id: MethodId;
  emoji: string;
  /** short tagline shown on the picker card */
  tagline: string;
  /** one-line "what it is" gloss */
  blurb: string;
  /** headline stat shown big on the card */
  stat: string;
  statSub: string;
  kindLabel: string;
  accent?: 'accent' | 'success' | 'warn';
}

/** Registry keyed by method id. The API tells us which exist; this adds UI. */
export const METHOD_REGISTRY: Record<MethodId, MethodUI> = {
  agent: {
    id: 'agent',
    emoji: '🧠',
    tagline: 'Most explainable',
    blurb: 'Picks named tools one at a time and shows every move. The softest result — but you see exactly why.',
    stat: '+2.93 dB',
    statSub: 'avg PSNR gain · up to 3 steps',
    kindLabel: 'Sequential · explainable',
    accent: 'accent',
  },
  agent_ft: {
    id: 'agent_ft',
    emoji: '🔧',
    tagline: 'Explainable, tuned',
    blurb: 'The agent with its 12 tools jointly fine-tuned (the paper’s Algorithm 1). A real step up — still soft by design.',
    stat: '+3.67 dB',
    statSub: 'avg PSNR gain · up to 3 steps',
    kindLabel: 'Sequential · fine-tuned',
    accent: 'accent',
  },
  unet_hq: {
    id: 'unet_hq',
    emoji: '💎',
    tagline: 'Highest quality',
    blurb: 'A bigger U-Net trained with an L1 objective — the “improve on the paper” upgrade. Cleaner, still a touch soft.',
    stat: '+4.15 dB',
    statSub: 'avg PSNR gain · single pass',
    kindLabel: 'Single pass · upgrade',
    accent: 'success',
  },
  monolith: {
    id: 'monolith',
    emoji: '⚡',
    tagline: 'Highest PSNR',
    blurb: 'One big CNN in a single pass. Strong but silent — no steps to read.',
    stat: '+4.03 dB',
    statSub: 'avg PSNR gain · single pass',
    kindLabel: 'Single pass · baseline',
    accent: 'success',
  },
};

/** Order to show methods in (only those present in the API are rendered). */
export const METHOD_ORDER: MethodId[] = ['agent', 'agent_ft', 'unet_hq', 'monolith'];

/** Two honest families for the compact rail picker (4 options, 2 ideas). */
export interface MethodFamily {
  label: string;
  hint: string;
  ids: MethodId[];
}
export const METHOD_FAMILIES: MethodFamily[] = [
  { label: 'Explainable', hint: 'shows its work', ids: ['agent', 'agent_ft'] },
  { label: 'Single-pass', hint: 'one shot, silent', ids: ['unet_hq', 'monolith'] },
];

/** The default method on load — the explainable star; its soft result sets up Enhance. */
export const DEFAULT_METHOD: MethodId = 'agent';

/** The generative finisher (not a MethodId — a post-restore enhance step). */
export const ENHANCE_UI = {
  emoji: '🔍',
  name: 'Enhance & Upscale 4×',
  tagline: 'generative finisher',
  promise: 'A generative model (Real-ESRGAN) resolves real detail and upscales 4×.',
  honesty: 'Synthesized detail, not ground truth — so no PSNR. Up to ~30s on CPU.',
};

/** Display name for a method id — picker, studio, and results all use this. */
const METHOD_LABELS: Record<MethodId, string> = {
  agent: 'Agent',
  agent_ft: 'Agent (fine-tuned)',
  monolith: 'Monolith',
  unet_hq: 'HQ Restore',
};
export function methodLabel(id: MethodId): string {
  return METHOD_LABELS[id] ?? id;
}

/** Sequential (agentic) methods roll out step-by-step; the rest are single pass. */
export function isSequentialMethod(id: MethodId): boolean {
  return id === 'agent' || id === 'agent_ft';
}

// --- real measured gains (reports/eval_test, DIV2K held-out test) ------------
export const AGENT_GAIN_BY_SEVERITY: Record<Severity, number> = {
  mild: 2.24,
  moderate: 2.83,
  severe: 3.71,
};
export const AGENT_GAIN_OVERALL = 2.93;
export const AGENT_FT_GAIN_OVERALL = 3.67;
export const UNET_HQ_GAIN_OVERALL = 4.15;
export const MONOLITH_GAIN_OVERALL = 4.03;
export const ORACLE_CEILING = 3.24; // B4 oracle-with-stop

// --- tool-kind UI -----------------------------------------------------------
export interface ToolKindUI {
  label: string;
  emoji: string;
  color: string; // CSS var
  verb: string;
}
export const TOOL_KIND_UI: Record<string, ToolKindUI> = {
  blur: { label: 'Deblur', emoji: '🔬', color: 'var(--accent-a)', verb: 'sharpens' },
  noise: { label: 'Denoise', emoji: '🧹', color: 'var(--accent-b)', verb: 'cleans grain from' },
  jpeg: { label: 'De-JPEG', emoji: '🧩', color: 'var(--success)', verb: 'removes blocking from' },
};

/**
 * Plain-English gloss for a tool, given its emitted name like "denoise2 (12.5-25)".
 * Returns a teacher-friendly sentence the presenter can read aloud.
 */
export function glossForTool(actionName: string, kind?: string): string {
  const k = kind ?? inferKind(actionName);
  const band = bandFromName(actionName);
  switch (k) {
    case 'blur':
      return `Sharpening — reverses Gaussian blur in the σ ${band} band.`;
    case 'noise':
      return `Denoising — removes sensor/Gaussian noise around σ ${band}.`;
    case 'jpeg':
      return `De-blocking — repairs JPEG compression for quality ${band}.`;
    default:
      return actionName;
  }
}

export function inferKind(name: string): string {
  if (name.startsWith('deblur')) return 'blur';
  if (name.startsWith('denoise')) return 'noise';
  if (name.startsWith('dejpeg')) return 'jpeg';
  return 'blur';
}

export function bandFromName(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return m ? m[1] : '';
}

/** Short pretty name, e.g. "denoise2 (12.5-25)" -> "Denoise · 12.5-25". */
export function prettyToolName(actionName: string): string {
  if (actionName === 'STOP') return 'STOP';
  if (actionName === 'monolith') return 'Monolith CNN';
  if (actionName === 'input') return 'Degraded input';
  const kind = inferKind(actionName);
  const ui = TOOL_KIND_UI[kind];
  const band = bandFromName(actionName);
  const idx = actionName.match(/(\d)/)?.[1] ?? '';
  return `${ui?.label ?? actionName} ${idx}${band ? ` · ${band}` : ''}`;
}
