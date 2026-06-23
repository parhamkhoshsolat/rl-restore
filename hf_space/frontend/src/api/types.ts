// ============================================================================
// Mirror of the REAL backend API contract (under /api). Images are base64
// data URLs in JSON. Field shapes match the FastAPI Pydantic models exactly
// (backend/schemas.py): input uses w/h, method kind is agentic|single_pass,
// limits use max_long_edge/max_steps. Keep these in sync with schemas.py.
// ============================================================================

export type MethodId = 'agent' | 'agent_ft' | 'monolith' | 'unet_hq';
export type MethodKind = 'agentic' | 'single_pass';
export type Severity = 'mild' | 'moderate' | 'severe';
export type ToolKind = 'blur' | 'noise' | 'jpeg';

/** STOP is action index 12 (the 13th logit). Tools are 0-11. */
export const STOP_ACTION_INDEX = 12;
export const N_ACTIONS = 13;

export interface MethodInfo {
  id: MethodId;
  name: string;
  description: string;
  kind: MethodKind;
  available: boolean;
}

export interface ToolInfo {
  index: number; // 0-11
  name: string; // e.g. "denoise2 (12.5-25)"
  kind: ToolKind;
  family?: string; // "deblur" | "denoise" | "dejpeg"
  band?: number | string;
  lo?: number;
  hi?: number;
  arch?: string;
}

export interface Limits {
  max_upload_mb: number;
  max_long_edge: number;
  max_steps: number;
}

export interface MethodsResponse {
  methods: MethodInfo[];
  tools: ToolInfo[];
  severities: Severity[];
  stop_action_index: number;
  enhance_available: boolean;
  limits: Limits;
}

export interface HealthResponse {
  status: string;
  models_loaded?: boolean;
  device?: string;
}

/** One frame of a restoration. STOP frames have image === null (reuse previous). */
export interface RestoreStep {
  index: number;
  label: string;
  action_index: number;
  action_name: string;
  image: string | null; // dataURL | null
  quality: number;
  quality_delta: number;
  q_values?: number[] | null; // length 13 (12 tools + STOP)
}

export interface RestoreSummary {
  chain: number[]; // action indices taken
  n_tool_steps: number;
  total_quality_delta: number;
  elapsed_ms: number;
}

export interface RestoreInputMeta {
  w: number;
  h: number;
  resized_from?: [number, number] | null;
}

export interface RestoreResponse {
  method: MethodId;
  input: RestoreInputMeta;
  has_reference: boolean;
  quality_metric: string; // "PSNR (dB)" | "Sharpness (estimated)" etc.
  steps: RestoreStep[];
  final_image: string; // dataURL
  summary: RestoreSummary;
}

/** Generative finisher (Real-ESRGAN 4x). No PSNR — detail is synthesized. */
export interface Dimensions {
  w: number;
  h: number;
}

export interface EnhanceResponse {
  enhanced_image: string; // dataURL of the 4x upscaled image
  scale: number; // 4
  input: Dimensions; // size fed to the enhancer (after the long-edge cap)
  output: Dimensions; // 4x output size
  elapsed_ms: number;
}

export interface SimulateRecipe {
  blur_sigma: number;
  noise_sigma: number;
  jpeg_quality: number;
}

export interface SimulateResponse {
  severity: Severity;
  seed: number;
  recipe: SimulateRecipe;
  clean: string; // dataURL
  degraded: string; // dataURL
  psnr_degraded_vs_clean: number;
  restoration?: RestoreResponse;
}

export interface ApiError {
  kind: 'too_large' | 'wrong_type' | 'inference_failed' | 'network' | 'unknown';
  message: string;
  retriable: boolean;
}
