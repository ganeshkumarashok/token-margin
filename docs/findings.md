# Findings v0 (2026-10-16)

> Personal side project. Not affiliated with any employer. Not financial advice. Every number below comes from `npm run scenario` (full tables in `findings-tables.md`) using `data/assumptions.json`; change an input and rerun.

**Question.** Does one NVIDIA NVL72 rack serving GLM-5.3 earn its price back, and under what conditions does it stop?

## What the model says

1. **The pitch reproduces.** With everything at its most favorable (benchmark-best speed, 100% of benchmark throughput, sold out, Z.ai list price, flat prices), a GB200 rack makes ~60B output tokens and ~$659K a day and pays back inside the first month. NVIDIA's "$5M → $75M in 3 years" needs ~5,500 output tokens/s per GPU sold 24×7 at $2/M; the benchmark curve supports that at ~60 tok/s per user.
2. **The realistic case still pays back fast.** At the speed the market actually serves GLM-5.3 (~100 tok/s per user), half of benchmark throughput, 60% sold, the cheapest mainstream price, and prices falling 50%/yr: ~7.7B output tokens/day, ~$40K/day revenue, 96% cash margin, payback in 4 months, NPV ~$13M at 7%. GB300 is similar (payback 4 months, NPV ~$15M).
3. **Costs are not the story.** Full cost is ~$0.53 per million output tokens; of that, electricity is ~$0.05 and depreciation ~$0.31. Electricity from 5¢ to 25¢/kWh moves NPV by less than $1M. Rack price ±30% moves it by ~$2.6M.
4. **Prices could fall ~90% and the rack still breaks even** on an accounting basis at realistic throughput and utilization. NPV stays positive up to ~94%/yr price decline.
5. **What actually decides the answer, ranked by NPV swing:** price decline, serving speed, achieved throughput, token price level, utilization. Hardware price, useful life, and electricity rank last.
6. **Serving speed is a hidden cliff.** Throughput collapses at high per-user speeds: at 141 tok/s per user the realistic GB200 case has negative NPV. Selling "fast" endpoints is a different business from selling cheap ones.
7. **Where it breaks.** At realistic throughput, payback exceeds the 4-year life when utilization is 10% with prices falling ≥30%/yr, 20% with prices falling ≥70%/yr, or 40% with prices falling 90%/yr (at 10% sold and flat prices it takes 2.1 years). The bear case (quarter of benchmark throughput, 40% sold, half the floor price, −70%/yr) never pays back and loses ~$3.7M of NPV.
8. **Demand is the real constraint.** The realistic case must sell ~69B tokens a day (output plus input): 0.8% of all of OpenRouter and 9% of DeepSeek's entire Feb-2025 daily volume, for one rack. A fleet of racks needs a distribution channel the size of a top API provider.

## Verdict, as of today's inputs

"Token factories print cash" is true **per unit of capacity that is sold**: at today's open-model prices the rack earns its cost back in months, not years, with wide margin for error on throughput, hardware, and power. The thesis fails on **demand and price**: whether a new operator can sell tens of billions of tokens a day per rack, in a price-sorted marketplace where the floor fell ~3× in four months for the previous GLM model. The heatmap on the site is the honest summary.

## What the model ignores (could change the verdict)

Taxes; staff, sales, and support beyond 5% of capex per year; failures and downtime; network egress; quality cost of FP4; SLAs; demand growth; who the customers are. See PLAN.md §8 and §12 for known data issues, notably an 18× disagreement between two InferenceX GB200 GLM curves that, if the pessimistic one is right, would move the realistic case toward the bear case.
