import { A } from '../data';
import { REPO } from '../links';

const glm = A.models.glm53;
const rack = A.racks.gb200;

/** Short answers to the questions readers ask first. Folded by default. */
const ITEMS: Array<[string, React.ReactNode]> = [
  ['Why one rack and one day?', <>An NVL72 rack is how these GPUs are built: 72 of them share one NVLink network, and large models are served across many of them at once. One day keeps every number small enough to check by hand.</>],
  ['Why GLM-5.3?', <>It is an MIT-licensed open-weights model, among the most used on <a href={glm.mix.url}>OpenRouter</a>, mostly by coding agents, and InferenceX publishes agentic benchmarks for it on both GB200 and GB300. The repository also models DeepSeek V4 Pro.</>],
  ['How is "63 input tokens per output" worked out?', <>OpenRouter's <a href={glm.mix.url}>GLM-5.3 page</a> publishes daily totals of prompt, completion and cached tokens across all providers. From Sep 25 to Oct 24, 2026, prompts came to 16,992B tokens and completions to 271B (reasoning included): 62.7 to 1. 90.3% of prompt tokens were cache reads. The <a href={`${REPO}/blob/main/research/openrouter_ratios.py`}>calculation</a> and the raw data are in the repository.</>],
  ['Are reasoning tokens counted?', <>Yes. A reasoning token takes the same GPU work to generate as any other output token, and OpenRouter bills it at the output price. On GLM-5.3, 71% of output tokens on OpenRouter are reasoning (63% to 76% day to day): of about 1,067 output tokens per request, about 306 are the visible answer.</>],
  ['How optimized is the serving setup?', <>It is InferenceX's tuned, public recipe on nightly builds, not a default install. On GB200: NVIDIA Dynamo with SGLang, prefill and decode on separate GPUs (24 and 16), NVFP4 weights with an FP8 KV cache, speculative decoding (EAGLE multi-token prediction, up to 6 draft tokens), FlashInfer MoE kernels, experts spread across 16 GPUs with data-parallel attention, KV-cache-aware routing that keeps a conversation's turns on the same prefill GPUs, and KV cache offload to 721 GB of CPU memory. It is strong but not necessarily the best possible: GLM's throughput on GB200 roughly quadrupled between August and October 2026, and private stacks may do better. The <a href="https://github.com/SemiAnalysisAI/InferenceX">recipes</a> and <a href="https://github.com/SemiAnalysisAI/InferenceX/actions/runs/39765601214/attempts/2">run logs</a> are public.</>],
  ['What does GPU utilization mean, and why 45%?', <>It is the share of the rack's measured capacity that is sold, averaged over the day. One rack has to be ready for the busiest hours, so it sells only the average share of them. On OpenRouter, the average day for open models is 68% of the busiest day of the month. Within a day, chat traffic on Azure averages 71% of its busiest 5 minutes (<a href="https://github.com/Azure/AzurePublicDataset/blob/master/AzureLLMInferenceDataset2024.md">Azure LLM Inference Dataset 2024</a>; peak load is 1.7× the average for chat and 2.8× for coding, per <a href="https://arxiv.org/abs/2408.00741">DynamoLLM</a>). Keeping speed steady at peaks needs about 10% headroom. 0.68 × 0.71 × 0.9 ≈ 45%. For comparison, Alibaba's model marketplace ran its GPUs 13–34% busy (<a href="https://ennanzhai.github.io/pub/sosp25-aegaeon.pdf">Aegaeon</a>), and DeepSeek's busy first-party service averaged 82% of its peak fleet. A new provider also has to win <a href="https://openrouter.ai/docs/guides/providers/traffic-routing">OpenRouter's routing</a> on price, speed and reliability to get traffic at all. The same 45% applies to renting and owning, because a single rack cannot hand back part of itself when demand drops.</>],
  ['Why multiply the benchmark by utilization?', <>InferenceX measures the most the rack can produce while every user still gets 95 tok/s, with as many agent sessions running as that allows. Utilization is the share of that capacity with paying traffic behind it. When demand is lower the GPUs run lighter and users get faster responses, but they pay the same per token. The benchmark also counts a slightly different prompt load than OpenRouter's traffic; depending on how its cache accounting is read, real traffic gets 256 to 308 tokens/s per GPU rather than 276.</>],
  ['Why does faster output per user lower profit?', <>A GPU serves many users at once. Faster output for each user means fewer users per GPU, so the rack makes fewer tokens in total. Prices stay fixed here; fast tiers on OpenRouter charge about 1.5×.</>],
  ['Why is owning so much cheaper than renting on demand?', <>An owned GB200 costs about $2.91 per GPU-hour all-in, against ${rack.rentUsdPerGpuHr.value.toFixed(2)} on demand. The on-demand price pays for the cloud's margin and spare capacity, and for being able to hand the rack back; owning or a contract trades that flexibility for price.</>],
  ['What about NVIDIA\'s "$5M in, $75M of tokens out"?', <>That needs 5,505 output tokens/s per GPU, sold every second for three years. On agentic traffic InferenceX measures 312 on GB200 at 95 tok/s per user.</>],
  ['What is left out?', <>Sales, customer support, payment fees and taxes. The overhead slider adds the first three as a share of revenue.</>],
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
