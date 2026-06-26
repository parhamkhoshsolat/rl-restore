"""Recipe application and 63x63 patch sampling (on the fly, no pre-extraction)."""

import cv2
import numpy as np

from rlrestore.common.metrics import psnr
from rlrestore.data.degradations import gaussian_blur, gaussian_noise, jpeg_compress
from rlrestore.data.recipes import RecipeParams, sample_recipe

PATCH_SIZE = 63
SCALES = [1.0, 2.0 / 3.0, 1.0 / 3.0]  # original code's 3-scale pyramid
MAX_CLEAN_PSNR = 50.0  # original skips too-smooth pairs


def apply_recipe(img: np.ndarray, params: RecipeParams, rng: np.random.Generator) -> np.ndarray:
    """Always blur -> noise -> jpeg (the original's fixed composition order)."""
    out = gaussian_blur(img, params.blur_sigma)
    out = gaussian_noise(out, params.noise_sigma, rng)
    out = jpeg_compress(out, params.jpeg_quality)
    return out


def rescale(img: np.ndarray, scale: float) -> np.ndarray:
    """Scale by `scale` with bicubic interpolation, flooring each dim at PATCH_SIZE.

    The per-axis floor can distort aspect ratio for images smaller than
    ~PATCH_SIZE/scale; real DIV2K images never trigger it (min dim ~667px),
    it exists so small synthetic test images stay croppable.
    """
    if scale == 1.0:
        return img
    h, w = img.shape[:2]
    return cv2.resize(
        img,
        (max(PATCH_SIZE, int(w * scale)), max(PATCH_SIZE, int(h * scale))),
        interpolation=cv2.INTER_CUBIC,
    )


def random_patch(
    img: np.ndarray, rng: np.random.Generator, size: int = PATCH_SIZE
) -> np.ndarray:
    h, w = img.shape[:2]
    y = int(rng.integers(0, h - size + 1))
    x = int(rng.integers(0, w - size + 1))
    return img[y : y + size, x : x + size].copy()


def make_training_pair(
    img: np.ndarray, severity: str, rng: np.random.Generator, max_tries: int = 10
) -> tuple[np.ndarray, np.ndarray]:
    """(clean, degraded) 63x63 pair: random scale, random crop, random recipe.

    Accepts uint8 (0-255) or float (0-1) images — same dtype contract as
    ToolPairDataset. REGRESSION NOTE (2026-06-12): this function originally
    assumed float input; uint8 images from load_images were clipped to [0,1],
    saturating every clean patch to ~pure white. The Phase 2 agent's first 2M-step
    run trained entirely on that degenerate world before held-out evaluation
    caught it. Keep the dtype branch aligned with ToolPairDataset.__getitem__.

    Resamples when PSNR(degraded, clean) > 50 dB (too smooth to learn from).
    """
    if max_tries < 1:
        raise ValueError("max_tries must be >= 1")
    for _ in range(max_tries):
        scaled = rescale(img, SCALES[int(rng.integers(len(SCALES)))])
        patch = random_patch(scaled, rng)
        if patch.dtype == np.uint8:
            clean = patch.astype(np.float32) / 255.0
        else:
            clean = np.clip(patch, 0.0, 1.0).astype(np.float32)
        degraded = apply_recipe(clean, sample_recipe(severity, rng), rng)
        if psnr(degraded, clean) <= MAX_CLEAN_PSNR:
            return clean, degraded
    return clean, degraded  # give up resampling; extremely rare
