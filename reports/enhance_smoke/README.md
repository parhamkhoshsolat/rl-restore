# Real-ESRGAN "Enhance" feasibility smoke

A quick perceptual check (not part of the 500-episode held-out protocol) of whether
the generative finisher helps, and at what scale. Run during development of the
"Enhance & Upscale 4×" feature.

**Setup.** A clean DIV2K test image is degraded (Gaussian blur σ≈1.3 + noise σ≈26
on the 0–255 scale + JPEG q≈38), then enhanced three ways and scored with **LPIPS
(AlexNet backend, lower = perceptually closer** to the high-resolution target):

| method | LPIPS ↓ |
|---|---|
| bicubic 4× upscale of the degraded input (naive baseline) | **0.965** |
| Real-ESRGAN 4× of the degraded input | **0.306** |
| Real-ESRGAN 4× of the clean input (the model's ceiling, no damage) | **0.168** |

**Findings.**
- At **native 4× upscale** the generative model is a large, visible win over naive
  upscaling (0.306 vs 0.965), and most of the remaining gap to the ceiling (0.168)
  is our specific degradation — closable by fine-tuning.
- At **same size (1×)** Real-ESRGAN was roughly a wash versus our U-Net — the
  visible crispness lives in the *upscaling* regime.
- Timing: ≈4 s for a 256 px input on an Apple M4 CPU (≈25–30 s for a 384 px input
  on the free Hugging Face 2-vCPU Space → the 384 px cap + tiling in
  `hf_space/backend/inference.py`).

**Figures.** `docs/learn/assets/enhance_4x_zoom.png` (bicubic vs Real-ESRGAN-from-damaged
vs Real-ESRGAN-from-clean vs target, zoomed) and `enhance_1x_vs_unet.png` (the 1× wash).
