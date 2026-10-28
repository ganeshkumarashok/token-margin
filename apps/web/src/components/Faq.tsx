import { curveFor, defaultSettings, evaluate, inputsFromSettings, type Settings } from '@token-margin/engine';
import { A } from '../data';
import { REPO } from '../links';

const glm = A.models.glm53;
const IX = 'https://github.com/SemiAnalysisAI/InferenceX';
const rack = A.racks.gb200;
// Owned GB200 at the defaults: all-in cost per GPU-hour, before overhead.
const ownDay = evaluate(inputsFromSettings(A, { ...defaultSettings(A), tenure: 'own' }), curveFor(A, 'gb200')).daily;
const ownPerGpuHr = (ownDay.costUsd - ownDay.overheadUsd) / (ownDay.gpus * 24);
/** Margin at the defaults with some settings changed, as a whole percent. */
function marginWith(over: Partial<Settings>): number {
  const s = { ...defaultSettings(A), ...over };
  return Math.round((evaluate(inputsFromSettings(A, s), curveFor(A, s.rack, s.model)).daily.operatingMargin ?? 0) * 100);
}
const cheapRent = marginWith({ rack: 'gb300', rentUsdPerGpuHr: 5, pricePreset: 'list', utilization: 0.6 });
const contract = marginWith({ rentBasis: 'contract' });
const own = marginWith({ tenure: 'own' });
const onDemand = marginWith({});
// 25% more tokens per GPU: revenue and overhead grow by a quarter, rent does not.
const today = evaluate(inputsFromSettings(A, defaultSettings(A)), curveFor(A, 'gb200')).daily;
const faster = Math.round((1 - A.defaults.overheadPct - (today.costUsd - today.overheadUsd) / (1.25 * today.revenueUsd)) * 100);

/** Short answers to the questions readers ask first. Folded by default. */
const ITEMS: Array<[string, React.ReactNode]> = [
  ['How optimized is the serving setup?', <>
    <p>The GB200 throughput comes from the run with 24 prefill and 16 decode GPUs in InferenceX's public <a href={`${IX}/blob/4416f5e2f66c999d718573736388f102023ab562/inferencex-e2e/benchmarks/multi_node/srt-slurm-recipes/glm5.2/sglang/gb200-fp4/agentx/disagg-variants.yaml#L303`}>recipe</a> (<a href={`${IX}/actions/runs/39765601214/attempts/2`}>run logs</a>). It uses:</p>
    <ul>
      <li>NVIDIA Dynamo in front of SGLang, both development builds from October 2026</li>
      <li>prefill and decode on separate GPUs: 24 for prefill (three workers of 8 GPUs) and 16 for decode (one worker), 40 GPUs in all, with throughput reported per GPU</li>
      <li>NVFP4 weights and an FP8 KV cache</li>
      <li>speculative decoding with EAGLE, up to 6 draft tokens per step</li>
      <li>experts spread across the 16 decode GPUs, with data-parallel attention</li>
      <li>FlashInfer kernels for the MoE layers</li>
      <li>KV-cache-aware routing that keeps a session's turns on the same prefill worker</li>
      <li>prefill caches that overflow from GPU to CPU memory (SGLang HiCache)</li>
    </ul>
    <p>It is a strong setup, not necessarily the best: GLM's throughput on GB200 at 100 tok/s per user went from 69 to 287 tokens/s per GPU between August and October 2026, and providers with their own stacks may do better.</p>
  </>],
  ['Other estimates show 50–90% margins; why is this lower?', <>Rent explains most of it. Such estimates often charge about $5 per GB300-hour, close to what an owner or a large multi-year deal pays, while one rack rents for ${A.racks.gb300.rentUsdPerGpuHr.value.toFixed(2)} on demand. With $5 rent and list prices, this page also gives a GB300 {cheapRent}% at 60% utilization, and its own contract and owning options come to {contract}% and {own}%. Two smaller differences: the page adjusts the benchmark to OpenRouter's real traffic, whose 63 input tokens per output load prefill harder than the benchmark sessions, and it prices at the median provider rather than the model's list price. First-party figures such as DeepSeek's <a href="https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md">$38 of revenue per GPU-hour</a> (V4.1 Flash, off-peak prices) come from a lab serving its own model on its own stack, with capacity that scales with demand. The answer also depends on further optimization: serving software is improving quickly, and 25% more tokens per GPU would take the on-demand margin from {onDemand}% to {faster}%.</>],
  ['Why one rack and one day?', <>An NVL72 rack is how these GPUs are built: 72 of them share one NVLink network, and large models are served across many of them at once. One day keeps every number small enough to check by hand.</>],
  ['Why GLM-5.3?', <>It is an MIT-licensed open-weights model, among the most used on <a href={glm.mix.url}>OpenRouter</a>, mostly by coding agents, and InferenceX publishes agentic benchmarks for it on both GB200 and GB300. The repository also models DeepSeek V4 Pro.</>],
  ['How is "63 input tokens per output" worked out?', <>OpenRouter's <a href={glm.mix.url}>GLM-5.3 page</a> publishes daily totals of prompt, completion and cached tokens across all providers. From Sep 25 to Oct 24, 2026, prompts came to 16,992B tokens and completions to 271B (reasoning included): 62.7 to 1. 90.3% of prompt tokens were cache reads. The <a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a> and the raw data are in the repository.</>],
  ['Are reasoning tokens counted?', <>Yes. A reasoning token takes the same GPU work to generate as any other output token, and OpenRouter bills it at the output price. On GLM-5.3, 71% of output tokens on OpenRouter are reasoning (63% to 76% day to day): of about 1,067 output tokens per request, about 306 are the visible answer.</>],
  ['What does GPU utilization mean, and why 65%?', <>It is the share of the rack's measured capacity that is sold, averaged over the day. One rack has to be ready for the busiest times, so it sells the average share of them. Across days: on OpenRouter, the average day for open models is 81–84% of the busiest day of its week (comparing within each week keeps demand growth out; <a href={`${REPO}/blob/main/research/openrouter_load_shape.py`}>calculation</a>). Within a day: chat traffic on Azure averages 77% of its busiest hour (<a href="https://github.com/Azure/AzurePublicDataset/blob/master/AzureLLMInferenceDataset2024.md">Azure LLM Inference Dataset 2024</a>; <a href="https://arxiv.org/abs/2408.00741">DynamoLLM</a> puts peaks at 1.7× the average for chat and 2.8× for coding), while agent traffic from users worldwide is flatter: a 2026 study of a 57-model marketplace found no pronounced daily pattern (<a href="https://arxiv.org/abs/2607.19349">FineServe</a>). For a high-traffic model like GLM-5.3 the page takes the upper end of that evidence, with a little headroom for bursts: 0.84 × 0.82 × 0.95 ≈ 65%. Busy first-party services run higher (DeepSeek's average fleet was 82% of its peak); multi-model marketplaces run lower (Alibaba's GPUs were 13–34% busy, <a href="https://ennanzhai.github.io/pub/sosp25-aegaeon.pdf">Aegaeon</a>). A new provider also has to win <a href="https://openrouter.ai/docs/guides/providers/traffic-routing">OpenRouter's routing</a> on price, speed and reliability to get traffic at all. The same 65% applies to renting and owning, because a single rack cannot hand back part of itself when demand drops.</>],
  ['Why multiply the benchmark by utilization?', <>InferenceX measures the most the rack can produce while every user still gets 95 tok/s, with as many agent sessions running as that allows. Utilization is the share of that capacity with paying traffic behind it. When demand is lower the GPUs run lighter and users get faster responses, but they pay the same per token. The benchmark also counts a slightly different prompt load than OpenRouter's traffic; depending on how its cache accounting is read, real traffic gets 231 to 308 tokens/s per GPU rather than 269.</>],
  ['Why does faster output per user lower profit?', <>A GPU serves many users at once. Faster output for each user means fewer users per GPU, so the rack makes fewer tokens in total. Prices stay fixed here; fast tiers on OpenRouter charge about 1.5×.</>],
  ['Why is owning so much cheaper than renting on demand?', <>An owned GB200 costs about ${ownPerGpuHr.toFixed(2)} per GPU-hour all-in, against ${rack.rentUsdPerGpuHr.value.toFixed(2)} on demand. The on-demand price pays for the cloud's margin and spare capacity, and for being able to hand the rack back; owning or a contract trades that flexibility for price.</>],
  ['What about NVIDIA\'s "$5M in, $75M of tokens out"?', <>That needs 5,505 output tokens/s per GPU, sold every second for three years. On agentic traffic InferenceX measures 312 on GB200 at 95 tok/s per user.</>],
  ['What overhead is included, and what is left out?', <>Overhead defaults to 0.5% of revenue for on-call engineering, customer support, billing and the API front end. That assumes a lean team, or one shared across many racks: these costs barely grow with the number of racks, so their share of revenue falls with scale, and a stand-alone single rack would spend several times more. Owning adds $400 a day of hardware operations and 4% of the rack price a year for support and spares. Taxes, marketing and sales beyond that are left out.</>],
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
