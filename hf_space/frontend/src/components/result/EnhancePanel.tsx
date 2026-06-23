// ============================================================================
// The generative finisher — Real-ESRGAN 4x applied AFTER any method's result.
// Three states: CTA banner (the one "loud" element) -> working reveal (scanline
// + honest wait) -> done (Restored -> Enhanced slider + magnifier loupe). Honest
// throughout: detail is synthesized, not ground truth, so no PSNR is shown.
// ============================================================================

import { useAppStore } from '../../store/appStore';
import { ENHANCE_UI } from '../../config/registry';
import { triggerDownload } from '../../lib/download';
import { Button, Spinner } from '../ui/Primitives';
import { BeforeAfter } from './BeforeAfter';
import { LoupeImage } from './LoupeImage';
import './enhance-panel.css';

export function EnhancePanel({ restored }: { restored: string }) {
  const enhancing = useAppStore((s) => s.enhancing);
  const enhanceResult = useAppStore((s) => s.enhanceResult);
  const enhanceError = useAppStore((s) => s.enhanceError);
  const runEnhance = useAppStore((s) => s.runEnhance);

  if (enhanceResult) {
    const { input, output, elapsed_ms, enhanced_image } = enhanceResult;
    return (
      <div className="enh enh--done">
        <div className="enh__head">
          <h3 className="enh__title">{ENHANCE_UI.emoji} Enhanced 4×</h3>
          <span className="enh__dims mono">
            {input.w}×{input.h} → {output.w}×{output.h}px · {(elapsed_ms / 1000).toFixed(1)}s
          </span>
        </div>
        <BeforeAfter before={restored} after={enhanced_image} beforeLabel="Restored" afterLabel="Enhanced 4×" />
        <p className="enh__honest">{ENHANCE_UI.honesty}</p>
        <div className="enh__loupe">
          <span className="enh__loupe-label">🔍 Drag across the image to inspect native-resolution detail</span>
          <LoupeImage src={enhanced_image} />
        </div>
        <div className="enh__actions">
          <Button variant="primary" onClick={() => triggerDownload(enhanced_image, 'rl-restore-enhanced-4x.png')}>
            ⬇ Download enhanced PNG
          </Button>
          <Button variant="ghost" onClick={runEnhance}>
            ↻ Re-run
          </Button>
        </div>
      </div>
    );
  }

  if (enhancing) {
    return (
      <div className="enh enh--working">
        <div className="enh__stage">
          <img className="enh__stage-img" src={restored} alt="" aria-hidden />
          <div className="enh__scan" aria-hidden />
        </div>
        <div className="enh__working-label" role="status">
          <Spinner size={18} /> Resolving detail at 4×… this one takes up to ~30s on CPU
        </div>
      </div>
    );
  }

  return (
    <div className="enh enh--cta">
      <div className="enh__cta-text">
        <div className="enh__cta-title">
          {ENHANCE_UI.emoji} Make it crisp — {ENHANCE_UI.name}
        </div>
        <div className="enh__cta-sub">
          {ENHANCE_UI.promise} <span className="enh__cta-honest">{ENHANCE_UI.honesty}</span>
        </div>
        {enhanceError && <div className="enh__err">{enhanceError.message}</div>}
      </div>
      <Button variant="primary" className="enh__go" onClick={runEnhance}>
        {ENHANCE_UI.emoji} Enhance →
      </Button>
    </div>
  );
}
