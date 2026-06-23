// ============================================================================
// Central app state (zustand). Drives the image-first flow:
//   landing -> provide input -> RESTORE (hero player) -> result
//            -> optional ENHANCE 4x finisher (generative crisp reveal)
// The method is chosen in a compact rail (Agent default); A/B compare optional.
// The player (transport) state lives in usePlayer.
// ============================================================================

import { create } from 'zustand';
import type {
  ApiError,
  EnhanceResponse,
  MethodId,
  MethodsResponse,
  RestoreResponse,
  Severity,
  SimulateResponse,
} from '../api/types';
import { DEFAULT_METHOD } from '../config/registry';
import { getMethods, postEnhance, postRestore, postSimulate, isApiError } from '../api/client';

export type Stage = 'landing' | 'studio';

export interface InputSource {
  /** the file/blob we will send to the API */
  blob: Blob;
  /** object URL or data URL for preview */
  previewUrl: string;
  name: string;
  /** optional clean reference (from the simulator) for true PSNR */
  reference?: Blob;
  /** where it came from, for analytics/UX copy */
  origin: 'upload' | 'camera' | 'example' | 'simulator';
  /** if from the simulator, the simulate payload (clean/degraded/recipe) */
  sim?: SimulateResponse;
}

interface AppState {
  // bootstrap
  stage: Stage;
  methodsData: MethodsResponse | null;
  methodsLoading: boolean;
  methodsError: ApiError | null;

  // selection
  method: MethodId;
  compareMode: boolean;

  // input
  input: InputSource | null;

  // restoration
  restoring: boolean;
  restoreError: ApiError | null;
  result: RestoreResponse | null;
  resultB: RestoreResponse | null; // for A/B compare (the "other" method)

  // enhance (generative finisher)
  enhancing: boolean;
  enhanceError: ApiError | null;
  enhanceResult: EnhanceResponse | null;

  // actions
  setStage: (s: Stage) => void;
  loadMethods: () => Promise<void>;
  setMethod: (m: MethodId) => void;
  toggleCompare: () => void;
  setInput: (i: InputSource | null) => void;
  runSimulate: (file: Blob, severity: Severity, seed?: number) => Promise<SimulateResponse | null>;
  runRestore: () => Promise<void>;
  runEnhance: () => Promise<void>;
  enhanceAvailable: () => boolean;
  reset: () => void;
}

const CLEAR_RESULT = {
  result: null,
  resultB: null,
  restoreError: null,
  enhancing: false,
  enhanceError: null,
  enhanceResult: null,
} as const;

export const useAppStore = create<AppState>((set, get) => ({
  stage: 'landing',
  methodsData: null,
  methodsLoading: false,
  methodsError: null,

  method: DEFAULT_METHOD,
  compareMode: false,

  input: null,

  restoring: false,
  restoreError: null,
  result: null,
  resultB: null,

  enhancing: false,
  enhanceError: null,
  enhanceResult: null,

  setStage: (s) => set({ stage: s }),

  loadMethods: async () => {
    if (get().methodsData || get().methodsLoading) return;
    set({ methodsLoading: true, methodsError: null });
    try {
      const data = await getMethods();
      // keep selection valid if the default is absent for some reason
      const ids = data.methods.map((m) => m.id);
      const method = ids.includes(get().method) ? get().method : (ids[0] ?? DEFAULT_METHOD);
      set({ methodsData: data, method, methodsLoading: false });
    } catch (e) {
      set({
        methodsError: isApiError(e) ? e : { kind: 'unknown', message: 'Failed to load methods.', retriable: true },
        methodsLoading: false,
      });
    }
  },

  setMethod: (m) => set({ method: m }),
  toggleCompare: () => set((s) => ({ compareMode: !s.compareMode })),

  setInput: (i) => set({ input: i, ...CLEAR_RESULT }),

  runSimulate: async (file, severity, seed) => {
    try {
      const sim = await postSimulate(file, severity, { seed });
      return sim;
    } catch (e) {
      set({
        restoreError: isApiError(e) ? e : { kind: 'unknown', message: 'Simulation failed.', retriable: true },
      });
      return null;
    }
  },

  runRestore: async () => {
    const { input, method, compareMode, methodsData } = get();
    if (!input) return;
    set({ restoring: true, ...CLEAR_RESULT });
    try {
      const main = await postRestore(input.blob, method, input.reference);
      let other: RestoreResponse | null = null;
      if (compareMode && methodsData) {
        // pick a contrasting method: agentic <-> single-pass
        const otherId =
          method === 'monolith' || method === 'unet_hq'
            ? (methodsData.methods.find((m) => m.kind === 'agentic')?.id ?? 'agent')
            : (methodsData.methods.find((m) => m.id === 'monolith')?.id ?? 'monolith');
        try {
          other = await postRestore(input.blob, otherId, input.reference);
        } catch {
          other = null; // compare is best-effort
        }
      }
      set({ result: main, resultB: other, restoring: false });
    } catch (e) {
      set({
        restoreError: isApiError(e) ? e : { kind: 'unknown', message: 'Restoration failed.', retriable: true },
        restoring: false,
      });
    }
  },

  runEnhance: async () => {
    const { result, enhancing } = get();
    if (!result || enhancing) return;
    set({ enhancing: true, enhanceError: null, enhanceResult: null });
    try {
      // turn the restored data URL into a blob the /api/enhance endpoint accepts
      const blob = await (await fetch(result.final_image)).blob();
      const enhanced = await postEnhance(blob);
      set({ enhanceResult: enhanced, enhancing: false });
    } catch (e) {
      set({
        enhanceError: isApiError(e) ? e : { kind: 'unknown', message: 'Enhance failed. Try again.', retriable: true },
        enhancing: false,
      });
    }
  },

  enhanceAvailable: () => Boolean(get().methodsData?.enhance_available),

  reset: () =>
    set({
      input: null,
      restoring: false,
      compareMode: false,
      ...CLEAR_RESULT,
    }),
}));
