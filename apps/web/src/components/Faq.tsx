import { curveFor, defaultSettings, evaluate, inputsFromSettings, type Settings } from '@token-margin/engine';
import { A } from '../data';
import { REPO } from '../links';

const glm = A.models.glm53;
const IX = 'https://github.com/SemiAnalysisAI/InferenceX';
const rack = A.racks.gb200;
/** The default day with some settings changed. */
function dayWith(over: Partial<Settings>) {
  const s = { ...defaultSettings(A), ...over };
  return evaluate(inputsFromSettings(A, s), curveFor(A, s.rack, s.model)).daily;
}
/** Margin at the defaults with some settings changed, as a whole percent. */
const marginWith = (over: Partial<Settings>) => Math.round((dayWith(over).operatingMargin ?? 0) * 100);
/** Margin with 25% more tokens per GPU: revenue and overhead grow by a quarter, rent does not. */
function fasterWith(over: Partial<Settings>) {
  const d = dayWith(over);
  return Math.round((1 - A.defaults.overheadPct - (d.costUsd - d.overheadUsd) / (1.25 * d.revenueUsd)) * 100);
}
// Owned GB200 at the defaults: all-in cost per GPU-hour, before overhead.
const ownDay = dayWith({ tenure: 'own' });
const ownPerGpuHr = (ownDay.costUsd - ownDay.overheadUsd) / (ownDay.gpus * 24);
const cheapRent = marginWith({ rack: 'gb300', rentUsdPerGpuHr: 5, pricePreset: 'list', utilization: 0.6 });
const contract = marginWith({});
const onDemand = marginWith({ rentBasis: 'onDemand' });
const own = marginWith({ tenure: 'own' });
const fasterContract = fasterWith({});
const fasterOnDemand = fasterWith({ rentBasis: 'onDemand' });
// The benchmark ran on 40 GPUs; the page applies its per-GPU rate to all 72. How that rack would be split
// between prefill and decode for OpenRouter's traffic, ideally and with this recipe's 8- and 16-GPU workers.
const di = inputsFromSettings(A, defaultSettings(A));
const dBench = evaluate(di, curveFor(A, 'gb200')).daily.benchPerGpu;
const freshPerOut = di.islOsl * (1 - di.cacheHit);
const decodeSecPerOut = 1 / dBench - di.refUncachedPerOut / di.prefillRate;
const prefillSecPerOut = freshPerOut / di.prefillRate;
const idealDecode = Math.round(rack.gpus * decodeSecPerOut / (decodeSecPerOut + prefillSecPerOut));
const idealPerGpu = 1 / (decodeSecPerOut + prefillSecPerOut);
const tilings = [1, 2, 3, 4].map((k) => ({ decode: 16 * k, prefill: rack.gpus - 16 * k }))
  .map((s) => ({ ...s, perGpu: Math.min(s.decode / decodeSecPerOut, s.prefill * di.prefillRate / freshPerOut) / rack.gpus }));
const tiled = tilings.reduce((best, s) => (s.perGpu > best.perGpu ? s : best));
const tilingLoss = Math.round((1 - tiled.perGpu / idealPerGpu) * 100);

/** Short answers to the questions readers ask first. Folded by default. */
const ITEMS: Array<[string, React.ReactNode]> = [
  ['How optimized is the serving setup?', <>
    <p>The GB200 figure comes from the 24-prefill, 16-decode run in InferenceX's public <a href={`${IX}/blob/4416f5e2f66c999d718573736388f102023ab562/inferencex-e2e/benchmarks/multi_node/srt-slurm-recipes/glm5.2/sglang/gb200-fp4/agentx/disagg-variants.yaml#L303`}>recipe</a> (<a href={`${IX}/actions/runs/39765601214/attempts/2`}>run logs</a>):</p>
    <ul>
      <li>NVIDIA Dynamo over SGLang, October 2026 development builds</li>
      <li>prefill on 24 GPUs (three workers of 8), decode on 16 (one worker); throughput is per GPU</li>
      <li>NVFP4 weights, FP8 KV cache, EAGLE speculative decoding with up to 6 draft tokens</li>
      <li>experts spread across the 16 decode GPUs, data-parallel attention, FlashInfer MoE kernels</li>
      <li>sessions pinned to one prefill worker; prefill caches overflow to CPU memory</li>
    </ul>
    <p>The page applies that per-GPU rate to all 72 GPUs, as if the rack were split ideally for its traffic (about {rack.gpus - idealDecode} prefill and {idealDecode} decode). With this recipe's 8- and 16-GPU blocks the nearest split, {tiled.prefill} and {tiled.decode}, serves about {tilingLoss}% less. Providers with their own stacks may do better: GLM's GB200 throughput at 100 tok/s per user went from 69 to 287 per GPU between August and October 2026.</p>
  </>],
  ['Other estimates show 50–90% margins; why is this lower?', <>
    <p>Rent explains most of it.</p>
    <ul>
      <li>They charge about $5 per GB300-hour, roughly what an owner or a large multi-year deal pays; on demand, one rack costs ${A.racks.gb300.rentUsdPerGpuHr.value.toFixed(2)}. At $5 rent and list prices this page gives a GB300 {cheapRent}% at 60% utilization, and its own contract and owning cases are {contract}% and {own}%.</li>
      <li>This page uses OpenRouter's real traffic, whose 63 input tokens per output load prefill harder than the benchmark sessions, and median provider prices rather than list.</li>
      <li>DeepSeek's <a href="https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md">$38 of revenue per GPU-hour</a> is a lab serving its own model on its own stack, with capacity that scales with demand.</li>
      <li>Serving software is improving fast. 25% more tokens per GPU takes the margin from {contract}% to {fasterContract}% on the contract and from {onDemand}% to {fasterOnDemand}% on demand.</li>
    </ul>
  </>],
  ['Why one rack and one day?', <>An NVL72 rack is the unit these GPUs come in: 72 of them share one NVLink network, and large models are served across many at once. One day keeps every number small enough to check by hand.</>],
  ['Why GLM-5.3?', <>It is MIT-licensed, among the most used models on <a href={glm.mix.url}>OpenRouter</a>, mostly by coding agents, and InferenceX publishes agentic benchmarks for it on GB200 and GB300. The repository also models DeepSeek V4 Pro.</>],
  ['How is "63 input tokens per output" worked out?', <>OpenRouter's <a href={glm.mix.url}>GLM-5.3 page</a> publishes daily prompt, completion and cached token totals across all providers. From Sep 25 to Oct 24, 2026: 16,992B prompt tokens and 271B completion tokens (reasoning included), 62.7 to 1, with 90.3% of prompt tokens read from cache. The <a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a> and raw data are in the repository.</>],
  ['Are reasoning tokens counted?', <>Yes. A reasoning token takes the same GPU work as any other output token, and OpenRouter bills it at the output price. 71% of GLM-5.3 output tokens on OpenRouter are reasoning (63% to 76% day to day): of about 1,067 output tokens per request, about 306 are the visible answer.</>],
  ['What does GPU utilization mean, and why 65%?', <>
    <p>The share of the rack's measured capacity that is sold, averaged over the day. A rack has to be ready for its busiest times, so it sells the average share of them:</p>
    <ul>
      <li>across days, OpenRouter's open-model traffic averages 81–84% of its week's busiest day (<a href={`${REPO}/blob/main/research/openrouter_load_shape.py`}>calculation</a>)</li>
      <li>within a day, Azure chat traffic averages 77% of its busiest hour (<a href="https://github.com/Azure/AzurePublicDataset/blob/master/AzureLLMInferenceDataset2024.md">Azure LLM Inference Dataset 2024</a>; <a href="https://arxiv.org/abs/2408.00741">DynamoLLM</a> puts peaks at 1.7× the average for chat, 2.8× for coding); worldwide agent traffic is flatter (<a href="https://arxiv.org/abs/2607.19349">FineServe</a>, 2026)</li>
      <li>a high-traffic model gets the upper end, with headroom for bursts: 0.84 × 0.82 × 0.95 ≈ 65%</li>
      <li>first-party services run higher (DeepSeek's fleet averaged 82% of its peak); multi-model marketplaces lower (Alibaba's GPUs were 13–34% busy, <a href="https://ennanzhai.github.io/pub/sosp25-aegaeon.pdf">Aegaeon</a>)</li>
      <li>a new provider also has to win <a href="https://openrouter.ai/docs/guides/providers/traffic-routing">OpenRouter's routing</a> on price, speed and reliability to get traffic at all</li>
    </ul>
    <p>Renting and owning get the same 65%: a single rack cannot hand back part of itself when demand drops.</p>
  </>],
  ['Why multiply the benchmark by utilization?', <>InferenceX measures the most the rack can produce while every user still gets 95 tok/s. Utilization is the share of that with paying traffic behind it; lighter demand gives users faster responses at the same price per token. Read differently, the benchmark's cache accounting puts real traffic at 231 to 308 tokens/s per GPU rather than 269.</>],
  ['Why does faster output per user lower profit?', <>A GPU serves many users at once. Faster output for each means fewer users per GPU, so the rack makes fewer tokens in total. Prices stay fixed here; fast tiers on OpenRouter charge about 1.5×.</>],
  ['Why is owning so much cheaper than renting on demand?', <>An owned GB200 costs about ${ownPerGpuHr.toFixed(2)} per GPU-hour all-in, against ${rack.rentUsdPerGpuHr.value.toFixed(2)} on demand. The on-demand price pays for the cloud's margin, its spare capacity and the right to hand the rack back. Owning or a contract trades that flexibility for price.</>],
  ['What about NVIDIA\'s "$5M in, $75M of tokens out"?', <>That needs 5,505 output tokens/s per GPU, sold every second for three years. On agentic traffic InferenceX measures 312 on GB200 at 95 tok/s per user.</>],
  ['What overhead is included, and what is left out?', <>0.5% of revenue by default: on-call engineering, customer support, billing and the API front end, assuming a lean team or one shared across many racks. A stand-alone rack would spend several times more. Owning adds $400 a day of hardware operations and 4% of the rack price a year for support and spares. Taxes, marketing and sales are left out.</>],
  ['How current is this?', <>Prices, traffic and throughput are as of {A.version}. They move fast: GLM throughput on GB200 roughly quadrupled between August and October 2026, and new-contract rents rose through the year. Each data snapshot is tagged in the repository.</>],
  ['Can I change the assumptions or contribute?', <>Every input above is a slider or a toggle, and the link records your settings. Corrections and newer data are welcome as pull requests on <a href={REPO}>GitHub</a>.</>],
];

export function Faq() {
  return (
    <details className="fold" id="faq" data-testid="faq">
      <summary><h2>FAQ</h2></summary>
      <dl className="faq">
        {ITEMS.map(([q, a]) => (
          <div key={q}>
            <dt>{q}</dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
