"""Mixed-degradation severity recipes, ported from generate_train.m.

Each degradation type has a 10-band grid (11 grid points for blur/noise; the
JPEG grid is descending and non-uniform). A recipe is a level triple
(blur_lvl, noise_lvl, jpeg_lvl), each in 1..10. Severity class is defined by
sum(levels) - 2: mild [9,11], moderate [12,17], severe [18,20]. The original
enumerates sorted triples then appends all distinct permutations; sampling is
uniform over rows, then uniform within each chosen band.

Sampling uniformly over rows is equivalent to sampling uniformly over all
ordered (k, m, n) triples in 1..10 satisfying the severity constraint —
triples with more distinct assignments get proportionally more weight,
exactly as in the original.
"""

import itertools
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

BLUR_GRID = np.linspace(0.0, 5.0, 11)          # 11 points -> bands 1..10
NOISE_GRID = np.linspace(0.0, 50.0, 11)        # 11 points -> bands 1..10
JPEG_GRID = [100, 80, 60, 50, 40, 35, 30, 25, 20, 15, 10]  # descending

SEVERITY_LEVELS = {"mild": (9, 11), "moderate": (12, 17), "severe": (18, 20)}


@dataclass(frozen=True)
class RecipeParams:
    levels: tuple[int, int, int]  # (blur_lvl, noise_lvl, jpeg_lvl), 1-based
    blur_sigma: float
    noise_sigma: float
    jpeg_quality: float


@lru_cache(maxsize=None)
def enumerate_level_rows(min_l: int, max_l: int) -> tuple[tuple[int, int, int], ...]:
    """All (k,m,n) with k<=m<=n in 1..10 and k+m+n-2 in [min_l,max_l], plus all
    distinct permutations of each (the original's noise_combination.m)."""
    rows: set[tuple[int, int, int]] = set()
    for k, m, n in itertools.combinations_with_replacement(range(1, 11), 3):
        if min_l <= k + m + n - 2 <= max_l:
            rows.update(itertools.permutations((k, m, n)))
    return tuple(sorted(rows))


def sample_recipe(severity: str, rng: np.random.Generator) -> RecipeParams:
    rows = enumerate_level_rows(*SEVERITY_LEVELS[severity])
    b, n, j = rows[int(rng.integers(len(rows)))]
    blur_sigma = float(rng.uniform(BLUR_GRID[b - 1], BLUR_GRID[b]))
    noise_sigma = float(rng.uniform(NOISE_GRID[n - 1], NOISE_GRID[n]))
    jpeg_quality = float(rng.uniform(JPEG_GRID[j], JPEG_GRID[j - 1]))
    return RecipeParams((b, n, j), blur_sigma, noise_sigma, jpeg_quality)
