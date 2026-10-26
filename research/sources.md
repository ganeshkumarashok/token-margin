# Sources and working numbers (collected 2026-10-16)

Every default in `data/assumptions.json` must trace to a line here. Marks: P = primary (vendor/agency/benchmark site), S = secondary (press, blogs, resellers). Prices are USD.

## 1. GPU capex

| Item | Value | Date | Src | Link |
|---|---|---|---|---|
| GB200 NVL72 rack, bare | ~$3.1M | 2024, re-cited 2026 | S (SemiAnalysis) | https://newsletter.semianalysis.com/p/h100-vs-gb200-nvl72-training-benchmarks |
| GB200 NVL72 rack, all-in (networking, storage, etc.) | ~$3.9M → ~$54K/GPU | same | S | same |
| GB200 NVL72 rack, press | $2.8-3.4M (Tom's); ~$3M (Tae Kim) | 2025 | S | https://x.com/firstadopter/status/1940792115124228482 |
| GB200 GPU module alone | $40-50K | 2025-26 | S | https://www.datagravity.dev/p/how-much-does-an-nvidia-nvl72-cost |
| GB300 NVL72 rack, transacted small orders | just under $5.0M (no CDU); +$32K w/ 250 kW CDU → ~$69K/GPU slot | Aug 2026 | S (purchase orders reviewed) | https://www.datagravity.dev/p/how-much-does-an-nvidia-nvl72-cost |
| GB300 NVL72 deployed (excl. DC build, core switching, storage) | ~$5.68M → ~$79K/GPU | Aug 2026 | S | same |
| GB300 NVL72, analyst / press | $3.7-4.0M (Loop Capital, Mar 2025); $6-6.5M (Tom's, Mar 2026) | | S | https://finance.yahoo.com/sectors/technology/articles/price-nvidias-vera-rubin-nvl72-100000086.html |
| Compute trays share of rack value | ~87-90%; NVIDIA content >92% | 2026 | S | datagravity |
| HGX B200 8-GPU server, new | $360-470K (→ ~$45-59K/GPU); Supermicro listing $384K; DGX B200 $562K | Oct 2026 | S | https://www.amcompute.com/appraisals/b200 ; https://gpuperhour.com/blog/nvidia-gpu-prices |
| B200 used, per GPU | ~$14,250 (residual-value anchor) | Oct 2026 | S | https://www.amcompute.com/appraisals/b200 |
| Vera Rubin NVL72 (next gen, for deflation context) | up to $8.8M/rack | 2026 | S | yahoo link above |

## 2. GPU rental (buy-vs-rent baseline, and SemiAnalysis TCO anchors)

| Item | Value | Date | Src | Link |
|---|---|---|---|---|
| GB200 on-demand | CoreWeave $10.50/GPU-hr; Oracle ~$16; Azure ND GB200 v6 ~$27 | 2026 | S | https://www.spheron.network/blog/nvidia-gb200-nvl72-guide/ |
| GB300 committed lease | $3.70/GPU-hr (3-yr, 30 racks, EU); Verda on-demand $11.17 | 2026 | S | https://savrn.com/ai-index/pricing/gpus/gb300 |
| SemiAnalysis owning TCO, Jul 2026 survey | GB200 $1.86/chip-hr (hyperscaler), $2.26 (neocloud), $2.60-4.00 (retail); GB300 $2.31 / $5.00; B200 $1.73; B300 $2.26; H100 $1.17; H200 $1.22; VR200 $3.61; MI355X $1.50; TPUv7 $1.03 | Jul 2026 | P (InferenceX) | https://inferencex.semianalysis.com/chips/gb200-nvl72 ; https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300 |
| TCO basis | "server capex, power, colocation and cost of capital"; owning = 4-year economic useful life; "colocation rent and electricity cost typically make up less than 20% of TCO" | Oct 2025 | P | https://inferencex.semianalysis.com/blog/inferencemax-open-source-inference-benchmarking |
| Datagravity GB300 rack opex model | $240-410K/yr opex at $0.05-0.15/kWh; colo ~$318K/yr; $2.56-2.88 per utilized GPU-hr at 80-90% util, $3.84 at 60% | Aug 2026 | S | datagravity |

## 3. Power

| Item | Value | Src | Link |
|---|---|---|---|
| GB200 TDP | 1,200 W/chip; all-in 1.87 kW/chip incl. host CPU, NICs, cooling share | P (InferenceX) | https://inferencex.semianalysis.com/chips/gb200-nvl72 |
| GB300 TDP | 1,400 W/chip; all-in 2.12 kW/chip | P | https://inferencex.semianalysis.com/chips/gb300-nvl72 |
| GB300 NVL72 rack | 132 kW nominal TDP, ~155 kW EDPp peak, provision 192 kW busway | P (HPE) | https://www.hpe.com/us/en/collaterals/collateral.a50009244enw.html |
| GB200 NVL72 rack | ~120 kW (various); one tracker claims 1,000 W/GPU, which conflicts with SemiAnalysis's 1,200 W | S | https://flopper.io/system/nvidia-gb200-nvl72 |
| B200 (HGX) TDP | 1,000 W (NVIDIA HGX B200 datasheet) | P | https://gpusmith.com/datasheets/nvidia-hgx-b200-datasheet.pdf |
| PUE | hyperscale 1.09-1.15; industry avg 1.54 (Uptime 2025, flat 6 yrs); colo/enterprise 1.58-1.80 | S | https://mgrid.org/2025/10/01/uptime-institute-data-center-pue-stagnation-2025-liquid-cooling/ |
| InferenceX tok/s/MW | uses "all-in provisioned utility MW" built from TDP, not measured draw | P | inferencemax blog above |

Decomposition used in the model: IT kW/GPU = TDP + host/NIC share (~0.35 kW); facility kW = IT × PUE. With PUE 1.2 this reproduces InferenceX's 1.87 kW (GB200) and 2.12 kW (GB300).

## 4. Electricity (primary)

EIA Electric Power Monthly, Table 5.6.A, July 2026 (preliminary), ¢/kWh, U.S. total: Commercial 14.53 (Jul 2025: 14.05) · Industrial 9.77 (9.33) · Residential 18.31 · All sectors 14.99. June 2026 commercial 14.19; H1-2026 avg ~13.86. https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a

## 5. Colocation

| Item | Value | Date | Src | Link |
|---|---|---|---|---|
| NA wholesale avg | $195.94/kW-month (+6.5% YoY), base rent; ~$250 all-in w/ power+services | H2 2025 (CBRE via Encor) | S | https://encoradvisors.com/data-center-colocation-pricing/ |
| Context | power, not space, is the constraint; high-density AI colo priced on a separate track | 2026 | S | https://www.datacenterknowledge.com/colocation/power-not-space-the-colocation-battleground-in-2026 |

## 6. Model: GLM (Z.ai / Zhipu), open weights, MIT

| Model | Size | Date | Src | Link |
|---|---|---|---|---|
| GLM-5.3 | 744B total / 40B active MoE (HF safetensors: 753B); same base as GLM-5.2, post-training only | Aug 28 2026 | P | https://huggingface.co/zai-org/GLM-5.3 ; https://github.com/zai-org/GLM-5 |
| GLM-5.2 | 744B-A40B (vLLM recipe: ~743B, 39B active); FP8 fits 8×H200; 1M ctx claimed | Jun 2026 | P | https://huggingface.co/zai-org/GLM-5.2-FP8 ; https://recipes.vllm.ai/zai-org/GLM-5.2 |
| GLM-5 / 5.1 | 744B-A40B | Feb-Apr 2026 | P | https://huggingface.co/zai-org/GLM-5-FP8 |
| GLM-5.3-Flash | 320B-A18B | Aug 26 2026 | P | https://huggingface.co/zai-org/GLM-5.3-Flash |
| Press | GLM-5.2 "753B", beats GPT-5.5 on long-horizon coding at 1/6 cost | Jun 2026 | S | https://venturebeat.com/technology/z-ais-open-weights-glm-5-2-beats-gpt-5-5-on-multiple-long-horizon-coding-benchmarks-for-1-6th-the-cost |

InferenceX benchmarks "GLM 5/5.1 (744B)", which has the same architecture as 5.2/5.3, so its throughput applies to them.

## 7. Token prices (revenue side)

Z.ai list (per 1M tokens: input / cached input / output), P: https://docs.z.ai/guides/overview/pricing
- GLM-5.3, 5.2, 5.1: $1.40 / $0.26 / $4.40. GLM-5: $1.00 / $0.20 / $3.20. GLM-5.3-Flash: $0.15 / $0.03 / $0.50. GLM-5.3-FlashX: $0.37 / $0.075 / $1.25. GLM-4.7/4.6/4.5: $0.60 / $0.11 / $2.20.

OpenRouter per-provider endpoints for `z-ai/glm-5.3` (46 endpoints; snapshot `data/raw/openrouter/z-ai_glm-5.3_endpoints_2026-10-16.json`, public API `https://openrouter.ai/api/v1/models/z-ai/glm-5.3/endpoints`), P:
- At list ($1.40/$0.26/$4.40): Z.AI, Together, Fireworks, BaseTen, Mistral (nvfp4), Nebius, Crusoe, Parasail, Modal, Cloudflare, AtlasCloud, Venice, PrimeIntellect.
- Mid: CoreWeave fp8 $1.20/$0.19/$4.00; Friendli $1.26/$3.96; GMICloud $0.98/$3.08; DigitalOcean $0.91/$2.86; Phala $0.84/$2.64; Decart fp4 $0.84/$2.66.
- Floor tier (mainstream): DeepInfra fp4 $0.5625 / $0.125 / $2.50; Inceptron fp4 $0.55/$0.18/$2.20; Baidu fp8 $0.70/$0.13/$2.20; SiliconFlow & Novita fp8 $0.70/$0.13/$2.20; Tenstorrent fp8 $0.60/$0.10/$2.50; Io Net $0.49/$2.90; Sail Research fp8 $0.50/$0.12/$1.505.
- Outliers (very cheap input, output at/above list; likely edit/apply-specialised hosts): Relace $0.06/$4.40; Wafer fp4 $0.079/$4.80; InferenceNet fp4 $0.08/$4.38; Morph fp8 $0.085/$6.00; AkashML fp8 $0.19/$4.40; DekaLLM $0.18/$2.95.
- GLM-5.3-Flash floor: DeepInfra fp4 $0.075/$0.015/$0.25; StreamLake $0.075/$0.25; list $0.15/$0.03/$0.50.
- GLM-5.2 floor: DeepInfra fp4 $0.45/$0.084/$1.44.
- Per-provider throughput/latency fields are null without auth; real tok/s come from the OpenRouter model page or Artificial Analysis (§20h).

Market index (secondary): Silicon Data LLM Token Expenditure Index ~$0.97/M blended, Sep 1 2026 (usage-weighted). https://www.kucoin.com/blog/why-ai-token-costs-are-falling

## 8. Workload mix

- OpenRouter: agentic traffic ~5× human (7.3T vs 1.4T tokens, 7-day MA); >85% of agentic input tokens are cache hits. https://fourweekmba.com/ai-agents-burn-nearly-5x-the-tokens-people-do-on-openrouter/ ; https://openrouter.ai/data/newsletter
- Working assumption 72/28 input/output split (unmeasured). https://www.codesota.com/agentic/openrouter-apps

## 9. Token price deflation

- Epoch AI: price at constant capability falls 9×-900×/yr by milestone; ~40×/yr for GPT-4-level; fastest drops most recent, may not persist. https://epoch.ai/data-insights/llm-inference-price-trends ; https://epoch.ai/blog/llm-inference-price-trends
- Du (Mar 2026): ~600× decline 2020-26; price half-life 1.10 yr (economy tier), 1.55 yr (mid tier); flagship tier shows no clean exponential. https://arxiv.org/html/2603.28576v1
- "Price of Progress" (Nov 2025): cost-of-pass declines slower (24.5×/yr MATH500, 3.2×/yr AIME24). https://arxiv.org/html/2511.23455v1
- Same-model evidence: GLM-5.2 third-party floor fell from list $1.40/$4.40 (Jun 2026) to $0.45/$1.44 (Oct 2026) ≈ 3× in 4 months.

## 10. Throughput (InferenceX / SemiAnalysis; GLM 5/5.1 744B, FP4, 8K/1K ISL/OSL; TCO Jul 2026)

GB200 NVL72 vs GB300 NVL72: https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300

| tok/s/user | GB200 tok/s/chip | GB300 tok/s/chip | GB200 $/M | GB300 $/M | GB200 tok/s/MW | GB300 tok/s/MW |
|---|---|---|---|---|---|---|
| 67 | 9,135 | 10,192 | 0.057 | 0.063 | 4.89M | 4.81M |
| 104 | 3,619 | 4,394 | 0.143 | 0.146 | 1.94M | 2.07M |
| 141 | 630 | 837 | 0.820 | 0.766 | 0.34M | 0.39M |

B200 vs GB200 NVL72: https://inferencex.semianalysis.com/compare/glm-5-1-b200-vs-gb200/8k-1k

| tok/s/user | B200 tok/s/chip | GB200 tok/s/chip | B200 $/M | GB200 $/M |
|---|---|---|---|---|
| 58 | 2,532 | 9,598 | 0.190 | 0.054 |
| 86 | 1,796 | 6,589 | 0.268 | 0.078 |
| 114 | 1,385 | 1,997 | 0.347 | 0.259 |

- Curve band shown: 30-177 tok/s/user. Stacks: Dynamo SGLang / Dynamo TRT-LLM, ± MTP. Values "interpolated from real benchmark data". Disaggregated configs are per decode/prefill chip (not apples to apples).
- Formula: $/M = TCO($/chip-hr) × 1e6 / (3600 × tok/s/chip). https://inferencex.semianalysis.com/glossary/cost-per-million-tokens
- Token accounting: glossary says throughput "may be reported for total tokens or separated into input and output"; NVIDIA labels the axis "tokens per second per GPU"; NVIDIA's $5M→$75M claim back-solves to ~5.5K output tok/s/GPU, consistent with these being output (decode) tokens. Harness (SemiAnalysisAI/InferenceX `inferencex-e2e/infx/results/fixed_sequence.py`) emits both `tput_per_gpu` (total tokens) and `output_tput_per_gpu` (output tokens, denominator = decode GPUs when disaggregated); the dashboard's "per decode chip" footnote matches the output metric, so plotted tok/s/chip = output tokens per (decode) GPU. Interactivity = 1000/TPOT ms. §20a corrects this for the GLM curve: the figure used there is total tokens per GPU.
- Interactivity = decode tokens/s per user = 1/TPOT, excludes TTFT. https://inferencex.semianalysis.com/glossary/interactivity
- ISL randomized 80-100% of nominal per request. Scenarios: 1K/1K chat, 1K/8K reasoning, 8K/1K summarization. https://inferencex.semianalysis.com/blog/inferencemax-open-source-inference-benchmarking
- DeepSeek R1 reference points on GB200 NVL72: ~14,125 tok/s/GPU @25 tok/s/user (May 2026, FP4, Dynamo TRT-LLM, MTP, disagg) https://inferencex.semianalysis.com/blog/gb200-nvl72-vs-b200-disagg-deepseek-r1-fp4-dynamo-trt ; 4,972 @59 and 2,445 @98 (Oct 2025) https://inferencex.semianalysis.com/compare/deepseek-r1-gb200-vs-h200 ; SGLang 26K input / 13K output tok/s/GPU (prefill/decode) https://www.lmsys.org/blog/2025-10-14-sa-inference-max/
- NVIDIA blog on InferenceMAX: B200 ~10K TPS/GPU @50 TPS/user on Llama 3.3 70B; gpt-oss-120b ~30K TPS/GPU @100 TPS/user (Oct 2025). https://developer.nvidia.com/blog/nvidia-blackwell-leads-on-new-semianalysis-inferencemax-benchmarks/

## 11. Useful life / depreciation

- Hyperscalers 5-6 yr (Meta 5.5; Amazon cut 6→5 in 2025). Burry: economic life 2-3 yr, $176B under-depreciation 2026-28. Bernstein: 6 yr defensible. CoreWeave A100s (2020) at full utilization, rented through 2029. SemiAnalysis TCO uses 4 yr. https://www.datagravity.dev/p/how-long-does-a-gpu-last ; https://fourweekmba.com/ai-nvidia-gpu-depreciation-durability-debate-huang-2026/ ; https://beancount.io/blog/2026/07/10/gpu-cloud-depreciation-schedules-guide

## 12. Cost of capital

- GPU-backed debt 2026: CoreWeave/Meta A3 at SOFR+225 (fixed tranche ~5.9%); Lambda TLB Baa2 at SOFR+300; weaker credits +450-550; 2023-era private credit 10-15%; LTV 60-70%. SOFR ≈ 3.90% (Oct 6 2026) → ~6-7% best credit, ~8.5-9.5% typical neocloud. https://www.wing.vc/content/how-the-gpu-became-collateral ; https://www.datacenterdynamics.com/en/news/coreweave-secures-85bn-loan-for-gpu-purchases/ ; https://www.storagenewsletter.com/?p=305474 ; https://marketxls.com/indicators/sofr

## 13. The claim under test (NVIDIA "token factory")

- "$5 million investment in GB200 NVL72 yields $75 million in token revenue — 15× ROI" (InferenceMAX v1 launch, Oct 2025). Footnoted assumptions on an NVIDIA slide: single NVL72, 3-year operation, $2 per million output tokens, DeepSeek R1 (another NVIDIA page says gpt-oss-120b); 15× is framed relative to H200. https://blogs.nvidia.com/blog/blackwell-inferencemax-benchmark-results ; https://perspectives.nvidia.com/ai-infrastructure/total-cost-of-ownership/task/faq/revenue-per-rack-ai-inference-datacenter-economics/ ; https://mcomputers.cz/wp-content/uploads/2025/11/08_Koen_van_den_Berg_NVIDIA-Blackwell_-powering-the-next-generation-AI-Factories-EN-1.pdf
- GTC 2026 restatement (unverified secondary): 1 GW Vera Rubin factory → ~$150B token revenue vs ~$100B build. https://ai2.work/blog/jensen-huang-frames-ai-tokens-as-the-new-enterprise-currency-at-gtc

## 14. Market serving speed for GLM-5.3 (sets the interactivity default)

Artificial Analysis, GLM-5.3 providers page (10K-input workload; speed/price undated, latency p50 last 72h; fetched 2026-10-16) https://artificialanalysis.ai/models/glm-5-3/providers
- Output speed, mainstream endpoints: Z.ai 74 tok/s · DeepInfra 112 · Together 112 · Novita 98 · Baseten 94 · GMI 70 · DigitalOcean 45 · FriendliAI 167 · Parasail 175 · Modal 104.
- FP4 endpoints: Nebius 254 · Crusoe 198 · Supernova 269 · LithosAI 412. "FAST" tiers: 296-745.
- Prices where shown: DeepInfra $0.56/$2.50 (blended $0.45); Supernova FP4 $0.63/$1.98 (blended $0.41); GMI out $3.08.
- The market therefore serves GLM-5.3 at roughly 100 tok/s/user (median of mainstream endpoints), not 60. InferenceX GB200 throughput at 100 tok/s/user is ~4,300 output tok/s/GPU vs ~9,600 at 58. Default interactivity = 100.

## 15. Why OpenRouter is the price source (and its limits)

- It is the only public, machine-readable, dated quote of what ~40 independent hosts charge for the *same* open-weights model, so it exposes the price distribution (list vs floor) a new entrant faces. Its default routing is price-sorted, so the floor is where marketplace volume clears.
- It is the retail spot channel: the thinnest-margin way to sell tokens. Direct/enterprise contracts (list or discounted list with commitments) and first-party products realize more per token but are not observable. The model treats OpenRouter floor as the realizable price for a no-brand seller and list as an upper bound; a channel-mix knob covers the middle.
- Caveats: quantization differs by host (fp4 vs fp8), output price includes reasoning tokens, cache-read pricing varies, listed price ≠ realized volume, and snapshots age in weeks. Cross-check with Artificial Analysis (price + speed + quality) and Z.ai list; refresh snapshots on a schedule.

## 16. Real-world anchors for demand and tokens per GPU

- DeepSeek, Feb 27-28 2025 (24h, V3+R1 production, H800): 608B input tokens (56.3% cache hits), 168B output tokens at 20-22 tok/s/user; average 226.75 nodes (1,814 H800s), peak 278; per node 73.7K input + 14.8K output tok/s (→ ~9.2K in + ~1.85K out tok/s per GPU); cost $87,072/day at $2/GPU-hr; theoretical revenue at R1 prices $562,027/day → "545% cost-profit margin"; actual revenue "substantially lower" (V3 priced lower, free web/app, off-peak discounts). Source: DeepSeek open-infra-index "Inference System Overview"; coverage: https://www.analyticsvidhya.com/blog/2025/03/deepseek-inference-system-overview/ ; https://businessinsider.nl/deepseek-says-its-ai-models-would-have-a-545-profit-margin-if-everyone-who-uses-them-pays
  - Use: (1) real production output of ~1-2K tok/s per H800 GPU with real traffic and caching; (2) a top-5 global API moved ~776B tokens/day in early 2025, i.e. one GB200 rack at benchmark peak (~540B tokens/day incl. input) is a third to two-thirds of that; (3) per-GPU token revenue ≈ $12.9/GPU-hr theoretical vs ~$2 cost, so per-GPU economics are very profitable when demand exists, and the binding constraints are demand and price.
- OpenRouter platform volume (2026): ~7.3T agentic + ~1.4T human tokens/day (7-day MA, a16z chart of OpenRouter data), >85% of agentic input is cache hits. One GB200 rack at benchmark peak ≈ 6% of the entire platform's daily tokens; at the realistic preview (~70B/day) ≈ 0.8%. Per-model weekly volumes (GLM-5.3 share) are shown on OpenRouter's rankings UI but not in page HTML; §20c uses the per-model activity data instead. https://fourweekmba.com/ai-agents-burn-nearly-5x-the-tokens-people-do-on-openrouter/

## 17. Whole-rack rental prices (2026-10-17)

| Provider | Unit sold | NVL72 | $/GPU-hr | $/rack-hr | Kind |
|---|---|---|---|---|---|
| CoreWeave on-demand | 4-GPU GB200 tray, $42.00/hr; 18 trays = one rack | yes | 10.50 | 756 | P https://www.coreweave.com/pricing |
| AWS Capacity Blocks, u-p6e-gb200x72 | one whole 72-GPU rack, $761.904/UltraServer-hr | yes | 10.58 | 762 | P https://aws.amazon.com/ec2/capacityblocks/pricing/ |
| Verda GB300 NVL72 | 4-GPU trays, 2-18 trays (8-72 GPUs), pay-as-you-go | yes | 11.59 | 835 | P https://verda.com/instant-clusters |
| GMI Cloud GB200 | "from", indicative | yes | 8.00 | 576 | S https://www.gmicloud.ai/en/blog/gb200-nvl72-rental-price-reserve-vs-on-demand |
| Oracle BM.GPU.GB200.4 / GB300 | 4-GPU tray | yes | 16 / 18 | — | S (Oracle page blocks fetch) https://getdeploying.com/gpus/nvidia-gb200 |
| Azure ND GB200 v6 | 4-GPU VM; 1-yr $17.31, 3-yr $11.90 | not stated | 27.04 | — | S https://savrn.com/ai-index/pricing/gpus/gb200 |
| savrn median of 7 on-demand GB200 prices | — | — | 10.58 | 762 | S |
| CoreWeave committed | "up to 60% off on-demand", quoted via sales | — | ≥ 4.20 | — | P |
| Astra Intellectus GB300 | 30 racks, 3-year lease, EU | yes | 3.70 | 266 | S https://savrn.com/ai-index/pricing/gpus/gb300 |

Use: GB200 on-demand $10.50 (two primary sources within 1%); GB300 on-demand $11.59 (one primary source). No published committed GB200 NVL72 price; an earlier unsourced $2.50 lease assumption is withdrawn. No spot market exists for NVL72 racks (CoreWeave spot N/A; AWS sells Capacity Blocks only; Azure spot rows conflict). savrn's GB300 "typical" $14.59 was a median over single-GPU Verda rows, an Oracle tray via a tracker and Fireworks' inference platform, not whole-rack.

## 18. Prefill rate and the decode-GPU denominator (2026-10-17)

- InferenceX compare pages: disaggregated configurations "calculate output throughput per decode chip or per prefill chip, rather than per total chip count". https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300/8k-1k
- InferenceX GB200 vs B200 disaggregated DeepSeek R1 (1K/1K): 17.82 tok/s/user × 16,130 concurrency ÷ 14,659 tok/s/GPU ≈ 20 = the decode GPU count (12P/20D). Confirms per-decode-GPU normalisation. https://inferencex.semianalysis.com/blog/gb200-nvl72-vs-b200-disagg-deepseek-r1-fp4-dynamo-trt
- InferenceX GB300 vs GB200 on DeepSeek-V4-Pro 1.6T (49B active), FP4, 8K/1K, Dynamo vLLM: per-run prefill and decode GPU counts. Prefill rate = 8 × (tok/s per decode GPU) × D ÷ P. GB200: 16P/8D at 8,153 → 32.6K; 24P/8D at 8,933 → 23.8K (prefill no longer binding). GB300: 16P/8D at 10,214 → 40.9K; 20P/8D → 34.7K; 24P/8D → 29.5K. Adopted: GB200 30,000, GB300 38,000, ±15%. https://inferencex.semianalysis.com/blog/gb300-nvl72-vs-gb200-nvl72-dsv4-pro-vllm-fp4
- Corroboration: SGLang Part II, DeepSeek on GB200 NVL72, 2K input: 26,156 input tok/s per GPU prefill (FP8 attention + NVFP4 MoE), 13,386 output tok/s per GPU decode. https://www.lmsys.org/blog/2025-09-25-gb200-part-2/ ; vLLM WideEP Part I: 26.2K prefill and 10.1K decode tokens per GPU-second, 2K/2K. https://vllm.ai/blog/2026-02-03-dsr1-gb200-part1
- Prefill bound: a single GPU pool prefilling 8 input tokens per output at 30K tok/s/GPU cannot exceed 3,750 output tok/s/GPU; the published GB200 GLM points at 58, 67 and 86 tok/s/user (9,598; 9,135; 6,589) exceed it, so the curve is per decode GPU.
- The public InferenceX repo has GLM-5.2 agentx recipes with explicit prefill/decode roles on GB200 and GB300 (e.g. `disagg-2p1d-p-dep8-d-dep16-c192-mtp.yaml`: 2 prefill workers × 8 GPUs, 1 decode worker × 16 GPUs) but no 8K/1K GLM recipe, so GLM's own prefill rate cannot be backed out. https://github.com/SemiAnalysisAI/InferenceX

## 19. GPU price indices (context only; none covers NVL72)

- Ornn OCPI, transaction-based, on-demand only, settles 4 pm ET, free keyless API: H100 $2.78, H200 $6.39, B200 $8.48 (2026-10-17). Reserved/long-term published separately as a forward curve (subscription). https://data.ornn.com/ ; methodology https://data.ornn.com/methodology
- Silicon Data SDxxxRT, neocloud rental records normalised to a benchmark contract: H100 $2.82, H200 $3.51, B200 $6.12, B300 $7.01. https://www.silicondata.com/products/silicon-index
- Mithril (ex-Foundry) spot marketplace, B200 and H100, 7-day averages. https://mithril.ai/blog/b200-spot-launch
- Listing-based trackers with GB200/GB300 rows: savrn, getdeploying, Price of Compute, gpuperhour, computeprices.
- Liquid Blackwell silicon trades at $6-8.5/GPU-hr for HGX B200 nodes; NVL72 at $10.50 is a 25-75% premium.

## 20. Corrections and new data (2026-10-25)

Raw captures: `research/data/openrouter-2026-10-25/`, `research/data/prices-2026-10-25/`, `research/data/inferencex-2026-10-25/`.

20a. The GLM curve in §10 is total tokens per GPU, not output per decode GPU (§18 is withdrawn for GLM). The InferenceX compare API returns three numbers per tier: `throughputPerGpu` (input + output over all GPUs), `outputThroughputPerGpu` (over decode GPUs), `inputThroughputPerGpu` (over prefill GPUs). The §10 points equal `throughputPerGpu` exactly (GB200 tier 67: 9,135.39). At that tier output per decode GPU is 2,724 and input per prefill GPU 12,624; the three reconcile at a 65% prefill share and 8.5 input per output. The prefill-bound argument in §18 compared an input+output number with an output-only bound. The DeepSeek R1 1K/1K blog figure in §18 is per decode GPU, so the two pages normalise differently. https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300 ; code: SemiAnalysisAI/InferenceX `inferencex-e2e/infx/results/fixed_sequence.py`.

20b. Measured agentic throughput (InferenceX AgentX, GLM-5.2/5.3, 393 Claude Code traces, p90 interactivity, output tok/s over all GPUs incl. prefill). GB200 Dynamo SGLang (2026-10-23): 94.7→312, 106.2→264, 111.5→254, 128.7→176, 141.8→126, 195.3→92. GB300 Dynamo TRT-LLM (2026-10-12): 94.0→344, 117.9→285, 168.4→96.5, 202.0→71. Trace shape: mean input 134.6K, ~95% cached, ~6.2 uncached input per output token, mean output 1,001. Implied uncached prefill ≈ 3.2K tok/s per prefill GPU on both racks across all configs (prefill binds). No agentic points below ~95 tok/s/user. GLM-5.x uses MLA + DeepSeek Sparse Attention (HF config `GlmMoeDsaForCausalLM`). https://inferencex.semianalysis.com/blog/agentx-inferencexv3-does-cuda-moat ; API `api/v1/views/inference?model=GLM-5.2&sequence=agentic-traces`.

20c. Real token mix (OpenRouter model pages, 2026-09-25 to 10-24, primary; `research/openrouter_ratios.py`). GLM-5.3: 16,992B prompt, 271B completion → 62.7 : 1, 90.3% cached, 66.8K in / 1,067 out per request, 6.1 uncached input per output. 24 open-weight models combined: 37.6 : 1, 86.6% cached. Completion includes reasoning (71% for GLM-5.3); prompt includes cached. Top GLM-5.3 app: Claude Code (~113K tokens/request). The earlier 8 : 1 and 50% figures came from benchmark methodology, not traffic. OpenRouter State of AI (Dec 2025): ~6K prompt / ~400 completion per request platform-wide; programming >50% of tokens. https://openrouter.ai/z-ai/glm-5.3 ; https://openrouter.ai/state-of-ai

20d. On-demand NVL72 prices (supersedes §17). See `research/data/prices-2026-10-25/README.md`. GB200 pay-as-you-go: CoreWeave 10.50 (full racks only), Oracle 16.00, Azure 27.04 (1-yr 17.31, 3-yr 11.90); AWS 10.58 is a prepaid Capacity Block, not on-demand. GB300: Verda 12.42 (was 11.59), Oracle 18.00, Fireworks 20.00 managed. Median GB200 on-demand $16.00 (also getdeploying's). Contract references: savrn 3-yr GB300 lease 3.70, Nebius→Microsoft 5-yr 3.97, CoreWeave "up to 60% off" → ≥4.20.

20e. Margins. DeepSeek day 6: $12.91 revenue vs $2.00 cost per H800 GPU-hour (84.5% gross margin, theoretical at R1 prices; 1,072 output tok/s per GPU fleet-wide at 20-22 tok/s/user, 3.6 : 1, 56% cached). DeepSeek Jan-Jul 2026 (The Information, S): overall gross margin 44.6%, API 82.9%. Open-model API providers, gross: Fireworks ~50% (S), Together ~45% blended with GPU rental (S), Cerebras cloud 49% GAAP Q1 2026 (P), FY26 core 38-41% (P); Groq cloud loss-making 2025 (S). GPU clouds: CoreWeave Q2 2026 adj. EBITDA 59%, adj. operating 5% (P); Nebius AI cloud adj. EBITDA 49.7% (P). "30-50%" holds as the gross margin of providers on contract-priced GPUs, not as an operating margin. DeepInfra publishes no per-GPU-hour economics (Series B post 2026-05-04: owns GPUs, 25× token growth). https://github.com/deepseek-ai/open-infra-index ; https://www.thestandard.com.hk/finance/article/341002/ ; https://sacra.com/research/fireworks-ai/ ; https://deepinfra.com/blog/deepinfra-series-b

20f. Contract prices (`research/data/contracts-2026-10-25/README.md`). Disclosed multi-year NVL72 contracts, TCV ÷ GPU-hours: HIVE/BUZZ → Bell/Cohere GB200 3-yr $220M / 2,304 GPUs = $3.63 (8-K, all inputs disclosed); HIVE/BUZZ GB300 5-yr $350M / 2,016 = $3.96 (8-K); Aker/Nscale → Microsoft GB300 5-yr $6.2B / ~52k = $2.72; IREN → Microsoft GB300 5-yr $9.7B / ~77k (inferred) ≈ $2.88; Nebius → Microsoft $17.4B / >100k (press) ≤ $3.97. Small-buyer reserved list: Azure GB200 3-yr 11.90, 1-yr 17.31; Verda GB300 24-month 9.32. The earlier ≥$4.20 ("up to 60% off" CoreWeave) is withdrawn as a source; the filings land nearby by coincidence. Scale sets the price: ~$3.6-4.0 for thousand-GPU multi-year deals, ~$9-12 reserved and $10.50-27 on demand for one rack.

20g. Contract prices rose in 2026. CoreWeave Q2 2026 call: "approximately 25% increase across SKUs" (July). Nebius Q2 letter: deals "of more than $20 million per" MW, "$20-25 million per megawatt". IREN FY26 call (S): 3-yr pricing "up about 125% since November, 5-year is up about 70%". a16z charts of Silicon Data / Ornn: H100 12-month ~$1.80 → ~$2.44 (Nov 2025 → Jul 2026); YTD Oct 2026 H200 +160%, B200 +120%, H100 +35%. List prices for NVL72 did not move (CoreWeave GB200 10.50; AWS GB200 block 10.58). Adopted large-contract rent (revised the same day): the 75th percentile of the $4.19-7.41 range implied by $20-25M per MW at 545 to 385 GPUs per MW, since prices are still rising. GB300 $6.60 ($475/rack-hr), GB200 $5.85 ($421/rack-hr, scaled by Oracle's 16/18 list ratio). Files: `research/data/contracts-2026-10-25/`. https://a16z.news/p/charts-of-the-week-moar-machines

20h. Revenue basis and model choice. The "floor" price ($0.5625/$0.125/$2.50, DeepInfra) is a 37.5%-off promotion and the cheapest of 46 endpoints; the median endpoint charges $1.20/$0.17/$4.40. Request-weighted across 48 GLM-5.3 endpoints (30-min window, 2026-10-25): $0.82 in / $0.18 cached / $3.29 out; market p50 93 / p90 59 tok/s. GLM-5.3 ranks 2nd on GB200 and ~4th on GB300 by revenue per GPU-hour among 9 open models with agentic InferenceX data; one rack ≈ 25% of OpenRouter's GLM-5.3 volume. Newer GB300 Dynamo-SGLang run (2026-10-20): 458 @ p90 89, 393 @ 95, 314 @ 114. Benchmark prefill load: TRT runs report 97% GPU cache hit, ~4 uncached input per output (OpenRouter: 6.1); SGLang runs count ~270 prompt tokens per output and exclude CPU-offload hits from the hit rate, so their uncached load is not readable. Throughput improves fast (GLM on GB200 at 100 tok/s/user: 69 → 287 tok/s/GPU, Aug 16 → Oct 23). Files: `research/data/model-compare-2026-10-25/`, `research/data/openrouter-2026-10-25/providers/`.

20i. Owning opex and downtime (2026-10-25). Support and spares: no GB200 support price is published; NVIDIA requires 3- to 5-year support contracts on DGX systems (https://images.nvidia.com/content/technologies/deep-learning/pdf/nvidia-dgx-systems-support-services.pdf), and a 1-yr DGX H100 renewal listed at about 4-5% of system price (retailer listing, since removed). Adopted 4%/yr of capex ($427/day on GB200), an estimate. Operations: CoreWeave's 2025 technology and infrastructure expense ($2,929M) less roughly $2.3B of D&A leaves about $629M over about 605 MW active, about $1.04M per MW-year or $342 per 120 kW rack-day (derived from the 10-K, https://www.sec.gov/Archives/edgar/data/1769628/000176962826000104/crwv-20251231.htm); remote hands $125/hr. Adopted $400/rack-day for a single-rack owner (an estimate above the $342 fleet-wide figure, since one rack gets no scale), with CoreWeave's scale marked at $220; covers on-call engineers, remote hands, insurance and monitoring, outside the colocation fee. Downtime: InferenceX TCO API defaults "mtbi" 24 days and "recovery" 12 hours, availability 0.98 (https://inferencex.semianalysis.com/api); Meta Prometheus (GB200/GB300) reports MTBI of about 47K-54K GPU-hours with eight in-rack spare GPUs per rack (https://engineering.fb.com/2026/10/19/data-center-engineering/inside-prometheus-meta-gigawatt-scale-supercluster/); Llama 3 saw 419 unexpected interruptions in 54 days on 16,384 H100s (arXiv 2407.21783). Adopted 98% availability for every way of paying, applied to sellable tokens. Power: Microsoft measured GPU idle at about 20% of peak (ASPLOS'24) and inference clusters peaking at 79% of provisioned power; the 35% rack idle share and full-TDP busy draw are kept as a conservative pair. NVIDIA AI Enterprise ($4,500/GPU/yr list) is not included because vLLM, SGLang and Dynamo are free.

20j. DeepSeek V4 Pro (2026-10-25). Throughput: InferenceX AgentX runs for DeepSeek V4 Pro, FP4, disaggregated Dynamo vLLM and SGLang, Oct 2026; the page uses the best measured point at each speed per rack (GB200 799 at p90 80.5 to 126 at 151.1; GB300 1,168 at 56.2 to 168 at 168.1). Implied uncached prefill near 95 tok/s per user: GB200 7,483-7,986 (adopted 7,700), GB300 8,128-10,733 (adopted 9,000), using the same 5 uncached input tokens per output as GLM since both replay the same traces. Traffic: OpenRouter deepseek-v4-pro-0813, 2026-09-26 to 10-25, 42.1 input per output, 84.4% cached; both V4 Pro versions together average 238B tokens a day. Prices (24 endpoints, 5 FP4/MXFP4): median of each FP4 price $0.45 in / $0.132 cached / $3.96 out; DeepSeek's own API $0.66 / $0.022 / $1.98 (low); the price most providers charge $1.32 / $0.132 / $3.96 (high). DeepSeek V4.1 Flash is left out until InferenceX publishes disaggregated GB200 runs: its GB200 data is single-node only and its GB300 Dynamo vLLM point (7,528 at 75.5) is five times the other GB300 configurations. Files: `research/data/openrouter-2026-10-25/deepseek_deepseek-v4-pro-0813.json`, `.../providers/deepseek_deepseek-v4-pro-0813_endpoints.json`, `research/data/inferencex-2026-10-25/deepseek-v4-pro_agentic_history.json.gz`.

20k. Serving setup behind the GLM throughput (2026-10-25). GB200 run of 2026-10-23 (https://github.com/SemiAnalysisAI/InferenceX/actions/runs/39765601214/attempts/2): Dynamo SGLang, image lmsysorg/sglang nightly-dev-20261020, dynamo-router 1.6.0.dev20261019 in router-mode kv with session affinity, disaggregated 24 prefill GPUs (3 workers, pipeline-parallel 8) and 16 decode GPUs (tensor and expert parallel 16, data-parallel attention), NVFP4 weights, FP8 (e4m3) KV cache, EAGLE speculative decoding (5 steps, 6 draft tokens), FlashInfer MoE runners, HiCache KV offload with 721 GB of host memory. GB300 run of 2026-10-20 (https://github.com/SemiAnalysisAI/InferenceX/actions/runs/39187209967/attempts/2): same stack, 12 prefill and 8 decode GPUs, 819 GB host memory. Recipe: SemiAnalysisAI/InferenceX `glm5.2/sglang/gb200-fp4/agentx/disagg-variants.yaml`.
