# Research data

Dated snapshots of the public data behind the model's defaults, kept so the numbers can be checked.

Everything in this folder comes from third parties (OpenRouter, SemiAnalysis InferenceX, cloud providers'
price lists, and company SEC filings) and remains theirs. It is not covered by this repository's licenses.
Most files are extracts holding only the fields the model uses; pricing pages, transcripts, letters and
presentations are linked from the README in each folder rather than copied. Our own notes and derived
tables in this folder (the README files and `model-compare-*/revenue_table.csv`) are licensed CC BY 4.0
like the rest of the repository's text.

- `openrouter-*`: daily prompt, completion, reasoning and cached token counts per model, from each model's
  OpenRouter page, and endpoint prices. `research/openrouter_ratios.py` computes the token mix from them.
- `inferencex-*`: InferenceX benchmark results (agentic traces and fixed 8K/1K) used for the throughput curves.
- `prices-*`: on-demand NVL72 list prices by SKU, with links to each provider's page.
- `contracts-*`: disclosed NVL72 contracts from SEC filings, and the 2026 price trend, with links.
- `model-compare-*`: revenue per GPU-hour across nine open models (derived).
