# Agent TEST evaluation (DIV2K 751-800)

PSNR gain in dB over the degraded input (higher is better).

| Method | mild | moderate | severe | overall |
|---|---|---|---|---|
| B0 do nothing | 0.00 | 0.00 | 0.00 | 0.00 |
| B2 random 3-chain | -2.31 ± 5.27 | -1.27 ± 4.71 | -1.02 ± 4.81 | -1.53 |
| B1 best single tool | 1.51 (tool06 denoise3) | 2.34 (tool06 denoise3) | 3.16 (tool07 denoise4) | 2.34 |
| Agent (greedy DQN) | 2.24 | 2.90 | 3.67 | 2.94 |
| B3 greedy oracle | 2.67 | 3.10 | 3.84 | 3.20 |
| B4 oracle + STOP | 2.73 | 3.13 | 3.86 | 3.24 |
| Agent stop rate t1/t2/t3 | 0.04 / 0.12 / 0.37 | 0.02 / 0.10 / 0.34 | 0.02 / 0.09 / 0.33 | 0.03 / 0.10 / 0.34 |
| Agent mean chain length | 2.27 | 2.38 | 2.45 | 2.37 |

## Protocol

- 500 episodes per class on the DIV2K 751-800 TEST split (never seen by tools or agent).
- Seeds: mild 10000.., moderate 20000.., severe 30000.. — deterministic and disjoint; agent and baselines share identical episodes per class.
- B2 uses 100 random 3-chains per episode.
- Checkpoint sha256[:16] = `1608ade9c101f041`, device = cpu, date = 2026-06-13T12:19:27.888462+00:00.
