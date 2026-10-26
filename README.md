# Token margin

Live at https://tokens.ganeshkumarashok.com. What are the margins on inference? This models one NVIDIA NVL72 rack (GB200 or
GB300) serving an open-weights model (GLM-5.3, FP4) for a day: what it costs to
rent or own, how many tokens it serves, what they sell for, and what is left.
Moving a slider recomputes the day, and the URL records every change, so each
scenario is a shareable link.

Throughput is measured (InferenceX agentic benchmark), the token mix and prices
are OpenRouter's, and rents are published list prices or filed contracts.
Results are in `docs/findings.md`, including a comparison with DeepSeek V4 Pro, which the model supports but the site does not show. Every default lives in `data/assumptions.json`
and traces to `research/sources.md`; the raw data behind them is in `research/data/`.

## Run locally

```
npm install
npm run dev          # site at http://localhost:5173/
npm test             # engine tests, including checks against InferenceX's published points
npm run scenario     # scenario tables -> docs/findings-tables.md
npm run e2e          # browser checks, screenshots and public/og.png (first run: npx playwright install chromium)
python3 research/reference.py          # independent reference model the tests were derived from
python3 research/openrouter_ratios.py  # token ratios from the OpenRouter snapshot
```

## Layout

- `packages/engine`: the model. Pure TypeScript, shared by the site and the CLI.
- `apps/web`: the static site (Vite + React): the day as one equation, the rack, and sliders.
- `scripts`: scenario tables and price snapshots.
- `research`: sources, raw data snapshots and the Python reference model.

## Disclaimer

Personal side project. Not affiliated with, sponsored by, or representing the
views of any employer or any company named here. Not financial, investment,
tax, or purchasing advice. All figures are estimates built from public sources
under stated assumptions and can be wrong by large factors. No warranty.
