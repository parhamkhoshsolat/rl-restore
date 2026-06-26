"""(degraded, clean) pairs spanning the FULL severity family, for the monolith.

Mirrors tools.dataset.ToolPairDataset but draws a fresh severity class UNIFORMLY
per item (default {mild, moderate, severe}) and degrades through the shared
data.pipeline.make_training_pair — which gives the uint8→/255 dtype branch (the
exact path whose absence caused the 2026-06-12 white-patch regression), the
3-scale pyramid, and the >50 dB too-clean resample for free.

Index-deterministic: item i is fully determined by (seed, i). No robust_extras
(the input recipe already injects noise + JPEG; keeps train/eval parity).
"""

from __future__ import annotations

import os

import numpy as np
from torch.utils.data import Dataset

from rlrestore.data.pipeline import make_training_pair
from rlrestore.tools.dataset import _to_tensor, build_pyramid

DEFAULT_SEVERITIES = ("mild", "moderate", "severe")


class MixedPairDataset(Dataset):
    """Uniform-severity (degraded, clean) pairs for the monolithic CNN.

    Parameters
    ----------
    images : list[np.ndarray]
        Image pool (uint8 RGB preferred, float32 [0,1] accepted — same dtype
        contract as make_training_pair / ToolPairDataset).
    seed : int
        Base seed; item i uses np.random.default_rng((seed, i)).
    length : int
        Number of items (steps_per_epoch * batch_size for a training epoch).
    severities : tuple[str, ...]
        Severity classes sampled uniformly per item. Default all three.
    cache_pyramid : bool | None
        Accepted for interface parity with ToolPairDataset. make_training_pair
        owns its own rescale (it picks a random scale internally), so unlike
        ToolPairDataset this dataset cannot index a pre-scaled pyramid without
        duplicating that logic; we therefore keep make_training_pair as the
        single source of truth and the cache only pre-realises rescale(im, 1.0)
        (the original image) — outputs are byte-identical either way. None →
        read env RLR_CACHE_PYRAMID.
    pyramid : list | None
        Prebuilt pyramid (build_pyramid output) shared across epochs/datasets;
        takes precedence over cache_pyramid.

    __getitem__ returns ``(degraded_chw, clean_chw)`` float32 tensors, shape
    (3, 63, 63).
    """

    def __init__(
        self,
        images,
        seed: int,
        length: int,
        severities: tuple[str, ...] = DEFAULT_SEVERITIES,
        cache_pyramid: bool | None = None,
        pyramid: list | None = None,
    ) -> None:
        if not severities:
            raise ValueError("severities must be non-empty")
        self.images = images
        self.seed = seed
        self.length = length
        self.severities = tuple(severities)
        if pyramid is not None:
            self._pyramid = pyramid  # prebuilt and shared across epochs/datasets
        else:
            if cache_pyramid is None:
                cache_pyramid = os.environ.get("RLR_CACHE_PYRAMID", "0") == "1"
            self._pyramid = build_pyramid(images) if cache_pyramid else None

    def __len__(self) -> int:
        return self.length

    def __getitem__(self, i: int):
        rng = np.random.default_rng((self.seed, i))
        img_idx = int(rng.integers(len(self.images)))
        severity = self.severities[int(rng.integers(len(self.severities)))]
        if self._pyramid is not None:
            src = self._pyramid[img_idx][0]  # rescale(im, 1.0) == original image
        else:
            src = self.images[img_idx]
        clean, degraded = make_training_pair(src, severity, rng)
        return _to_tensor(degraded), _to_tensor(clean)
