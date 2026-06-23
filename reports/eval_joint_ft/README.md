# Joint fine-tuning — held-out test evaluation

These are the held-out DIV2K 751–800 results for the agent running on the **jointly
fine-tuned toolbox** (`checkpoints/tools/full_ft/`), produced by Algorithm 1 of the
paper (frozen agent selects chains → differentiable chain replay → MSE backprop into
the tools only).

The agent weights are **unchanged** from the frozen-toolbox run
(`checkpoints/agent_full_v2/agent_net.pt`, sha256 `824040df400cc7e3`). The only thing
that changed between this evaluation and `reports/eval_test/` is the 12 tool CNNs.
That isolates the effect of fine-tuning the tools.

| | frozen tools (`reports/eval_test/`) | fine-tuned tools (here) | Δ |
|---|---|---|---|
| Agent (overall) | +2.93 | **+3.67** | **+0.74** |
| B1 best single tool | +2.34 | +3.09 | +0.75 |
| B3 greedy oracle (ceiling) | +3.20 | +4.25 | +1.05 |
| B4 oracle + STOP | +3.24 | +4.33 | +1.09 |
| B2 random 3-chain | −1.53 | +1.30 | +2.83 |

Reading: fine-tuning lifted the **whole toolbox**, so every method that uses the tools
improved. The agent gained +0.74 dB — about three times the ~0.25 dB the paper reports
for the same step. The fine-tuned oracle ceiling (+4.25) now exceeds the single-CNN
baseline (+4.03), and the fine-tuned agent (+3.67) closes most of the gap to that
baseline (was 1.10 dB behind, now 0.36 dB behind). The most striking shift is the
random-chain baseline (B2): on the frozen toolbox a random 3-chain *hurt* the image
(−1.53 dB), but after fine-tuning the tools compose cleanly enough that even a random
chain *helps* (+1.30 dB) — evidence the tools learned to be safer in sequence, not just
individually sharper.

`agent_eval_test.json` / `.md` are the raw artifacts synced from the A100 run
(2026-06-14T00:05:03Z), unedited.
