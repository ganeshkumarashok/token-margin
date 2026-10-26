"""Input:output ratio and cache-hit share per model from OpenRouter's daily activity data.

Data: research/data/openrouter-<date>/<author>_<model>.json, the `model_chart` array embedded in each
openrouter.ai/<author>/<model> page (last 31 days). Prompt tokens include cached tokens; completion tokens
include reasoning tokens. The last day in each file is partial and is dropped.

    python3 research/openrouter_ratios.py [research/data/openrouter-2026-10-25]
"""
import json, sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent / 'data' / 'openrouter-2026-10-25')
rows = []
for f in sorted(root.glob('*.json')):
    days = sorted(json.loads(f.read_text()), key=lambda r: r['date'])
    days = [d for d in days if d['date'] < days[-1]['date']]  # drop the partial last day
    p = sum(d['total_prompt_tokens'] for d in days)
    c = sum(d['total_completion_tokens'] for d in days)
    if not c:
        continue
    cached = sum(d['total_native_tokens_cached'] for d in days)
    reqs = sum(d['count'] for d in days)
    rows.append((f.stem, days[0]['date'][:10], days[-1]['date'][:10], p, c, cached, reqs))

print(f"{'model':38} {'from':10} {'to':10} {'prompt B':>10} {'compl B':>9} {'in:out':>7} {'cached':>7} {'in/req':>8} {'out/req':>8} {'uncached/out':>12}")
for m, a, b, p, c, k, n in sorted(rows, key=lambda r: -r[3]):
    print(f"{m:38} {a} {b} {p/1e9:10.1f} {c/1e9:9.2f} {p/c:7.1f} {k/p:7.1%} {p/n:8.0f} {c/n:8.0f} {(p-k)/c:12.1f}")
