# Tool marginal-value analysis (P3.E2)

Which of the 12 restoration tools earn their keep, and is 12 the right toolbox size? Two lenses per tool:

- **Agent use %** — how often the deployed greedy DQN manager picks the tool on the held-out TEST set (action_hist, STOP excluded from the per-tool share but reported below).
- **Leave-one-out drop** — how far the no-STOP greedy-oracle ceiling falls when the tool is removed from the toolbox; its marginal contribution to the best-possible policy. Pooled across all 600 TEST pairs.

| Rank | Tool | Band | Agent use % (overall) | Leave-one-out drop dB (overall) | Own-band gain dB | Verdict |
|---|---|---|---|---|---|---|
| 1 | tool05 denoise2 | noise 12.5-25 | 34.0% | 0.103 | 1.06 | useful |
| 2 | tool06 denoise3 | noise 25-37.5 | 15.8% | 0.048 | 2.24 | marginal |
| 3 | tool02 deblur3 | blur 2.5-3.75 | 5.2% | 0.041 | 0.80 | marginal |
| 4 | tool00 deblur1 | blur 0-1.25 | 8.4% | 0.035 | 0.16 | marginal |
| 5 | tool01 deblur2 | blur 1.25-2.5 | 0.0% | 0.030 | 1.14 | marginal |
| 6 | tool11 dejpeg4 | jpeg 10-20 | 2.4% | 0.016 | 0.16 | redundant |
| 7 | tool03 deblur4 | blur 3.75-5 | 0.0% | 0.009 | 0.86 | redundant |
| 8 | tool04 denoise1 | noise 0-12.5 | 4.1% | 0.007 | -0.44 | redundant |
| 9 | tool08 dejpeg1 | jpeg 60-100 | 4.5% | 0.004 | -0.00 | redundant |
| 10 | tool07 denoise4 | noise 37.5-50 | 6.8% | 0.002 | 2.95 | redundant |
| 11 | tool09 dejpeg2 | jpeg 35-60 | 2.7% | 0.002 | 0.22 | redundant |
| 12 | tool10 dejpeg3 | jpeg 20-35 | 2.5% | 0.000 | 0.13 | redundant |

## Full-oracle ceiling (all 12 tools, no STOP)

| mild | moderate | severe | overall (pooled) |
|---|---|---|---|
| +2.609 | +3.022 | +3.698 | +3.110 |

## Agent STOP fraction (share of all actions)

| mild | moderate | severe | overall |
|---|---|---|---|
| 17.3% | 13.6% | 9.8% | 13.5% |

## Toolbox-size: forward selection (the honest answer)

Built greedily from zero, always adding the single most valuable tool. Unlike leave-one-out, this is safe to read for toolbox size: it shows the ceiling reachable with the best *k* tools.

| k | tool added | ceiling dB | % of full-12 |
|---|---|---|---|
| 1 | denoise2 | +2.040 | 65.6% |
| 2 | deblur1 | +2.627 | 84.5% |
| 3 | denoise3 | +2.856 | 91.9% |
| 4 | deblur3 | +2.982 | 95.9% |
| 5 | dejpeg4 | +3.045 | 97.9% |
| 6 | deblur2 | +3.074 | 98.8% |
| 7 | denoise1 | +3.090 | 99.4% |
| 8 | deblur4 | +3.099 | 99.6% |
| 9 | dejpeg1 | +3.105 | 99.9% |
| 10 | dejpeg2 | +3.107 | 99.9% |
| 11 | denoise4 | +3.109 | 100.0% |
| 12 | dejpeg3 | +3.110 | 100.0% |

## Toolbox-size takeaway

Forward selection reaches **90% of the 12-tool ceiling with 3 tool(s)** and **95% with 4** (denoise2, deblur1, denoise3, deblur3) — so on this damage mix roughly 4 well-chosen tools capture nearly all the achievable gain, and 12 is generous. IMPORTANT: this is the forward curve, NOT the sum of leave-one-out drops. The small per-tool leave-one-out drops (and the 7 'redundant' labels) reflect pairwise SUBSTITUTABILITY within the graded bands (denoise1-4 etc.), not group-removability — the strong specialists (e.g. denoise3/4, own-band +2.2/+3.0 dB) only look cheap because a neighbour covers them. The extra graded tools are cheap insurance that let the agent specialise finely; they are not free wins to delete wholesale.

## Protocol

- 200 episodes per class (600 pooled), a subset of the 500-episode TEST eval (capped for CPU feasibility).
- Seeds: mild 10000.., moderate 20000.., severe 30000.. — identical scheme to evaluate_agent.py (training_mode=False).
- Leave-one-out drop = full-oracle gain − gain with the tool removed, where the oracle is the no-STOP greedy oracle (B3): <=3 steps, each step applies the tool maximising PSNR vs clean.
- Overall = POOLED mean across all 600 pairs (not the mean of class means).
- Agent usage = action_hist fractions from the held-out TEST eval (reports/eval_test/agent_eval_test.json); STOP reported separately.
- Verdict thresholds (overall drop, dB): keystone >= 0.3, useful >= 0.1, marginal >= 0.02, else redundant.
- ⚑ hidden keystone = useful-or-better drop but agent usage < 3.0%.
- Checkpoint sha256[:16] = `824040df400cc7e3`, n_tools = 12, device = cpu, date = 2026-06-13T05:15:46.648096+00:00.
