# NVL72 contract prices, captured 2026-10-25

$/GPU-hr = total contract value ÷ (GPUs × years × 8,760). Contract values cover GPUs, data center, power and networking (full-stack GPU cloud service).

| # | Contract | SKU | Term | TCV | GPUs | $/GPU-hr | Confidence | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | HIVE/BUZZ → Bell AI Fabric (Cohere) | GB200 NVL72 | 3 yr | $220M | 2,304 | 3.63 | high: every input in filing | `hive_gb200.txt`, SEC 8-K ex.99.1, 2026-06-18 |
| 2 | HIVE/BUZZ → investment-grade enterprise | GB300 NVL72 | 5 yr | $350M | 2,016 | 3.96 | high: every input in filing | `hive_gb300.txt`, SEC 8-K, 2026-08-17 |
| 3 | Aker/Nscale JV → Microsoft (Narvik) | GB300 | 5 yr | $6.2B | ~52,000 | 2.72 | medium-high: GPU count in company footnote | `aker_q3-2025.txt`, Aker Q3 2025 presentation |
| 4 | IREN → Microsoft (Childress) | GB300 NVL72 | 5 yr | $9.7B | ~77,000 (inferred) | ~2.88 (3.69 at 60k) | medium: GPU count inferred from deck | `iren_8k.txt`, `iren_sow.txt` (rate redacted, priced in $/GPU/hr) |
| 5 | Nebius → Microsoft (Vineland) | GB300 (press) | 5 yr | $17.4B | >100,000 (Bloomberg) | ≤3.97 | medium: GPU count from press | `nebius_6k.txt` |

Published reserved list prices (small buyers): Azure ND GB200 v6 1-yr 17.31, 3-yr 11.90 (Retail Prices API); Verda GB300 24-month 9.32 (getdeploying/savrn; Verda page now "get a quote"); AWS Capacity Block GB200 10.58.

Owner's cost floor (SemiAnalysis TCO at hyperscaler volume, Jul 2026): GB200 1.86, GB300 2.31.

Thousand-GPU, multi-year take-or-pay contracts clear at $2.7-4.0; a small buyer of one rack pays $9-12 reserved or $10.50-27 on demand.

## 2026 price trend (added later on 2026-10-25)

New-contract prices rose through 2026. CoreWeave Q2 call (`coreweave_q2-2026_call.txt`): "approximately 25% increase across SKUs" in July; "Pricing and margins for our Blackwell and Vera Rubin SKUs are setting new highs". Nebius Q2 letter (`nebius_q2-2026_shareholder-letter.txt`): Q2 deals "averaging above $20 million in revenue per MW". IREN FY26 call (transcript, S): "3-year contract pricing is up about 125% since November, 5-year is up about 70%." Axe Compute B300 HGX 36-mo ≈ $4.29 (`axe-compute_8k.txt`); Sharon AI B300 HGX 5-yr $4.16 (`sharon-ai_8k.txt`). a16z (Silicon Data / Ornn charts): H100 12-month ~$1.80 (Nov 2025) → ~$2.44 (Jul 2026); YTD H200 +160%, B200 +120%, H100 +35% (Oct 23 2026).

Adopted large-contract (3-yr, multi-rack, signed now): GB200 $4.40/GPU-hr = $317/rack-hr (range 3.63-6.50); GB300 $5.00 = $360/rack-hr (range 3.96-7.40). Derived: 2025 deals × the reported rise, cross-checked against $20-25M/MW. Medium-low confidence on level; high confidence on direction.
On-demand (list, unchanged): GB200 $10.50 = $756/rack-hr (CoreWeave; AWS block $761.90); GB300 $12.42 = $894/rack-hr (Verda; Oracle $18).
