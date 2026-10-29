import { curveFor, defaultSettings, evaluate, fmtPct, fmtUsdPerM, inputsFromSettings, type Settings } from '@token-margin/engine';
import { useEffect } from 'react';
import { A } from '../data';
import { REPO } from '../links';

const glm = A.models.glm53;
const median = glm.pricePresets.median;
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
// Where the GPU time goes on the default day: the benchmark's decode time against the prefill OpenRouter's traffic adds.
const cachePoint = 1 - dayWith({ cacheHit: di.cacheHit - 0.01 }).capacityPerGpu / dayWith({}).capacityPerGpu;
const prefillShare = prefillSecPerOut / (decodeSecPerOut + prefillSecPerOut);

/** Short answers to the questions readers ask first, each folded until tapped. */
const ITEMS: Array<[string, string, React.ReactNode]> = [
  ['faq-throughput', 'Where does the throughput number come from?', <>InferenceX's agentic benchmark, which replays 393 Claude Code sessions on GLM-5.2 (the same architecture as GLM-5.3) in NVFP4 on Dynamo SGLang and reports output tokens/s per GPU at each per-user speed. Those sessions carry longer conversations than OpenRouter's average, and longer conversations are slower to serve, so real traffic may run somewhat faster than measured. The receipt then adjusts for OpenRouter's traffic mix, uptime and utilization.</>],
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
      <li>DeepSeek's <a href="https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md">$38 of revenue per GPU-hour</a> comes from a lab serving its own model on its own stack, with capacity that grows with demand.</li>
      <li>Serving software is improving fast. 25% more tokens per GPU takes the margin from {contract}% to {fasterContract}% on the contract and from {onDemand}% to {fasterOnDemand}% on demand.</li>
    </ul>
  </>],
  ['faq-levers', 'Where do kernels, speculative decoding and routing show up?', <>
    <p>Only in the throughput. The page has no control for serving software; its throughput is one measured run, and a better stack shows up as a higher number. On OpenRouter's traffic a GB200 spends about {fmtPct(prefillShare)} of its time on prefill (fresh input) and {fmtPct(1 - prefillShare)} on decode (output), so prefill speed matters more than decode speed here.</p>
    <ul>
      <li>Prefill gets faster with attention and FP4 GEMM kernels, and with chunk sizes tuned to the context lengths.</li>
      <li>Decode gets faster with speculative decoding, MoE kernels and wider expert parallelism. The run already drafts up to 6 tokens a step with EAGLE.</li>
      <li>The page assumes the ideal split between prefill and decode GPUs. A real deployment loses some capacity to worker block sizes unless its split is tuned to its traffic.</li>
    </ul>
    <p>The two biggest gains are on the sliders. Cache hits rise when a conversation is routed back to the rack that holds its cache and when caches stay longer in GPU and CPU memory. Utilization rises with batch or off-peak pricing, or a second model on the rack to fill the quiet hours.</p>
  </>],
  ['faq-glm', 'Why GLM-5.3?', <>It is MIT-licensed, among the most used models on <a href={glm.mix.url}>OpenRouter</a>, mostly by coding agents, and InferenceX publishes agentic benchmarks for it on GB200 and GB300. The repository also models DeepSeek V4 Pro.</>],
  ['faq-ratio', 'How is "63 input tokens per output" worked out?', <>OpenRouter's <a href={glm.mix.url}>GLM-5.3 page</a> publishes daily prompt, completion and cached token totals across all providers. From Sep 25 to Oct 24, 2026: 16,992B prompt tokens and 271B completion tokens (reasoning included), 62.7 to 1, with 90.3% of prompt tokens read from cache. The <a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a> and raw data are in the repository.</>],
  ['faq-cache', 'Why does the cache rate matter so much?', <>Cached input bills at {fmtUsdPerM(median.cacheUsdPerM)} per million instead of {fmtUsdPerM(median.inUsdPerM)} and skips prefill, which is where most of the GPU time goes on this traffic. A miss means {glm.mix.islOsl} more fresh tokens to prefill per 100 output tokens, so each point of cache hit is about {fmtPct(cachePoint)} of the rack's capacity. The {fmtPct(glm.mix.cacheHit)} comes from OpenRouter's daily cached-token counts across all GLM-5.3 providers ({fmtPct(glm.mix.range!.cacheHit[0])} to {fmtPct(glm.mix.range!.cacheHit[1])} by day). It is what providers report in each response, which is also what OpenRouter bills from. Agents resend their context every turn, so hits depend on a conversation's later turns coming back to the rack that holds its cache.</>],
  ['faq-prices', 'Which prices does it use?', <>The Median preset is the {glm.priceNotes.median}, taken separately for output, fresh input and cached input. Low is {glm.priceNotes.floor}; High is {glm.priceNotes.list}. Cache writes are free on all but one endpoint, so the page does not charge for them.</>],
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
  ['faq-benchmark', 'Why multiply the benchmark by utilization?', <>InferenceX measures the most the rack can produce while every user still gets 95 tok/s. Utilization is the share of that with paying traffic behind it; lighter demand gives users faster responses at the same price per token. The benchmark's cache accounting can be read two ways, which puts real traffic between 231 and 308 tokens/s per GPU rather than at 269.</>],
  ['faq-speed', 'Why does faster output per user lower profit?', <>The slider is p90: the speed the slowest tenth of requests get. A GPU serves many users at once. Faster output for each means fewer users per GPU, so the rack makes fewer tokens in total. Prices stay fixed here; fast tiers on OpenRouter charge about 1.5×.</>],
  ['faq-rent', 'How is the rent set?', <>The 3-year contract is the 75th percentile of what 2026 deals are reported at, because new-contract prices rose through the year: ${A.racks.gb200.contractUsdPerGpuHr.value.toFixed(2)} per GPU-hour for GB200 and ${A.racks.gb300.contractUsdPerGpuHr.value.toFixed(2)} for GB300. The last contracts with public terms are HIVE's: $261/hr for a GB200 rack over 3 years (Jun 2026) and $285/hr for GB300 over 5 (Aug 2026). GB200 and GB300 racks are hard to buy on demand at all, so the on-demand option uses the cheapest list price as an assumed equivalent: CoreWeave's $756/hr ($42/hr per 4-GPU node, sold as full racks), with AWS at $762 and Oracle at $1,152; for GB300, Verda's $894 and Oracle's $1,296.</>],
  ['faq-owning', 'Why is owning so much cheaper than renting on demand?', <>The on-demand price pays for the cloud's margin, its spare capacity and the right to hand the rack back; owning or a contract trades that flexibility for price. An owned rack's price, less 10% resale, is spread over 4 years as equal yearly payments that include 9% a year on the money tied up in it, the same as paying off a 9% loan; support, operations, space and power come on top. Pick Own above to see each line.</>],
  ['faq-nvidia', 'What about NVIDIA\'s "$5M in, $75M of tokens out"?', <>NVIDIA's <a href={A.sources['nvidia-inferencemax-blog'].url}>InferenceMAX post</a> says a $5M GB200 NVL72 produces $75M of tokens over three years. That needs 5,505 output tokens/s per GPU, sold every second; on agentic traffic InferenceX measures 312 on GB200 at 95 tok/s per user.</>],
  ['faq-overhead', `What overhead is included, and why ${fmtPct(A.defaults.overheadPct)}?`, <>Billing, customer support, on-call engineering and the API front end, at {fmtPct(A.defaults.overheadPct)} of revenue by default. About 1% is billing: <a href="https://stripe.com/pricing">Stripe</a> charges 2.9% + 30¢ on card payments and 0.4% on invoices, while traffic through OpenRouter costs the provider nothing, because the buyer pays the fee and <a href="https://openrouter.ai/docs/faq">OpenRouter passes provider prices through without markup</a>. About 1% is people: a 24/7 on-call, support and API team of 20 to 30 spread across a fleet of 100 racks. A smaller fleet spends more, and public companies spend far more: <a href="https://www.sec.gov/Archives/edgar/data/1769628/000176962826000104/crwv-20251231.htm">CoreWeave</a>'s general and administrative expense was 12.7% of revenue in 2025, with growth hiring and stock compensation the page leaves out. The rack price already covers CPUs, networking and storage. Owning adds $400 a day of hardware operations and 4% of the rack price a year for support and spares. Taxes, marketing and sales are left out.</>],
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

/** A link into one FAQ entry: opens the FAQ and the entry before the browser jumps to it. */
export function FaqLink({ id, children }: { id: string; children: React.ReactNode }) {
  return <a href={`#${id}`} onClick={() => openFaqEntry(id)}>{children}</a>;
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
