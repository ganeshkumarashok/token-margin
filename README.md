# gpu-roi

Do "token factories" print cash? A small, open model of the unit economics of
owning NVIDIA NVL72 racks (GB200 / GB300) and selling open-weights inference
tokens (GLM-5.3 first): tokens per day, revenue, cost stack, margin, payback,
with knobs for serving speed, achieved throughput, utilization, token prices
and their decline, electricity, colocation, useful life and financing.

Read `PLAN.md` for the reasoning and `docs/findings.md` for the results.
Every default lives in `data/assumptions.json` and traces to `research/sources.md`.
Dated raw snapshots live in `data/raw/`.

## Run locally

```
npm install
npm run dev          # site at http://localhost:5173/gpu-roi/
npm test             # engine tests
npm run scenario     # scenario tables -> docs/findings-tables.md
npm run e2e          # browser checks (first run: npx playwright install chromium)
npm run fetch:openrouter   # refresh price snapshots
```

## Layout

- `packages/engine`: the model. Pure TypeScript functions, shared by the site and the CLI.
- `apps/web`: the static site (Vite + React). State lives in the URL, so every scenario is a link.
- `scripts`: scenario tables and price snapshots.
- `research/reference.py`: independent reference implementation the tests were derived from.

## Disclaimer

Personal side project. Not affiliated with, sponsored by, or representing the
views of any employer or any company named here. Not financial, investment,
tax, or purchasing advice. All figures are estimates built from public sources
under stated assumptions and can be wrong by large factors; the knobs exist so
you can disagree with them. No warranty.
