// ============================================================================
// API client — RELATIVE urls (/api/...). Same-origin in prod (backend serves
// this build), so no CORS. A dev-flag mock fallback lets the UI render when the
// backend is down: set VITE_USE_MOCK=1, OR it auto-falls-back on /api/methods
// network failure during `npm run dev` (never in prod builds).
// ============================================================================

import type {
  ApiError,
  EnhanceResponse,
  HealthResponse,
  MethodId,
  MethodsResponse,
  RestoreResponse,
  Severity,
  SimulateResponse,
} from './types';
import { MOCK_METHODS, mockEnhance, mockRestore, mockSimulate } from './mock';

const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === '1';
const IS_DEV = import.meta.env.DEV;

// once we discover /api is unreachable in dev, latch mock mode for the session
let mockLatched = false;
export function isMockActive(): boolean {
  return FORCE_MOCK || mockLatched;
}

function apiError(kind: ApiError['kind'], message: string, retriable: boolean): ApiError {
  return { kind, message, retriable };
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = '';
  try {
    const body = await res.json();
    detail = (body && (body.detail || body.message || body.error)) ?? '';
  } catch {
    /* non-JSON error body */
  }
  if (res.status === 413) return apiError('too_large', detail || 'That image is too large.', true);
  if (res.status === 415) return apiError('wrong_type', detail || 'That file type is not supported.', true);
  if (res.status >= 500) return apiError('inference_failed', detail || 'The server hit an error. Try again.', true);
  return apiError('unknown', detail || `Request failed (${res.status}).`, true);
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

async function postForm<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { method: 'POST', body: form, signal });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

// ---- endpoints -------------------------------------------------------------

export async function getHealth(): Promise<HealthResponse> {
  if (isMockActive()) return { status: 'ok', models_loaded: true, device: 'mock' };
  try {
    return await getJSON<HealthResponse>('/api/health');
  } catch {
    if (IS_DEV) {
      mockLatched = true;
      return { status: 'ok', models_loaded: true, device: 'mock' };
    }
    throw apiError('network', 'Could not reach the server.', true);
  }
}

export async function getMethods(): Promise<MethodsResponse> {
  if (isMockActive()) return MOCK_METHODS;
  try {
    return await getJSON<MethodsResponse>('/api/methods');
  } catch (e) {
    if (IS_DEV) {
      mockLatched = true;
      return MOCK_METHODS;
    }
    throw e;
  }
}

export async function postRestore(
  file: File | Blob,
  method: MethodId,
  reference?: File | Blob,
  signal?: AbortSignal,
): Promise<RestoreResponse> {
  if (isMockActive()) {
    await delay(900);
    return mockRestore(method, 'moderate');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('method', method);
  if (reference) form.append('reference', reference);
  return postForm<RestoreResponse>('/api/restore', form, signal);
}

export async function postSimulate(
  file: File | Blob,
  severity: Severity,
  opts?: { seed?: number; thenRestore?: boolean; signal?: AbortSignal },
): Promise<SimulateResponse> {
  if (isMockActive()) {
    await delay(800);
    return mockSimulate(severity, opts?.thenRestore ?? false);
  }
  const form = new FormData();
  form.append('file', file);
  form.append('severity', severity);
  if (opts?.seed != null) form.append('seed', String(opts.seed));
  if (opts?.thenRestore) form.append('then_restore', 'true');
  return postForm<SimulateResponse>('/api/simulate', form, opts?.signal);
}

export async function postEnhance(
  file: File | Blob,
  signal?: AbortSignal,
): Promise<EnhanceResponse> {
  if (isMockActive()) {
    await delay(1400);
    return mockEnhance();
  }
  const form = new FormData();
  form.append('file', file);
  return postForm<EnhanceResponse>('/api/enhance', form, signal);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'kind' in e && 'message' in e;
}
