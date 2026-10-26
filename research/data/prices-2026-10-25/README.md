# NVL72 rental prices, captured 2026-10-25

Raw captures: Azure Retail Prices API responses, Oracle price-list parts, and gzipped pricing pages (CoreWeave, Verda, AWS Capacity Blocks).
P = provider's own page or API, S = tracker. Rack-hr = $/GPU-hr × 72.

## NVL72 rack-scale SKUs

| Provider | SKU | GPUs/unit | Terms | $/GPU-hr | $/rack-hr | Src |
|---|---|---|---|---|---|---|
| CoreWeave | GB200 NVL72 `gb200-4x` | 4 (full racks of 18 only) | on-demand list; committed "up to 60%" off | 10.50 | 756 | P |
| AWS | `u-p6e-gb200x72` UltraServer | 72 | Capacity Block only (prepaid, no cancel, Dallas LZ); not on-demand | 10.58 | 761.90 | P |
| Oracle OCI | `BM.GPU.GB200.4` (part B110979) | 4 | pay-as-you-go | 16.00 | 1,152 | P |
| Azure | `Standard_ND128isr_NDR_GB200_v6` | 4 (18 VMs = rack) | pay-as-you-go, cheapest US region | 27.04 | 1,946.88 | P |
| Azure | same | 4 | 1-yr reserved / 3-yr reserved | 17.31 / 11.90 | | P |
| Verda | GB300 NVL72, 72x instant cluster | 1–72 | pay-as-you-go; spot 6.21; 1-yr 11.43, 2-yr 9.32 | 12.42 | 894.20 | P |
| Oracle OCI | `BM.GPU.GB300.4` (part B112140) | 4 | pay-as-you-go | 18.00 | 1,296 | P |
| Fireworks | GB300 on-demand deployment | 1 | managed, per second | 20.00 | (1,440) | P |

Quote-only (no published price): AWS P6e-GB300, Azure ND GB300 v6, Google A4X / A4X Max (no on-demand at all), CoreWeave GB300, Nebius, Together, Crusoe. Lambda lists no NVL72.

## Not NVL72 (excluded: 8-GPU HGX servers, no 72-GPU NVLink domain)

AWS p6-b300.48xlarge 17.80, p6-b200 14.24; CoreWeave HGX B200 8.60; Nebius B300 9.50 / B200 8.50; Together B300 9.99 / B200 8.19; Crusoe B300 8.96; Lambda B200 6.69–9.86; Verda B300 10.80 / B200 8.44; GCP a4-highgpu-8g flex 8.06; OCI B300.8 15 / B200.8 14.

## Trackers (S)

getdeploying: GB200 median on-demand $16.00 across 3 providers; GB300 cheapest $18.00 (Oracle).
savrn: GB200 typical $10.58; GB300 typical $15.21 (mixed units); wholesale 5-yr $3.97; 3-yr rack lease $3.70.
Silicon Data / Ornn: no GB200/GB300 index (HGX only). Mithril: no Blackwell prices.

## Adopted defaults

On demand: GB200 NVL72 $10.50/GPU-hr = $756/rack-hr (CoreWeave list; AWS Capacity Block $761.90/rack-hr), the cheapest published whole-rack price. GB300 NVL72 $12.42 = $894/rack-hr (Verda). Higher list prices (Oracle 16/18, Azure 27.04) are the range.
Large 3-yr contract: see `../contracts-2026-10-25/README.md`.
