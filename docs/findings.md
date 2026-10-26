# Findings (2026-10-25)

> Personal side project. Not affiliated with any employer. Not financial advice. Every number below comes from `npm run scenario` (full tables in `findings-tables.md`) using `data/assumptions.json`; change an input and rerun.

The question: one NVIDIA GB200 NVL72 rack (72 GPUs) serves GLM-5.3 in FP4 for one day at 95 tokens/s per user, priced at the median FP4 endpoint on OpenRouter, with OpenRouter's real GLM-5.3 traffic mix. What does it cost, how many tokens does it serve, what do they sell for, and what is left?

## The day

| | Rent on demand | Rent on a 3-yr contract | Own |
|---|---|---|---|
| Cost | $18,144 ($756/rack-hr) | $10,109 ($421/rack-hr) | $4,245 (wear $2,404, space $789, support $427, power $404, operations $220) |
| Tokens at 70% utilization, 98% uptime | 1.2B output + 74.2B input | same | same |
| Revenue | $22,842, of which $17,660 is input | same | same |
| Gross profit | $4,698, 21% | $12,734, 56% | $18,598, 81% |
| Break-even utilization | 56% | 31% | 12% |
| If prices fall 50%/yr | below rent in month 5, $346K banked | below rent in month 16 | paid back in month 8, NPV $4.8M at 7% |

GB300 at Verda's on-demand $894/rack-hr serves 1.4B output tokens for $27,965 of revenue. Profit is $6,503 on demand and $16,560 on contract, and an owned rack pays back in month 8.

## What the data says

1. InferenceX's agentic benchmark replays 393 Claude Code sessions on GLM-5.2, which has the same architecture as GLM-5.3 (NVFP4, Dynamo SGLang), and measures 312 output tokens/s per GPU on GB200 at 95 tok/s per user, prefill GPUs included. On OpenRouter's GLM-5.3 mix that becomes 276, and 270 after 2% downtime (one failure every 24 days, 12 hours to recover, the InferenceX TCO default). InferenceX's separate 8K-in/1K-out benchmark gives 392 at 104 tok/s per user. NVIDIA's "$5M to $75M in three years" needs 5,505 output tokens/s per GPU, sold every second, which is 18 times what the agentic benchmark measures.
2. GLM-5.3 traffic on OpenRouter runs 63 input tokens per output token, with 90% of input served from cache, because coding agents resend their context every turn. Input brings in $17,660 of the day's $22,842. A model built on chat-shaped traffic (8 : 1, half cached) gets both revenue and capacity wrong.
3. At the cheapest whole-rack list price ($10.50/GPU-hr from CoreWeave and AWS), a rack needs 56% utilization to cover rent, and at 70% the margin is 21%. At Oracle's $16 list price, or Azure's $27 list from April 2025, it loses money at any utilization.
4. Filed multi-year contracts clear at $3.63 (GB200, HIVE/Cohere 8-K) and $3.96 (GB300), and new-contract prices rose through 2026: CoreWeave raised prices 25% in July, and Nebius reports $20-25M per MW. Converted to GPU-hours, those reports imply $4.19-7.41 for GB300; the page uses the 75th percentile because prices are still rising: $6.60 for GB300 and $5.85 for GB200 ($421/rack-hr), at which the GB200 day earns 56%. Open-model API providers report gross margins of 40-50% after their other costs.
5. Owning costs $4,245 a day against $18,144 to rent, including 4% of the rack price a year for support and spares and $220 a day for operations (on-call engineers, remote hands, insurance, monitoring; scaled from CoreWeave's 2025 infrastructure spend). At 70% utilization, with prices falling 50% a year, the $3.9M rack pays back in month 8, and NPV stays positive unless prices fall more than 76% a year.
6. The default day moves 75.4B tokens, 13% of all GLM-5.3 traffic on OpenRouter. A handful of racks would cover OpenRouter's entire demand for this model.
7. For a renter, ranked by NPV swing, the inputs that matter most are price decline, token price level, rent, utilization and output speed. Electricity and useful life barely affect a renter and rank last for an owner.

## What the model ignores

Taxes; sales and customer support (the overhead input adds them); cost of capital in the daily figures; network egress; FP4 quality; SLAs; demand growth; contract exit costs. The agentic traces carry about twice OpenRouter's average context, so throughput leans conservative. Serving software is improving quickly: GLM on GB200 at 100 tok/s per user went from 69 to 287 output tokens/s per GPU between Aug 16 and Oct 23. The large-contract rent is an estimate from filed deals and reported increases, not a quote.
