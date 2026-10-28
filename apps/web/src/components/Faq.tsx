import { curveFor, defaultSettings, evaluate, fmtPct, fmtUsdInt, inputsFromSettings, type Settings } from '@token-margin/engine';
import { useEffect } from 'react';
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
// Levers the controls do not show, sized on the default day. A software gain reaches the page only as a higher measured curve.
const today = dayWith({});
const prefillShare = prefillSecPerOut / (decodeSecPerOut + prefillSecPerOut);
/** Capacity gained when decode and prefill each get faster by the given factor. */
const gain = (decode: number, prefill: number) => (decodeSecPerOut + prefillSecPerOut) / (decodeSecPerOut / decode + prefillSecPerOut / prefill) - 1;
const prefillGain = gain(1, 1.2);
const decodeGain = gain(1.2, 1);
/** Profit added by k times the tokens: revenue and overhead scale, rent does not. */
const moreTokensUsd = (k: number) => today.revenueUsd * k * (1 - A.defaults.overheadPct) - (today.costUsd - today.overheadUsd) - today.operatingProfitUsd;
const cachePoint = 1 - dayWith({ cacheHit: di.cacheHit - 0.01 }).capacityPerGpu / today.capacityPerGpu;
const cacheUsd = dayWith({ cacheHit: di.cacheHit + 0.05 }).operatingProfitUsd - today.operatingProfitUsd;
const utilUsd = dayWith({ utilization: di.utilization + 0.1 }).operatingProfitUsd - today.operatingProfitUsd;

/** Short answers to the questions readers ask first, each folded until tapped. */
const ITEMS: Array<[string, string, React.ReactNode]> = [
  ['faq-setup', 'How optimized is the serving setup?', <>
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
  ['faq-estimates', 'Other estimates show 50–90% margins; why is this lower?', <>
    <p>Rent explains most of it.</p>
    <ul>
      <li>They charge about $5 per GB300-hour, roughly what an owner or a large multi-year deal pays; on demand, one rack costs ${A.racks.gb300.rentUsdPerGpuHr.value.toFixed(2)}. At $5 rent and list prices this page gives a GB300 {cheapRent}% at 60% utilization, and its own contract and owning cases are {contract}% and {own}%.</li>
      <li>This page uses OpenRouter's real traffic, whose 63 input tokens per output load prefill harder than the benchmark sessions, and median provider prices rather than list.</li>
      <li>DeepSeek's <a href="https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md">$38 of revenue per GPU-hour</a> is a lab serving its own model on its own stack, with capacity that scales with demand.</li>
      <li>Serving software is improving fast. 25% more tokens per GPU takes the margin from {contract}% to {fasterContract}% on the contract and from {onDemand}% to {fasterOnDemand}% on demand.</li>
    </ul>
  </>],
  ['faq-levers', 'How would a provider raise the margin beyond these controls?', <>
    <p>The throughput here is one measured run, so a software gain reaches the page only as a higher curve. On OpenRouter's traffic a GB200 spends about {fmtPct(prefillShare)} of its time on prefill (fresh input) and {fmtPct(1 - prefillShare)} on decode (output), which sets the size of each lever on the default day:</p>
    <ul>
      <li>cache hits: each point is about {fmtPct(cachePoint)} of capacity, and 5 points more ({fmtPct(di.cacheHit)} to {fmtPct(di.cacheHit + 0.05)}) add {fmtUsdInt(cacheUsd)} a day. Routing a conversation back to the rack that holds its cache, and keeping caches longer in GPU and CPU memory, is what moves it</li>
      <li>faster prefill, from attention and FP4 GEMM kernels and chunk sizes tuned to the context lengths: 20% faster is {fmtPct(prefillGain)} more capacity, about {fmtUsdInt(moreTokensUsd(1 + prefillGain))} a day</li>
      <li>faster decode, from speculative decoding (the run already drafts up to 6 tokens a step with EAGLE), MoE kernels and wider expert parallelism: 20% faster is {fmtPct(decodeGain)} more capacity, about {fmtUsdInt(moreTokensUsd(1 + decodeGain))} a day, because decode is the smaller share on this traffic</li>
      <li>the prefill-to-decode split: the page assumes the ideal split for the traffic, and a real deployment loses about {tilingLoss}% to worker block sizes unless it is tuned to what it serves</li>
      <li>selling more of the capacity: 10 more points of utilization add {fmtUsdInt(utilUsd)} a day; batch or off-peak pricing and a second model on the rack fill the quiet hours</li>
    </ul>
  </>],
  ['faq-glm', 'Why GLM-5.3?', <>It is MIT-licensed, among the most used models on <a href={glm.mix.url}>OpenRouter</a>, mostly by coding agents, and InferenceX publishes agentic benchmarks for it on GB200 and GB300. The repository also models DeepSeek V4 Pro.</>],
  ['faq-ratio', 'How is "63 input tokens per output" worked out?', <>OpenRouter's <a href={glm.mix.url}>GLM-5.3 page</a> publishes daily prompt, completion and cached token totals across all providers. From Sep 25 to Oct 24, 2026: 16,992B prompt tokens and 271B completion tokens (reasoning included), 62.7 to 1, with 90.3% of prompt tokens read from cache. The <a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a> and raw data are in the repository.</>],
  ['faq-reasoning', 'Are reasoning tokens counted?', <>Yes. A reasoning token takes the same GPU work as any other output token, and OpenRouter bills it at the output price. 71% of GLM-5.3 output tokens on OpenRouter are reasoning (63% to 76% day to day): of about 1,067 output tokens per request, about 306 are the visible answer.</>],
  ['faq-utilization', 'What does GPU utilization mean, and why 65%?', <>
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
  ['faq-benchmark', 'Why multiply the benchmark by utilization?', <>InferenceX measures the most the rack can produce while every user still gets 95 tok/s. Utilization is the share of that with paying traffic behind it; lighter demand gives users faster responses at the same price per token. Read differently, the benchmark's cache accounting puts real traffic at 231 to 308 tokens/s per GPU rather than 269.</>],
  ['faq-speed', 'Why does faster output per user lower profit?', <>A GPU serves many users at once. Faster output for each means fewer users per GPU, so the rack makes fewer tokens in total. Prices stay fixed here; fast tiers on OpenRouter charge about 1.5×.</>],
  ['faq-owning', 'Why is owning so much cheaper than renting on demand?', <>The on-demand price pays for the cloud's margin, its spare capacity and the right to hand the rack back; owning or a contract trades that flexibility for price. Pick Own above to see the cost broken into depreciation, financing, space, support, operations and power.</>],
  ['faq-nvidia', 'What about NVIDIA\'s "$5M in, $75M of tokens out"?', <>NVIDIA's <a href={A.sources['nvidia-inferencemax-blog'].url}>InferenceMAX post</a> says a $5M GB200 NVL72 produces $75M of tokens over three years. That needs 5,505 output tokens/s per GPU, sold every second; on agentic traffic InferenceX measures 312 on GB200 at 95 tok/s per user.</>],
  ['faq-overhead', 'What overhead is included, and what is left out?', <>0.5% of revenue by default: on-call engineering, customer support, billing and the API front end, assuming a lean team or one shared across many racks. A stand-alone rack would spend several times more. Owning adds $400 a day of hardware operations and 4% of the rack price a year for support and spares. Taxes, marketing and sales are left out.</>],
  ['faq-current', 'How current is this?', <>Prices, traffic and throughput are as of {A.version}. They move fast: GLM throughput on GB200 roughly quadrupled between August and October 2026, and new-contract rents rose through the year. Each data snapshot is tagged in the repository.</>],
  ['faq-contribute', 'Can I change the assumptions or contribute?', <>Every input above is a slider or a toggle, and the link records your settings. Corrections and newer data are welcome as pull requests on <a href={REPO}>GitHub</a>.</>],
];

/** Opens the FAQ and one of its entries, which a link to a folded element cannot do on its own. */
export function openFaqEntry(id: string) {
  const faq = document.getElementById('faq');
  const entry = document.getElementById(id);
  if (faq instanceof HTMLDetailsElement) faq.open = true;
  if (entry instanceof HTMLDetailsElement) entry.open = true;
}

function openFromHash() {
  const id = window.location.hash.slice(1);
  if (!id.startsWith('faq-')) return;
  openFaqEntry(id);
  // Scroll once the web fonts are in; before that the text above reflows and the entry drifts off screen.
  document.fonts.ready.then(() => document.getElementById(id)?.scrollIntoView());
}

export function Faq() {
  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);
  return (
    <details className="fold" id="faq" data-testid="faq">
      <summary><h2>FAQ</h2></summary>
      <div className="faq">
        {ITEMS.map(([id, q, a]) => (
          <details key={id} id={id}>
            <summary>{q}</summary>
            <div>{a}</div>
          </details>
        ))}
      </div>
    </details>
  );
}
