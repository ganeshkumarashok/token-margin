# Findings (2026-10-25)

> Personal side project. Not affiliated with any employer. Not financial advice. Every number below comes from `npm run scenario` (full tables in `findings-tables.md`) using `data/assumptions.json`; change an input and rerun.

**Question.** One NVIDIA GB200 NVL72 rack (72 GPUs), one day, serving GLM-5.3 in FP4 at 95 tokens/s per user, priced at the median FP4 endpoint on OpenRouter, with OpenRouter's real GLM-5.3 traffic mix: what does it cost, how many tokens does it serve, what do they sell for, and what is left?

## The day

| | Rent on demand | Rent on a 3-yr contract | Own |
|---|---|---|---|
| Cost | $18,144 ($756/rack-hr) | $7,603 ($317/rack-hr) | $4,132 (wear $2,404, space $789, upkeep $534, power $404) |
| Tokens (70% of capacity sold) | 1.2B output + 75.7B input | same | same |
| Revenue | $23,309, $18,020 of it from input | same | same |
| Profit | $5,165, 22% | $15,705, 67% | $19,177, 82% |
| Break-even share sold | 54% | 23% | 12% |
| If prices fall 50%/yr | below rent in month 6, $409K banked | below rent in month 21 | paid back in month 8, NPV $5.1M at 7% |

GB300 (Verda on demand $894/rack-hr): 1.5B output, $28,535 revenue, $7,074 profit on demand, $19,895 on contract; owning pays back in month 8.

## What the data says

1. **A rack is much slower on real traffic than on the slides.** InferenceX's agentic benchmark (393 Claude Code sessions replayed on GLM-5.3, NVFP4, Dynamo SGLang) measures 312 output tokens/s per GPU on GB200 at 95 tok/s per user, prefill GPUs included. On OpenRouter's GLM-5.3 mix that is 276. The independent fixed 8K-in/1K-out benchmark gives 392 at 104 tok/s per user. NVIDIA's "$5M → $75M in three years" needs 5,505 output tokens/s per GPU sold every second: 18× what the agentic benchmark measures.
2. **Input pays the bill.** GLM-5.3 traffic on OpenRouter runs 63 input tokens per output token with 90% of input served from cache, because coding agents resend their context every turn. Of the day's $23,309, $18,020 is input. A model that assumes chat-shaped traffic (8 : 1, half cached) misprices both revenue and capacity.
3. **Renting on demand barely works.** At the cheapest whole-rack list price ($10.50/GPU-hr, CoreWeave and AWS) a rack has to sell 54% of its capacity to cover rent, and the margin at 70% is 22%. At Oracle's $16 or Azure's $27 list it loses money at any share sold.
4. **Scale sets the margin.** Filed multi-year contracts clear at $3.63 (GB200, HIVE/Cohere 8-K) to $3.96 (GB300), and new-contract prices rose through 2026 (CoreWeave +25% in July; Nebius $20–25M per MW). At an estimated $4.40, the same day earns 67%, in line with the 40–50% gross margins reported for open-model API providers once their other costs are counted.
5. **Owning keeps the most, if the rack sells.** $4,132 a day to own against $18,144 to rent. The $3.9M rack pays back in month 8 at 70% sold with prices falling 50% a year; NPV turns negative only if prices fall faster than 77% a year.
6. **Demand is real but finite.** The default day moves 76.9B tokens, 13% of all GLM-5.3 traffic on OpenRouter. A handful of racks would be the whole OpenRouter market for this model.
7. **What moves the answer, renting, ranked by NPV swing:** price decline, token price level, rent, share sold, serving speed. Electricity and useful life barely matter to a renter and rank last for an owner.

## What the model ignores

Taxes; staff, sales and support beyond 5% of capex per year; failures and downtime; network egress; FP4 quality; SLAs; demand growth; contract exit costs. The agentic traces carry about twice OpenRouter's average context, so throughput leans conservative; serving software is improving fast (GLM on GB200 at 100 tok/s per user went from 69 to 287 output tok/s per GPU between Aug 16 and Oct 23). The large-contract rent is an estimate from filed deals and reported increases, not a quote.
