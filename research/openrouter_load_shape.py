"""How evenly LLM traffic spreads across days, from OpenRouter's daily token counts.

A rack sized for the busiest day of a week sells, on average, (average day) / (busiest day) of its capacity.
Comparing each day with its own week keeps demand growth out of the ratio: over Sep 25 to Oct 24, 2026,
GLM-5.3 traffic roughly doubled, which a 30-day average-to-peak ratio would mistake for volatility.

    python3 research/openrouter_load_shape.py [research/data/openrouter-2026-10-25]
"""
import json, statistics as st, sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent / 'data' / 'openrouter-2026-10-25')

def daily(files):
    agg = {}
    for f in files:
        rows = sorted(json.loads(f.read_text()), key=lambda r: r['date'])[:-1]  # drop the partial last day
        for r in rows:
            agg[r['date'][:10]] = agg.get(r['date'][:10], 0) + r['total_prompt_tokens'] + r['total_completion_tokens']
    return [agg[k] for k in sorted(agg)]

for name, files in (('GLM-5.3', [root / 'z-ai_glm-5.3.json']), ('all open models in the snapshot', sorted(root.glob('*.json')))):
    v = daily(files)
    weekly = [st.mean(v[i:i + 7]) / max(v[i:i + 7]) for i in range(len(v) - 6)]
    print(f"{name}: average day / busiest day of its week = {st.mean(weekly):.2f} (range {min(weekly):.2f}-{max(weekly):.2f}); "
          f"over the whole 30 days = {st.mean(v) / max(v):.2f}")
