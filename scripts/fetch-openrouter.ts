/**
 * Snapshots OpenRouter endpoint prices for GLM models into data/raw/openrouter/ and prints a suggested floor/median.
 * Does not modify data/assumptions.json. Per-endpoint throughput/latency are null without auth.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'data/raw/openrouter');
const models = ['glm-5.3', 'glm-5.3-flash', 'glm-5.2'];
const today = new Date().toISOString().slice(0, 10);

interface Endpoint {
  provider_name: string;
  quantization?: string;
  uptime_last_30m?: number | null;
  pricing: { prompt: string; completion: string; input_cache_read?: string };
}

mkdirSync(outDir, { recursive: true });
for (const m of models) {
  const url = `https://openrouter.ai/api/v1/models/z-ai/${m}/endpoints`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`${m}: HTTP ${res.status}`);
    continue;
  }
  const body = await res.json();
  const file = resolve(outDir, `z-ai_${m}_endpoints_${today}.json`);
  writeFileSync(file, JSON.stringify(body));
  console.log(`saved ${file}`);
  if (m !== 'glm-5.3') continue;

  const eps: Endpoint[] = body.data.endpoints;
  const rows = eps
    .map((e) => ({
      provider: e.provider_name,
      q: e.quantization ?? '-',
      up: e.uptime_last_30m ?? 0,
      inp: Number(e.pricing.prompt) * 1e6,
      cache: e.pricing.input_cache_read ? Number(e.pricing.input_cache_read) * 1e6 : NaN,
      out: Number(e.pricing.completion) * 1e6,
    }))
    .sort((a, b) => a.out - b.out);
  console.log('\nglm-5.3 endpoints by output price ($/M):');
  for (const r of rows) console.log(`  ${r.provider.padEnd(16)} ${r.q.padEnd(8)} in ${r.inp.toFixed(4)}  cache ${r.cache.toFixed(4)}  out ${r.out.toFixed(4)}  uptime ${r.up}`);
  // Sub-$0.20 input endpoints price input near zero and output at or above list: specialty hosts, excluded.
  const mainstream = rows.filter((r) => r.inp >= 0.2 && r.up > 0);
  const floor = mainstream[0];
  const median = mainstream[Math.floor(mainstream.length / 2)];
  if (floor) console.log(`\nsuggested floor:  ${floor.provider} in ${floor.inp} cache ${floor.cache} out ${floor.out}`);
  if (median) console.log(`suggested median: ${median.provider} in ${median.inp} cache ${median.cache} out ${median.out}`);
  console.log('note: throughput_last_30m is null without auth; use Artificial Analysis for speed.');
}
