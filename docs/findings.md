# Findings (2026-10-25)

> Personal side project. Not affiliated with any employer. Not financial advice. Every number below comes from `npm run scenario` (full tables in `findings-tables.md`) using `data/assumptions.json`; change an input and rerun.

The question: one NVIDIA GB200 NVL72 rack (72 GPUs) serves GLM-5.3 in FP4 for one day at 95 tokens/s per user, priced at the median FP4 endpoint on OpenRouter, with OpenRouter's real GLM-5.3 traffic mix. What does it cost, how many tokens does it serve, what do they sell for, and what is left?

## The day

| | Rent on demand | Rent on a 3-yr contract | Own |
|---|---|---|---|
| Default utilization | 70% | 55% | 55% |
| Cost | $18,144 ($756/rack-hr) | $10,109 ($421/rack-hr) | $5,036 (depreciation $2,404, financing $660, space $789, support $427, operations $400, power $355) |
| Tokens, at 98% uptime | 1.2B output + 74.2B input | 0.93B output + 58.3B input | same as contract |
| Revenue | $22,842, of which $17,660 is input | $17,947 | $17,947 |
| Gross profit | $4,698, 21% | $7,839, 44% | $12,911, 72% |
| Break-even utilization | 56% | 31% | 15% |
| If prices fall 50%/yr | below rent in month 5, $346K banked | below rent in month 11 | paid back in month 11, NPV $2.2M at 9% |

Capacity fixed for years sells a smaller share than capacity rented by the hour: across OpenRouter's open models the average day is 68% of the busiest day of the month, and DeepSeek's average serving fleet was 82% of its peak, so a rack sized for busy hours averages about 55%. An on-demand renter can hand racks back when demand falls.

GB300 at Verda's on-demand $894/rack-hr serves 1.4B output tokens for $27,965 of revenue. Profit is $6,503 on demand at 70% utilization.

## What the data says

1. InferenceX's agentic benchmark replays 393 Claude Code sessions on GLM-5.2, which has the same architecture as GLM-5.3 (NVFP4, Dynamo SGLang), and measures 312 output tokens/s per GPU on GB200 at 95 tok/s per user, prefill GPUs included. On OpenRouter's GLM-5.3 mix that becomes 276, and 270 after 2% downtime (one failure every 24 days, 12 hours to recover, the InferenceX TCO default). InferenceX's separate 8K-in/1K-out benchmark gives 392 at 104 tok/s per user. NVIDIA's "$5M to $75M in three years" needs 5,505 output tokens/s per GPU, sold every second, which is 18 times what the agentic benchmark measures.
2. GLM-5.3 traffic on OpenRouter runs 63 input tokens per output token, with 90% of input served from cache, because coding agents resend their context every turn. Input brings in $17,660 of the day's $22,842. A model built on chat-shaped traffic (8 : 1, half cached) gets both revenue and capacity wrong.
3. At the cheapest whole-rack list price ($10.50/GPU-hr from CoreWeave and AWS), a rack needs 56% utilization to cover rent, and at 70% the margin is 21%. At Oracle's $16 list price, or Azure's $27 list from April 2025, it loses money at any utilization.
4. Filed multi-year contracts clear at $3.63 (GB200, HIVE/Cohere 8-K) and $3.96 (GB300), and new-contract prices rose through 2026: CoreWeave raised prices 25% in July, and Nebius reports $20-25M per MW. Converted to GPU-hours, those reports imply $4.19-7.41 for GB300; the page uses the 75th percentile because prices are still rising: $6.60 for GB300 and $5.85 for GB200 ($421/rack-hr), at which the GB200 day earns 44% at 55% utilization. Open-model API providers report gross margins of 40-50% after their other costs.
5. Owning costs $5,036 a day against $18,144 to rent. That covers depreciation to 10% resale over 4 years, financing at 9% (the typical neocloud GPU-debt rate), 4% of the rack price a year for support and spares, and $400 a day for operations (on-call engineers, remote hands, insurance, monitoring) for a single rack; a fleet at CoreWeave's scale spends about $220 per rack-day. An owned GPU costs about $3.00 an hour all-in, and a fully sold one earns about $18.90 at median prices, so owning breaks even at 15% utilization. At 55% utilization with prices falling 50% a year, the $3.9M rack pays back in month 11, and NPV stays positive unless prices fall more than 64% a year.
6. The default day moves 75.4B tokens, 13% of all GLM-5.3 traffic on OpenRouter. A handful of racks would cover OpenRouter's entire demand for this model.
7. For a renter, ranked by NPV swing, the inputs that matter most are price decline, token price level, rent, utilization and output speed. Electricity and useful life barely affect a renter and rank last for an owner.

## DeepSeek V4 Pro on the same rack

The page can switch to DeepSeek V4 Pro, with its own measured throughput (InferenceX agentic runs on Dynamo vLLM and SGLang, FP4), its own OpenRouter traffic (42 input tokens per output, 84% cached) and the median of its 5 FP4 endpoints ($0.45 in, $0.132 cached, $3.96 out per million). A GB200 serves 557 output tokens/s per GPU on that traffic, twice GLM-5.3's 276, so the on-demand day earns $9,529 (34%) and breaks even at 46% utilization; on GB300 it earns $14,671 (41%). Two things temper that: the default day is 43% of all DeepSeek V4 Pro traffic on OpenRouter, and DeepSeek's own API sells it for $0.66 in, $0.022 cached and $1.98 out, at which renting on demand loses $1,048 a day. Full comparison in `findings-tables.md`.

## What the model ignores

Taxes; sales and customer support (the overhead input adds them); cost of capital in the daily figures; network egress; FP4 quality; SLAs; demand growth; contract exit costs. The agentic traces carry about twice OpenRouter's average context, so throughput leans conservative. Serving software is improving quickly: GLM on GB200 at 100 tok/s per user went from 69 to 287 output tokens/s per GPU between Aug 16 and Oct 23. The large-contract rent is an estimate from filed deals and reported increases, not a quote.
