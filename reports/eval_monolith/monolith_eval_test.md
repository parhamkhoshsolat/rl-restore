# Monolithic-CNN TEST evaluation (DIV2K 751-800)

PSNR gain in dB over the degraded input (single unclamped forward, no chain).
Episodes are byte-identical to scripts/evaluate_agent.py (same seed scheme).

| Method | mild | moderate | severe | overall |
|---|---|---|---|---|
| B5: single end-to-end CNN (448,195 params) | 3.38 | 3.91 | 4.79 | 4.03 |

## Protocol

- 500 episodes per class on the DIV2K 751-800 TEST split (never seen during training).
- Seeds: mild 10000.., moderate 20000.., severe 30000.. — deterministic and disjoint; identical episodes to the agent evaluation per class.
- Monolith: 448,195 params, single forward, output unclamped (matches metrics.psnr convention).
- Checkpoint sha256[:16] = `952c8552b0cc984b`, device = cuda, date = 2026-06-13T16:10:37.456634+00:00.
- Image dtype: uint8 (training parity).
