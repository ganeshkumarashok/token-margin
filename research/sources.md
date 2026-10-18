# Sources and working numbers (collected 2026-10-16)

Every default in `data/assumptions.json` must trace to a line here. Mark: **P** = primary (vendor/agency/benchmark site), **S** = secondary (press, blogs, resellers). Prices are USD.

## 1. GPU capex

| Item | Value | Date | Src | Link |
|---|---|---|---|---|
| GB200 NVL72 rack, bare | ~$3.1M | 2024, re-cited 2026 | S (SemiAnalysis) | https://newsletter.semianalysis.com/p/h100-vs-gb200-nvl72-training-benchmarks |
| GB200 NVL72 rack, all-in (networking, storage, etc.) | ~$3.9M → **~$54K/GPU** | same | S | same |
| GB200 NVL72 rack, press | $2.8–3.4M (Tom's); ~$3M (Tae Kim) | 2025 | S | https://x.com/firstadopter/status/1940792115124228482 |
| GB200 GPU module alone | $40–50K | 2025–26 | S | https://www.datagravity.dev/p/how-much-does-an-nvidia-nvl72-cost |
| GB300 NVL72 rack, transacted small orders | just under $5.0M (no CDU); +$32K w/ 250 kW CDU → **~$69K/GPU slot** | Aug 2026 | S (purchase orders reviewed) | https://www.datagravity.dev/p/how-much-does-an-nvidia-nvl72-cost |
| GB300 NVL72 deployed (excl. DC build, core switching, storage) | ~$5.68M → ~$79K/GPU | Aug 2026 | S | same |
| GB300 NVL72, analyst / press | $3.7–4.0M (Loop Capital, Mar 2025); $6–6.5M (Tom's, Mar 2026) | | S | https://finance.yahoo.com/sectors/technology/articles/price-nvidias-vera-rubin-nvl72-100000086.html |
| Compute trays share of rack value | ~87–90%; NVIDIA content >92% | 2026 | S | datagravity |
| HGX B200 8-GPU server, new | $360–470K (→ ~$45–59K/GPU); Supermicro listing $384K; DGX B200 $562K | Oct 2026 | S | https://www.amcompute.com/appraisals/b200 ; https://gpuperhour.com/blog/nvidia-gpu-prices |
| B200 used, per GPU | ~$14,250 (residual-value anchor) | Oct 2026 | S | https://www.amcompute.com/appraisals/b200 |
| Vera Rubin NVL72 (next gen, for deflation context) | up to $8.8M/rack | 2026 | S | yahoo link above |

## 2. GPU rental (buy-vs-rent baseline, and SemiAnalysis TCO anchors)

| Item | Value | Date | Src | Link |
|---|---|---|---|---|
| GB200 on-demand | CoreWeave $10.50/GPU-hr; Oracle ~$16; Azure ND GB200 v6 ~$27 | 2026 | S | https://www.spheron.network/blog/nvidia-gb200-nvl72-guide/ |
| GB300 committed lease | $3.70/GPU-hr (3-yr, 30 racks, EU); Verda on-demand $11.17 | 2026 | S | https://savrn.com/ai-index/pricing/gpus/gb300 |
| SemiAnalysis owning TCO, Jul 2026 survey | GB200 $1.86/chip-hr (hyperscaler), $2.26 (neocloud), $2.60–4.00 (retail); GB300 $2.31 / $5.00; B200 $1.73; B300 $2.26; H100 $1.17; H200 $1.22; VR200 $3.61; MI355X $1.50; TPUv7 $1.03 | Jul 2026 | P (InferenceX) | https://inferencex.semianalysis.com/chips/gb200-nvl72 ; https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300 |
| TCO basis | "server capex, power, colocation and cost of capital"; owning = **4-year economic useful life**; "colocation rent and electricity cost typically make up less than 20% of TCO" | Oct 2025 | P | https://inferencex.semianalysis.com/blog/inferencemax-open-source-inference-benchmarking |
| Datagravity GB300 rack opex model | $240–410K/yr opex at $0.05–0.15/kWh; colo ~$318K/yr; $2.56–2.88 per utilized GPU-hr at 80–90% util, $3.84 at 60% | Aug 2026 | S | datagravity |

## 3. Power

| Item | Value | Src | Link |
|---|---|---|---|
| GB200 TDP | **1,200 W/chip**; all-in 1.87 kW/chip incl. host CPU, NICs, cooling share | P (InferenceX) | https://inferencex.semianalysis.com/chips/gb200-nvl72 |
| GB300 TDP | **1,400 W/chip**; all-in 2.12 kW/chip | P | https://inferencex.semianalysis.com/chips/gb300-nvl72 |
| GB300 NVL72 rack | 132 kW nominal TDP, ~155 kW EDPp peak, provision 192 kW busway | P (HPE) | https://www.hpe.com/us/en/collaterals/collateral.a50009244enw.html |
| GB200 NVL72 rack | ~120 kW (various); one tracker claims 1,000 W/GPU — conflicts with SemiAnalysis 1,200 W | S | https://flopper.io/system/nvidia-gb200-nvl72 |
| B200 (HGX) TDP | 1,000 W (NVIDIA HGX B200 datasheet) | P | https://gpusmith.com/datasheets/nvidia-hgx-b200-datasheet.pdf |
| PUE | hyperscale 1.09–1.15; industry avg 1.54 (Uptime 2025, flat 6 yrs); colo/enterprise 1.58–1.80 | S | https://mgrid.org/2025/10/01/uptime-institute-data-center-pue-stagnation-2025-liquid-cooling/ |
| InferenceX tok/s/MW | uses "all-in provisioned utility MW" built from TDP, not measured draw | P | inferencemax blog above |

Decomposition used in the model: IT kW/GPU = TDP + host/NIC share (~0.35 kW); facility kW = IT × PUE. With PUE 1.2 this reproduces InferenceX's 1.87 kW (GB200) and 2.12 kW (GB300).

## 4. Electricity (PRIMARY)

EIA Electric Power Monthly, Table 5.6.A, July 2026 (preliminary), ¢/kWh, U.S. total: **Commercial 14.53** (Jul 2025: 14.05) · Industrial 9.77 (9.33) · Residential 18.31 · All sectors 14.99. June 2026 commercial 14.19; H1-2026 avg ~13.86. https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a

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
| GLM-5 / 5.1 | 744B-A40B | Feb–Apr 2026 | P | https://huggingface.co/zai-org/GLM-5-FP8 |
| GLM-5.3-Flash | 320B-A18B | Aug 26 2026 | P | https://huggingface.co/zai-org/GLM-5.3-Flash |
| Press | GLM-5.2 "753B", beats GPT-5.5 on long-horizon coding at 1/6 cost | Jun 2026 | S | https://venturebeat.com/technology/z-ais-open-weights-glm-5-2-beats-gpt-5-5-on-multiple-long-horizon-coding-benchmarks-for-1-6th-the-cost |

InferenceX benchmarks "GLM 5/5.1 (744B)" — identical architecture to 5.2/5.3, so throughput transfers.

## 7. Token prices (revenue side)

Z.ai list (per 1M tokens: input / cached input / output), **P** https://docs.z.ai/guides/overview/pricing
- GLM-5.3, 5.2, 5.1: **$1.40 / $0.26 / $4.40**. GLM-5: $1.00 / $0.20 / $3.20. GLM-5.3-Flash: $0.15 / $0.03 / $0.50. GLM-5.3-FlashX: $0.37 / $0.075 / $1.25. GLM-4.7/4.6/4.5: $0.60 / $0.11 / $2.20.

OpenRouter per-provider endpoints for `z-ai/glm-5.3` (46 endpoints; snapshot `data/raw/openrouter/z-ai_glm-5.3_endpoints_2026-10-16.json`, public API `https://openrouter.ai/api/v1/models/z-ai/glm-5.3/endpoints`), **P**:
- At list ($1.40/$0.26/$4.40): Z.AI, Together, Fireworks, BaseTen, Mistral (nvfp4), Nebius, Crusoe, Parasail, Modal, Cloudflare, AtlasCloud, Venice, PrimeIntellect.
- Mid: CoreWeave fp8 $1.20/$0.19/$4.00; Friendli $1.26/$3.96; GMICloud $0.98/$3.08; DigitalOcean $0.91/$2.86; Phala $0.84/$2.64; Decart fp4 $0.84/$2.66.
- **Floor tier (mainstream):** DeepInfra fp4 **$0.5625 / $0.125 / $2.50**; Inceptron fp4 $0.55/$0.18/$2.20; Baidu fp8 $0.70/$0.13/$2.20; SiliconFlow & Novita fp8 $0.70/$0.13/$2.20; Tenstorrent fp8 $0.60/$0.10/$2.50; Io Net $0.49/$2.90; Sail Research fp8 $0.50/$0.12/$1.505.
- Outliers (very cheap input, output at/above list; likely edit/apply-specialised hosts): Relace $0.06/$4.40; Wafer fp4 $0.079/$4.80; InferenceNet fp4 $0.08/$4.38; Morph fp8 $0.085/$6.00; AkashML fp8 $0.19/$4.40; DekaLLM $0.18/$2.95.
- GLM-5.3-Flash floor: DeepInfra fp4 $0.075/$0.015/$0.25; StreamLake $0.075/$0.25; list $0.15/$0.03/$0.50.
- GLM-5.2 floor: DeepInfra fp4 $0.45/$0.084/$1.44.
- Per-provider throughput/latency fields are null without auth; get real tok/s from the OpenRouter model page or Artificial Analysis during M1.

Market index (secondary): Silicon Data LLM Token Expenditure Index ~$0.97/M blended, Sep 1 2026 (usage-weighted). https://www.kucoin.com/blog/why-ai-token-costs-are-falling

## 8. Workload mix

- OpenRouter: agentic traffic ~5× human (7.3T vs 1.4T tokens, 7-day MA); **>85% of agentic input tokens are cache hits**. https://fourweekmba.com/ai-agents-burn-nearly-5x-the-tokens-people-do-on-openrouter/ ; https://openrouter.ai/data/newsletter
- Working assumption 72/28 input/output split (unmeasured). https://www.codesota.com/agentic/openrouter-apps

## 9. Token price deflation

- Epoch AI: price at constant capability falls 9×–900×/yr by milestone; ~40×/yr for GPT-4-level; fastest drops most recent, may not persist. https://epoch.ai/data-insights/llm-inference-price-trends ; https://epoch.ai/blog/llm-inference-price-trends
- Du (Mar 2026): ~600× decline 2020–26; **price half-life 1.10 yr (economy tier), 1.55 yr (mid tier)**; flagship no clean exponential. https://arxiv.org/html/2603.28576v1
- "Price of Progress" (Nov 2025): cost-of-pass declines slower (24.5×/yr MATH500, 3.2×/yr AIME24). https://arxiv.org/html/2511.23455v1
- Same-model evidence: GLM-5.2 third-party floor fell from list $1.40/$4.40 (Jun 2026) to $0.45/$1.44 (Oct 2026) ≈ 3× in 4 months.

## 10. Throughput (InferenceX / SemiAnalysis; GLM 5/5.1 744B, FP4, 8K/1K ISL/OSL; TCO Jul 2026)

GB200 NVL72 vs GB300 NVL72 — https://inferencex.semianalysis.com/compare/glm-5-1-gb200-vs-gb300

| tok/s/user | GB200 tok/s/chip | GB300 tok/s/chip | GB200 $/M | GB300 $/M | GB200 tok/s/MW | GB300 tok/s/MW |
|---|---|---|---|---|---|---|
| 67 | 9,135 | 10,192 | 0.057 | 0.063 | 4.89M | 4.81M |
| 104 | 3,619 | 4,394 | 0.143 | 0.146 | 1.94M | 2.07M |
| 141 | 630 | 837 | 0.820 | 0.766 | 0.34M | 0.39M |

B200 vs GB200 NVL72 — https://inferencex.semianalysis.com/compare/glm-5-1-b200-vs-gb200/8k-1k

| tok/s/user | B200 tok/s/chip | GB200 tok/s/chip | B200 $/M | GB200 $/M |
|---|---|---|---|---|
| 58 | 2,532 | 9,598 | 0.190 | 0.054 |
| 86 | 1,796 | 6,589 | 0.268 | 0.078 |
| 114 | 1,385 | 1,997 | 0.347 | 0.259 |

- Curve band shown: 30–177 tok/s/user. Stacks: Dynamo SGLang / Dynamo TRT-LLM, ± MTP. Values "interpolated from real benchmark data". Disaggregated configs are per decode/prefill chip (not apples to apples).
- Formula: $/M = TCO($/chip-hr) × 1e6 / (3600 × tok/s/chip). https://inferencex.semianalysis.com/glossary/cost-per-million-tokens
- Token accounting: glossary says throughput "may be reported for total tokens or separated into input and output"; NVIDIA labels the axis "tokens per second per GPU"; NVIDIA's $5M→$75M claim back-solves to ~5.5K **output** tok/s/GPU, consistent with these being output (decode) tokens. Harness (SemiAnalysisAI/InferenceX `inferencex-e2e/infx/results/fixed_sequence.py`) emits both `tput_per_gpu` (total tokens) and `output_tput_per_gpu` (output tokens, denominator = decode GPUs when disaggregated); the dashboard's "per decode chip" footnote matches the output metric, so plotted tok/s/chip = **output tokens per (decode) GPU**. Interactivity = 1000/TPOT ms. Re-confirm against the live chart axis in M1, and note the disagg denominator inflates per-total-GPU figures.
- Interactivity = decode tokens/s per user = 1/TPOT, excludes TTFT. https://inferencex.semianalysis.com/glossary/interactivity
- ISL randomized 80–100% of nominal per request. Scenarios: 1K/1K chat, 1K/8K reasoning, 8K/1K summarization. https://inferencex.semianalysis.com/blog/inferencemax-open-source-inference-benchmarking
- DeepSeek R1 reference points on GB200 NVL72: ~14,125 tok/s/GPU @25 tok/s/user (May 2026, FP4, Dynamo TRT-LLM, MTP, disagg) https://inferencex.semianalysis.com/blog/gb200-nvl72-vs-b200-disagg-deepseek-r1-fp4-dynamo-trt ; 4,972 @59 and 2,445 @98 (Oct 2025) https://inferencex.semianalysis.com/compare/deepseek-r1-gb200-vs-h200 ; SGLang 26K input / 13K output tok/s/GPU (prefill/decode) https://www.lmsys.org/blog/2025-10-14-sa-inference-max/
- NVIDIA blog on InferenceMAX: B200 ~10K TPS/GPU @50 TPS/user on Llama 3.3 70B; gpt-oss-120b ~30K TPS/GPU @100 TPS/user (Oct 2025). https://developer.nvidia.com/blog/nvidia-blackwell-leads-on-new-semianalysis-inferencemax-benchmarks/

## 11. Useful life / depreciation

- Hyperscalers 5–6 yr (Meta 5.5; Amazon cut 6→5 in 2025). Burry: economic life 2–3 yr, $176B under-depreciation 2026–28. Bernstein: 6 yr defensible. CoreWeave A100s (2020) at full utilization, rented through 2029. SemiAnalysis TCO uses 4 yr. https://www.datagravity.dev/p/how-long-does-a-gpu-last ; https://fourweekmba.com/ai-nvidia-gpu-depreciation-durability-debate-huang-2026/ ; https://beancount.io/blog/2026/07/10/gpu-cloud-depreciation-schedules-guide

## 12. Cost of capital

- GPU-backed debt 2026: CoreWeave/Meta A3 at SOFR+225 (fixed tranche ~5.9%); Lambda TLB Baa2 at SOFR+300; weaker credits +450–550; 2023-era private credit 10–15%; LTV 60–70%. SOFR ≈ 3.90% (Oct 6 2026) → ~6–7% best credit, ~8.5–9.5% typical neocloud. https://www.wing.vc/content/how-the-gpu-became-collateral ; https://www.datacenterdynamics.com/en/news/coreweave-secures-85bn-loan-for-gpu-purchases/ ; https://www.storagenewsletter.com/?p=305474 ; https://marketxls.com/indicators/sofr

## 13. The claim under test (NVIDIA "token factory")

- "$5 million investment in GB200 NVL72 yields $75 million in token revenue — 15× ROI" (InferenceMAX v1 launch, Oct 2025). Footnoted assumptions on an NVIDIA slide: single NVL72, **3-year operation, $2 per million output tokens**, DeepSeek R1 (another NVIDIA page says gpt-oss-120b); 15× is framed relative to H200. https://blogs.nvidia.com/blog/blackwell-inferencemax-benchmark-results ; https://perspectives.nvidia.com/ai-infrastructure/total-cost-of-ownership/task/faq/revenue-per-rack-ai-inference-datacenter-economics/ ; https://mcomputers.cz/wp-content/uploads/2025/11/08_Koen_van_den_Berg_NVIDIA-Blackwell_-powering-the-next-generation-AI-Factories-EN-1.pdf
- GTC 2026 restatement (unverified secondary): 1 GW Vera Rubin factory → ~$150B token revenue vs ~$100B build. https://ai2.work/blog/jensen-huang-frames-ai-tokens-as-the-new-enterprise-currency-at-gtc

## 14. Market serving speed for GLM-5.3 (sets the interactivity default)

Artificial Analysis, GLM-5.3 providers page (10K-input workload; speed/price undated, latency p50 last 72h; fetched 2026-10-16) https://artificialanalysis.ai/models/glm-5-3/providers
- Output speed, mainstream endpoints: Z.ai 74 tok/s · DeepInfra 112 · Together 112 · Novita 98 · Baseten 94 · GMI 70 · DigitalOcean 45 · FriendliAI 167 · Parasail 175 · Modal 104.
- FP4 endpoints: Nebius 254 · Crusoe 198 · Supernova 269 · LithosAI 412. "FAST" tiers: 296–745.
- Prices where shown: DeepInfra $0.56/$2.50 (blended $0.45); Supernova FP4 $0.63/$1.98 (blended $0.41); GMI out $3.08.
- Implication: the market serves GLM-5.3 at roughly **100 tok/s/user** (median of mainstream), not 60. InferenceX GB200 throughput at 100 tok/s/user is ~4,300 output tok/s/GPU vs ~9,600 at 58. Default interactivity = 100.

## 15. Why OpenRouter is the price source (and its limits)

- It is the only public, machine-readable, dated quote of what ~40 independent hosts charge for the *same* open-weights model, so it exposes the price distribution (list vs floor) a new entrant faces. Its default routing is price-sorted, so the floor is where marketplace volume clears.
- It is the retail spot channel: the thinnest-margin way to sell tokens. Direct/enterprise contracts (list or discounted list with commitments) and first-party products realize more per token but are not observable. The model treats OpenRouter floor as the realizable price for a no-brand seller and list as an upper bound; a channel-mix knob covers the middle.
- Caveats: quantization differs by host (fp4 vs fp8), output price includes reasoning tokens, cache-read pricing varies, listed price ≠ realized volume, and snapshots age in weeks. Cross-check with Artificial Analysis (price + speed + quality) and Z.ai list; refresh snapshots on a schedule.

## 16. Real-world anchors for demand and tokens per GPU

- **DeepSeek, Feb 27–28 2025 (24h, V3+R1 production, H800):** 608B input tokens (56.3% cache hits), 168B output tokens at 20–22 tok/s/user; average 226.75 nodes (1,814 H800s), peak 278; per node 73.7K input + 14.8K output tok/s (→ ~9.2K in + ~1.85K out tok/s per GPU); cost $87,072/day at $2/GPU-hr; theoretical revenue at R1 prices $562,027/day → "545% cost-profit margin"; actual revenue "substantially lower" (V3 priced lower, free web/app, off-peak discounts). Source: DeepSeek open-infra-index "Inference System Overview"; coverage: https://www.analyticsvidhya.com/blog/2025/03/deepseek-inference-system-overview/ ; https://businessinsider.nl/deepseek-says-its-ai-models-would-have-a-545-profit-margin-if-everyone-who-uses-them-pays
  - Use: (1) real production output of ~1–2K tok/s per H800 GPU with real traffic and caching; (2) a top-5 global API moved ~776B tokens/day in early 2025, i.e. one GB200 rack at benchmark peak (~540B tokens/day incl. input) is a third to two-thirds of that; (3) per-GPU token revenue ≈ $12.9/GPU-hr theoretical vs ~$2 cost, so per-GPU economics are very profitable when demand exists, and the binding constraints are demand and price.
- **OpenRouter platform volume (2026):** ~7.3T agentic + ~1.4T human tokens/day (7-day MA, a16z chart of OpenRouter data), >85% of agentic input is cache hits. One GB200 rack at benchmark peak ≈ 6% of the entire platform's daily tokens; at the realistic preview (~70B/day) ≈ 0.8%. Per-model weekly volumes (GLM-5.3 share) are shown on OpenRouter's rankings UI but not in page HTML — collect in M1 (UI or authenticated analytics API). https://fourweekmba.com/ai-agents-burn-nearly-5x-the-tokens-people-do-on-openrouter/
