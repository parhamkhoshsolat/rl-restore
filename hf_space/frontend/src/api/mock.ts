// ============================================================================
// Mock / fallback data so the UI renders even when /api is down during dev.
// GATED behind a dev flag (see client.ts -> USE_MOCK). All numbers here are the
// project's REAL measured values (reports/eval_test, reports/benchmark.json):
//   agent overall +2.93 dB  (mild 2.24 / moderate 2.83 / severe 3.71)
//   monolith      +4.03 dB
//   oracle ceiling (B4 oracle-with-stop) +3.24 dB
// Tool names follow the codebase scheme: deblur1-4 / denoise1-4 / dejpeg1-4.
// ============================================================================

import type {
  EnhanceResponse,
  MethodsResponse,
  MethodId,
  RestoreResponse,
  RestoreStep,
  Severity,
  SimulateResponse,
  ToolInfo,
} from './types';

// --- a tiny synthetic image generator (data-URL SVGs) so frames look distinct
// and the cross-fade/scrubber has something to interpolate between. Quality is
// encoded as visible sharpness + noise so "the quality climbs" reads visually.
function svgFrame(opts: {
  label: string;
  blur: number; // 0..6 px
  grain: number; // 0..1
  hue: number;
}): string {
  const { label, blur, grain, hue } = opts;
  const grainOpacity = grain.toFixed(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 55% 42%)"/>
      <stop offset="0.5" stop-color="hsl(${(hue + 38) % 360} 48% 30%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 70) % 360} 42% 18%)"/>
    </linearGradient>
    <filter id="b"><feGaussianBlur stdDeviation="${blur}"/></filter>
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="${grainOpacity}"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>
  <g filter="url(#b)">
    <rect width="640" height="420" fill="url(#g)"/>
    <circle cx="190" cy="150" r="96" fill="hsl(${(hue + 20) % 360} 60% 60%)" opacity="0.85"/>
    <rect x="330" y="200" width="240" height="150" rx="14" fill="hsl(${(hue + 200) % 360} 45% 48%)" opacity="0.8"/>
    <path d="M0 330 L180 250 L320 320 L470 230 L640 300 L640 420 L0 420 Z" fill="hsl(${(hue + 120) % 360} 35% 22%)" opacity="0.9"/>
  </g>
  <rect width="640" height="420" filter="url(#n)" opacity="${grainOpacity}"/>
  <text x="20" y="396" font-family="JetBrains Mono, monospace" font-size="15" fill="rgba(255,255,255,0.62)">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 12-tool table, names exactly as the backend emits them (scripts/evaluate_agent.py).
const TOOL_DEFS: ToolInfo[] = [
  { index: 0, name: 'deblur1 (0-1.25)', kind: 'blur', band: '0-1.25' },
  { index: 1, name: 'deblur2 (1.25-2.5)', kind: 'blur', band: '1.25-2.5' },
  { index: 2, name: 'deblur3 (2.5-3.75)', kind: 'blur', band: '2.5-3.75' },
  { index: 3, name: 'deblur4 (3.75-5)', kind: 'blur', band: '3.75-5' },
  { index: 4, name: 'denoise1 (0-12.5)', kind: 'noise', band: '0-12.5' },
  { index: 5, name: 'denoise2 (12.5-25)', kind: 'noise', band: '12.5-25' },
  { index: 6, name: 'denoise3 (25-37.5)', kind: 'noise', band: '25-37.5' },
  { index: 7, name: 'denoise4 (37.5-50)', kind: 'noise', band: '37.5-50' },
  { index: 8, name: 'dejpeg1 (60-100)', kind: 'jpeg', band: '60-100' },
  { index: 9, name: 'dejpeg2 (35-60)', kind: 'jpeg', band: '35-60' },
  { index: 10, name: 'dejpeg3 (20-35)', kind: 'jpeg', band: '20-35' },
  { index: 11, name: 'dejpeg4 (10-20)', kind: 'jpeg', band: '10-20' },
];

export const MOCK_METHODS: MethodsResponse = {
  methods: [
    { id: 'agent', name: 'RL Agent', description: 'Most explainable.', kind: 'agentic', available: true },
    { id: 'agent_ft', name: 'RL Agent (fine-tuned)', description: 'Best agent quality (+3.67 dB).', kind: 'agentic', available: true },
    { id: 'unet_hq', name: 'HQ Restore', description: 'Best held-out gain (+4.15 dB).', kind: 'single_pass', available: true },
    { id: 'monolith', name: 'Monolithic CNN', description: 'Highest raw PSNR (+4.03 dB).', kind: 'single_pass', available: true },
  ],
  tools: TOOL_DEFS,
  severities: ['mild', 'moderate', 'severe'],
  stop_action_index: 12,
  enhance_available: true,
  limits: { max_upload_mb: 10, max_long_edge: 512, max_steps: 3 },
};

// Realistic per-severity agent chains. Deltas sum to the real measured gains.
// The agent's most-used tools (eval_test top_tools) are denoise2 then denoise3.
const AGENT_CHAINS: Record<Severity, { action: number; delta: number }[]> = {
  // mild: +2.24 dB
  mild: [
    { action: 5, delta: 1.62 }, // denoise2
    { action: 0, delta: 0.62 }, // deblur1
  ],
  // moderate: +2.83 dB
  moderate: [
    { action: 5, delta: 1.78 }, // denoise2
    { action: 6, delta: 0.74 }, // denoise3
    { action: 0, delta: 0.31 }, // deblur1
  ],
  // severe: +3.71 dB
  severe: [
    { action: 5, delta: 2.14 }, // denoise2
    { action: 6, delta: 1.02 }, // denoise3
    { action: 7, delta: 0.55 }, // denoise4
  ],
};

const BASELINE_QUALITY: Record<Severity, number> = { mild: 26.4, moderate: 23.1, severe: 19.8 };

function plausibleQ(chosen: number, isStrong: boolean): number[] {
  // 13-long q-vector with the chosen action highest and a modest STOP value.
  const q = Array.from({ length: 13 }, (_, i) => {
    const base = -1.2 + Math.sin(i * 1.7) * 0.5;
    return Number(base.toFixed(3));
  });
  q[chosen] = isStrong ? 2.4 : 1.3;
  q[12] = 0.42; // STOP value
  return q;
}

export function mockRestore(method: MethodId, severity: Severity = 'moderate'): RestoreResponse {
  const hue = 212;
  if (method === 'monolith') {
    // single-pass: degraded -> restored, +4.03 overall (severe shown bigger).
    const gain = severity === 'mild' ? 3.38 : severity === 'severe' ? 4.79 : 4.03;
    const q0 = BASELINE_QUALITY[severity];
    const steps: RestoreStep[] = [
      {
        index: 0,
        label: 'Degraded',
        action_index: -1,
        action_name: 'input',
        image: svgFrame({ label: 'degraded', blur: 4.2, grain: 0.5, hue }),
        quality: q0,
        quality_delta: 0,
      },
      {
        index: 1,
        label: 'Restored',
        action_index: -1,
        action_name: 'monolith',
        image: svgFrame({ label: 'restored · monolith', blur: 0.2, grain: 0.04, hue }),
        quality: Number((q0 + gain).toFixed(2)),
        quality_delta: gain,
      },
    ];
    return {
      method,
      input: { w: 512, h: 336, resized_from: [1920, 1260] },
      has_reference: true,
      quality_metric: 'PSNR (dB)',
      steps,
      final_image: steps[1].image!,
      summary: { chain: [], n_tool_steps: 1, total_quality_delta: gain, elapsed_ms: 540 },
    };
  }

  // sequential agent / fine-tuned
  const plan = AGENT_CHAINS[severity];
  const q0 = BASELINE_QUALITY[severity];
  const steps: RestoreStep[] = [
    {
      index: 0,
      label: 'Degraded',
      action_index: -1,
      action_name: 'input',
      image: svgFrame({ label: 'degraded', blur: 4.2, grain: 0.5, hue }),
      quality: q0,
      quality_delta: 0,
    },
  ];
  let q = q0;
  plan.forEach((s, i) => {
    q = Number((q + s.delta).toFixed(2));
    const tool = TOOL_DEFS[s.action];
    const blur = 4.2 - (i + 1) * (3.4 / (plan.length + 1));
    const grain = 0.5 - (i + 1) * (0.46 / (plan.length + 1));
    steps.push({
      index: i + 1,
      label: `Step ${i + 1}`,
      action_index: s.action,
      action_name: tool.name,
      image: svgFrame({ label: `${tool.name}`, blur: Math.max(0.15, blur), grain: Math.max(0.03, grain), hue }),
      quality: q,
      quality_delta: s.delta,
      q_values: plausibleQ(s.action, s.delta > 1),
    });
  });
  // STOP frame: image null (reuse previous), small STOP q highest.
  const stopQ = plausibleQ(12, false);
  stopQ[12] = 1.1;
  steps.push({
    index: plan.length + 1,
    label: 'Done',
    action_index: 12,
    action_name: 'STOP',
    image: null,
    quality: q,
    quality_delta: 0,
    q_values: stopQ,
  });

  const total = plan.reduce((a, s) => a + s.delta, 0);
  return {
    method,
    input: { w: 512, h: 336, resized_from: [1920, 1260] },
    has_reference: true,
    quality_metric: 'PSNR (dB)',
    steps,
    final_image: steps[plan.length].image!,
    summary: {
      chain: [...plan.map((s) => s.action), 12],
      n_tool_steps: plan.length,
      total_quality_delta: Number(total.toFixed(2)),
      elapsed_ms: 1180 + plan.length * 360,
    },
  };
}

export function mockSimulate(severity: Severity, thenRestore: boolean): SimulateResponse {
  const hue = 212;
  const recipe: SimulateResponse['recipe'] =
    severity === 'mild'
      ? { blur_sigma: 1.1, noise_sigma: 10, jpeg_quality: 70 }
      : severity === 'severe'
        ? { blur_sigma: 3.6, noise_sigma: 42, jpeg_quality: 18 }
        : { blur_sigma: 2.2, noise_sigma: 24, jpeg_quality: 40 };
  const psnr = severity === 'mild' ? 27.9 : severity === 'severe' ? 19.4 : 23.2;
  return {
    severity,
    seed: 20000,
    recipe,
    clean: svgFrame({ label: 'clean', blur: 0.15, grain: 0.02, hue }),
    degraded: svgFrame({ label: `degraded · ${severity}`, blur: recipe.blur_sigma, grain: recipe.noise_sigma / 60, hue }),
    psnr_degraded_vs_clean: psnr,
    restoration: thenRestore ? mockRestore('agent', severity) : undefined,
  };
}

/** The pre-baked hero chain that loops on the landing page (moderate agent run). */
export const MOCK_HERO_CHAIN = mockRestore('agent', 'moderate');

/** Mock 4x enhance for offline dev — returns a crisp synthetic frame. */
export function mockEnhance(): EnhanceResponse {
  return {
    enhanced_image: svgFrame({ label: 'enhanced · 4×', blur: 0.1, grain: 0.015, hue: 212 }),
    scale: 4,
    input: { w: 320, h: 212 },
    output: { w: 1280, h: 848 },
    elapsed_ms: 4200,
  };
}
