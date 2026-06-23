// ============================================================================
// Bundled example gallery — real photos served as static assets from
// public/examples (Vite copies them into the build; the backend serves them
// from dist/). Each flows through the real /api pipeline exactly like an upload.
//
// Source: DIV2K (NTIRE) images 0751-0800 — the held-out test split the model
// never trained on. The "damaged" variants were produced by the project's own
// apply_recipe() at the labelled severity, so the agent visibly repairs them;
// the "pristine" variants are the clean originals (good for the Damage
// simulator). All resized to 512 px on the long edge to match the API.
// ============================================================================

export type ExampleKind = 'pristine' | 'damaged';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface ExampleItem {
  id: string;
  label: string;
  hint: string;
  kind: ExampleKind;
  severity?: Severity;
  /** static asset path under public/ */
  src: string;
}

const dir = `${import.meta.env.BASE_URL}examples`;

export const EXAMPLES: ExampleItem[] = [
  // Damaged — restore right away.
  { id: 'wheat-field', label: 'Wheat field', hint: 'soft + grainy', kind: 'damaged', severity: 'mild', src: `${dir}/damaged_mild_0775.jpg` },
  { id: 'goat', label: 'Goat', hint: 'heavy grain', kind: 'damaged', severity: 'moderate', src: `${dir}/damaged_moderate_0767.jpg` },
  { id: 'horse', label: 'Horse by fence', hint: 'noise + JPEG', kind: 'damaged', severity: 'moderate', src: `${dir}/damaged_moderate_0791.jpg` },
  { id: 'ginger-cat', label: 'Ginger cat', hint: 'heavy noise + JPEG', kind: 'damaged', severity: 'severe', src: `${dir}/damaged_severe_0759.jpg` },
  // Pristine — clean originals.
  { id: 'hillside-town', label: 'Hillside town', hint: 'fine detail', kind: 'pristine', src: `${dir}/pristine_0751.jpg` },
  { id: 'green-iguana', label: 'Green iguana', hint: 'vivid color', kind: 'pristine', src: `${dir}/pristine_0763.jpg` },
  { id: 'hawk', label: 'Hawk portrait', hint: 'feather detail', kind: 'pristine', src: `${dir}/pristine_0779.jpg` },
];

export const DAMAGED_EXAMPLES = EXAMPLES.filter((e) => e.kind === 'damaged');
export const PRISTINE_EXAMPLES = EXAMPLES.filter((e) => e.kind === 'pristine');

/** Fetch any image URL (static asset or data: URL) as a Blob for POSTing to /api. */
export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  return res.blob();
}
