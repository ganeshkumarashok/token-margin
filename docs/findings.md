# Findings (2026-10-25)

> Personal side project, built from public data. It does not necessarily represent the views of my employer or of any company named here. The author may hold investments in companies mentioned here. Not financial advice. Every number below comes from `npm run scenario` (full tables in `findings-tables.md`) using `data/assumptions.json`; change an input and rerun.

The question: one NVIDIA GB200 NVL72 rack (72 GPUs) serves GLM-5.3 in FP4 for one day at 95 tokens/s per user, priced at the median FP4 endpoint on OpenRouter, with OpenRouter's real GLM-5.3 traffic mix. What does it cost, how many tokens does it serve, what do they sell for, and what is left?

## The day

| | Rent on demand | Rent on a 3-yr contract | Own |
|---|---|---|---|
| Cost | $18,144 ($756/rack-hr) | $10,109 ($421/rack-hr) | $5,069 (depreciation $2,404, financing $660, space $789, support $427, operations $400, power $388) |
| Tokens at 65% utilization, 98% uptime | 1.1B output + 67.2B input | same | same |
| Revenue | $20,676, of which $15,985 is input | same | same |
| Overhead, 0.5% of revenue | $103 | $103 | $103 |
| Profit | $2,428, 12% | $10,464, 51% | $15,504, 75% |
| Break-even utilization | 57% | 32% | 16% |
| If prices fall 50%/yr | below rent in month 4 | below rent in month 14 | paid back in month 9, NPV $3.4M at 9% |

Utilization defaults to 65% for every way of paying. One rack has to be ready for the busiest times, so it sells the average share of them. Across days, OpenRouter's open-model traffic averages 81-84% of the busiest day of its week (`research/openrouter_load_shape.py`; comparing within each week keeps demand growth out). Within a day, chat traffic in the Azure LLM Inference Dataset 2024 averages 77% of its busiest hour (`research/azure_trace_utilization.py`), and agent traffic from users worldwide is flatter (FineServe, 2026). For a high-traffic model like GLM-5.3 the default takes the upper end of that evidence, with a little headroom for bursts: 0.84 × 0.82 × 0.95 ≈ 65%. Busy first-party services run higher (DeepSeek's average fleet was 82% of its peak) and multi-model marketplaces lower (Alibaba's GPUs were 13-34% busy, Aegaeon, SOSP 2025). A single rack cannot hand back part of itself when demand drops, so renting on demand gets the same utilization as owning.

Overhead defaults to 0.5% of revenue for on-call engineering, customer support, billing and the API front end. That assumes a lean team or one shared across many racks; the share falls with scale, and a stand-alone single rack would spend several times more.

GB300 at Verda's on-demand $894/rack-hr earns $25,967 of revenue at 65% utilization and makes $4,376 a day on demand after overhead; on contract it makes $14,433.

## What the data says

1. InferenceX's agentic benchmark replays 393 Claude Code sessions on GLM-5.2, which has the same architecture as GLM-5.3 (NVFP4, Dynamo SGLang), and measures 312 output tokens/s per GPU on GB200 at 95 tok/s per user, prefill GPUs included. On OpenRouter's GLM-5.3 mix that becomes 269, and 264 after 2% downtime (one failure every 24 days, 12 hours to recover, the InferenceX TCO default). InferenceX's separate 8K-in/1K-out benchmark gives 392 at 104 tok/s per user. NVIDIA's "$5M to $75M in three years" needs 5,505 output tokens/s per GPU, sold every second, which is 18 times what the agentic benchmark measures.
2. GLM-5.3 traffic on OpenRouter runs 63 input tokens per output token, with 90% of input served from cache, because coding agents resend their context every turn. Input brings in $15,985 of the day's $20,676. A model built on chat-shaped traffic (8 : 1, half cached) gets both revenue and capacity wrong.
3. At the cheapest whole-rack list price ($10.50/GPU-hr from CoreWeave and AWS), a rack needs 57% utilization to cover rent and overhead; at the 65% default it makes $2,428 a day, a 12% margin. At Oracle's $16 list price, or Azure's $27 list from April 2025, it loses money at any utilization.
4. Filed multi-year contracts clear at $3.63 (GB200, HIVE/Cohere 8-K) and $3.96 (GB300), and new-contract prices rose through 2026: CoreWeave raised prices 25% in July, and Nebius reports $20-25M per MW. Converted to GPU-hours, those reports imply $4.19-7.41 for GB300; the page uses the 75th percentile because prices are still rising: $6.60 for GB300 and $5.85 for GB200 ($421/rack-hr), at which the GB200 day earns 51% at 65% utilization after overhead. Open-model API providers report gross margins of 40-50% after their other costs.
5. Owning costs $5,069 a day before overhead against $18,144 to rent. That covers depreciation to 10% resale over 4 years, financing at 9% (the typical neocloud GPU-debt rate), 4% of the rack price a year for support and spares, and $400 a day for operations (on-call engineers, remote hands, insurance, monitoring) for a single rack; a fleet at CoreWeave's scale spends about $220 per rack-day. An owned GPU costs about $3.00 an hour all-in, and a fully sold one earns about $18.40 at median prices, so owning breaks even at 16% utilization. At 65% utilization with prices falling 50% a year, the $3.9M rack pays back in month 9, and NPV stays positive unless prices fall more than 70% a year.
6. The default day moves 68.2B tokens, 12% of all GLM-5.3 traffic on OpenRouter. A handful of racks would cover OpenRouter's entire demand for this model.
7. For a renter, ranked by NPV swing, the inputs that matter most are price decline, token price level, rent, utilization and output speed. Electricity and useful life barely affect a renter and rank last for an owner.

## DeepSeek V4 Pro on the same rack

The model, but not the site, also covers DeepSeek V4 Pro (`withModel(A, settings, 'dsv4pro')`), with its own measured throughput (InferenceX agentic runs on Dynamo vLLM and SGLang, FP4), its own OpenRouter traffic (42 input tokens per output, 84% cached) and the median of its 5 FP4 endpoints ($0.45 in, $0.132 cached, $3.96 out per million). A GB200 serves 557 output tokens/s per GPU on that traffic, twice GLM-5.3's 269, so at 65% utilization the on-demand day makes $7,424 after overhead (29%, break-even 46%) against GLM-5.3's $2,428; on GB300 it makes $11,922 (36%). Two things temper that: the default day is 40% of all DeepSeek V4 Pro traffic on OpenRouter, and DeepSeek's own API sells it for $0.66 in, $0.022 cached and $1.98 out, at which renting on demand loses $2,349 a day. Full comparison in `findings-tables.md`.

The 2× throughput is measured, not modeled. With the serving software held equal (GB300, Dynamo SGLang, FP4, conversation caches overflowing to CPU memory), GLM's run filled its GPU memory for conversation caches, found only 69% of reusable context on the GPU, and served 216 users at once at 393 output tokens/s per GPU; DeepSeek's used 35% of that memory, found 95%, and served 720 users at 813 tokens/s per GPU. Each GLM conversation needs more GPU memory, so it serves fewer at once and recomputes more context. GLM's runs also split each decode step across fewer GPUs (8 versus 16), and its numbers are still rising, so the gap may narrow. The fixed 8K-in/1K-out benchmark shows a similar gap (392 versus 719 near 105 tok/s per user).

## What the model ignores

Taxes; marketing and sales beyond the 0.5% overhead; network egress; FP4 quality; SLAs; demand growth; contract exit costs. The agentic traces carry about twice OpenRouter's average context, and longer conversations are slower to serve, so real traffic may run somewhat faster than measured. Serving software is improving quickly: GLM on GB200 at 100 tok/s per user went from 69 to 287 output tokens/s per GPU between Aug 16 and Oct 23. The large-contract rent is an estimate from filed deals and reported increases, not a quote.
