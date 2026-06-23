# Agent TEST evaluation (DIV2K 751-800)

PSNR gain in dB over the degraded input (higher is better).

| Method | mild | moderate | severe | overall |
|---|---|---|---|---|
| B0 do nothing | 0.00 | 0.00 | 0.00 | 0.00 |
| B2 random 3-chain | 0.23 ± 4.16 | 1.50 ± 3.60 | 2.16 ± 3.51 | 1.30 |
| B1 best single tool | 2.40 (tool06 denoise3) | 2.95 (tool06 denoise3) | 3.92 (tool07 denoise4) | 3.09 |
| Agent (greedy DQN) | 2.88 | 3.57 | 4.55 | 3.67 |
| B3 greedy oracle | 3.44 | 4.10 | 5.21 | 4.25 |
| B4 oracle + STOP | 3.62 | 4.15 | 5.23 | 4.33 |
| Agent stop rate t1/t2/t3 | 0.02 / 0.15 / 0.31 | 0.01 / 0.09 / 0.33 | 0.00 / 0.06 / 0.32 | 0.01 / 0.10 / 0.32 |
| Agent mean chain length | 2.33 | 2.46 | 2.55 | 2.44 |

## Protocol

- 500 episodes per class on the DIV2K 751-800 TEST split (never seen by tools or agent).
- Seeds: mild 10000.., moderate 20000.., severe 30000.. — deterministic and disjoint; agent and baselines share identical episodes per class.
- B2 uses 100 random 3-chains per episode.
- Checkpoint sha256[:16] = `824040df400cc7e3`, device = cuda, date = 2026-06-14T00:05:03.309607+00:00.
