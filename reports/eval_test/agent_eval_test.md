# Agent TEST evaluation (DIV2K 751-800)

PSNR gain in dB over the degraded input (higher is better).

| Method | mild | moderate | severe | overall |
|---|---|---|---|---|
| B0 do nothing | 0.00 | 0.00 | 0.00 | 0.00 |
| B2 random 3-chain | -2.31 ± 5.27 | -1.27 ± 4.71 | -1.02 ± 4.81 | -1.53 |
| B1 best single tool | 1.51 (tool06 denoise3) | 2.34 (tool06 denoise3) | 3.16 (tool07 denoise4) | 2.34 |
| Agent (greedy DQN) | 2.24 | 2.83 | 3.71 | 2.93 |
| B3 greedy oracle | 2.67 | 3.10 | 3.84 | 3.20 |
| B4 oracle + STOP | 2.73 | 3.13 | 3.86 | 3.24 |
| Agent stop rate t1/t2/t3 | 0.02 / 0.16 / 0.30 | 0.01 / 0.10 / 0.28 | 0.00 / 0.07 / 0.22 | 0.01 / 0.11 / 0.27 |
| Agent mean chain length | 2.31 | 2.48 | 2.64 | 2.48 |

## Protocol

- 500 episodes per class on the DIV2K 751-800 TEST split (never seen by tools or agent).
- Seeds: mild 10000.., moderate 20000.., severe 30000.. — deterministic and disjoint; agent and baselines share identical episodes per class.
- B2 uses 100 random 3-chains per episode.
- Checkpoint sha256[:16] = `824040df400cc7e3`, device = cpu, date = 2026-06-13T00:32:32.520437+00:00.
