"""Back-of-envelope preview, rack level (2026-10-16). Not the model. See PLAN.md.
Run: python3 research/boe.py
"""
import math
DAY = 86400
RACKS = {
  # capex $/rack all-in; IT kW per rack (nominal rack TDP incl. CPUs/NICs/NVLink switches); GPUs; output tok/s/GPU Pareto points (tok/s/user -> tok/s/GPU)
  "GB200 NVL72": dict(capex=3.9e6, it_kw=120.0, gpus=72, curve=[(58,9598),(67,9135),(86,6589),(104,3619),(114,1997),(141,630)]),
  "GB300 NVL72": dict(capex=5.0e6, it_kw=132.0, gpus=72, curve=[(67,10192),(104,4394),(141,837)]),
}
PRICES = {  # $/M tokens: input (uncached), cache-read, output
  "list (Z.ai)":       (1.40, 0.26, 4.40),
  "floor (DeepInfra)": (0.5625, 0.125, 2.50),
}
ISL_OSL, CACHE_HIT = 8.0, 0.5
ELEC, PUE, COLO, OTHER_OPEX, LIFE = 0.1453, 1.2, 200.0, 0.05, 4.0
RENTAL = 2.50  # $/GPU-hr committed-lease comparator

def tput(curve, I):
    xs=[c[0] for c in curve]; I=min(max(I,xs[0]),xs[-1])
    for (x0,y0),(x1,y1) in zip(curve,curve[1:]):
        if x0<=I<=x1:
            f=(I-x0)/(x1-x0); return math.exp(math.log(y0)+f*(math.log(y1)-math.log(y0)))

def payback_years(K, C0, decline):
    """C0 = year-1 cash profit; prices decline by `decline` per year (continuous)."""
    if C0<=0: return float('inf')
    if decline<=0: return K/C0
    lam=-math.log(1-decline)
    if C0/lam<=K: return float('inf')
    return -math.log(1-K*lam/C0)/lam

def run(rack, price, I, achieved, util, decline=0.0, price_mult=1.0, n=1):
    r=RACKS[rack]; pin,pc,pout=[p*price_mult for p in PRICES[price]]
    tps=tput(r["curve"],I)*achieved
    out=tps*r["gpus"]*util*DAY; inp=out*ISL_OSL
    rev=(out*pout+inp*(1-CACHE_HIT)*pin+inp*CACHE_HIT*pc)/1e6
    kw=r["it_kw"]*(util+(1-util)*0.35)*PUE
    elec=kw*24*ELEC; colo=r["it_kw"]*COLO/30.4; other=r["capex"]*OTHER_OPEX/365
    cash=rev-elec-colo-other; dep=r["capex"]/(LIFE*365)
    return dict(out_B=n*out/1e9, rev=n*rev, elec=n*elec, colo=n*colo, cashM=cash/rev, opM=(cash-dep)/rev,
                pb=payback_years(r["capex"], cash*365, decline), cost_M=(elec+colo+other+dep)/(out/1e6),
                gpu_hr=rev/(r["gpus"]*24), tps=tps)

cases=[
 ("A. Pitch: 60 tok/s/user, 100% of bench, 100% util, list price", "GB200 NVL72","list (Z.ai)",60,1.0,1.0,0.0,1.0),
 ("B. As A but market-floor price",                                 "GB200 NVL72","floor (DeepInfra)",60,1.0,1.0,0.0,1.0),
 ("C. Market speed 100 tok/s/user, 100%, 100%, floor",              "GB200 NVL72","floor (DeepInfra)",100,1.0,1.0,0.0,1.0),
 ("D. Realistic: 100 tok/s, 50% of bench, 60% util, floor, -50%/yr","GB200 NVL72","floor (DeepInfra)",100,0.5,0.6,0.5,1.0),
 ("E. Realistic on GB300",                                          "GB300 NVL72","floor (DeepInfra)",100,0.5,0.6,0.5,1.0),
 ("F. Bear: 100 tok/s, 25% of bench, 40% util, half floor, -70%/yr","GB200 NVL72","floor (DeepInfra)",100,0.25,0.4,0.7,0.5),
 ("G. Bear on GB300",                                               "GB300 NVL72","floor (DeepInfra)",100,0.25,0.4,0.7,0.5),
]
print(f"{'case (1 rack)':66} {'tok/s/GPU':>9} {'outB/day':>8} {'rev$/d':>8} {'elec$/d':>7} {'cashM':>6} {'opM':>5} {'payback_y':>9} {'cost$/Mout':>10} {'$/GPU-hr':>8}")
for name,rack,price,I,a,u,d,pm in cases:
    x=run(rack,price,I,a,u,d,pm)
    pb = f"{x['pb']:.2f}" if math.isfinite(x['pb']) else "never"
    print(f"{name:66} {x['tps']:9,.0f} {x['out_B']:8.1f} {x['rev']:8,.0f} {x['elec']:7,.0f} {x['cashM']:6.0%} {x['opM']:5.0%} {pb:>9} {x['cost_M']:10.3f} {x['gpu_hr']:8.2f}")
print(f"\nRental comparator: ${RENTAL}/GPU-hr committed lease = ${RENTAL*72*8760/1e6:.2f}M/yr per rack; SemiAnalysis owning TCO GB200 $1.86/GPU-hr = ${1.86*72*8760/1e6:.2f}M/yr")
print("Capex: GB200 $3.9M all-in (SemiAnalysis), GB300 $5.0M transacted Aug 2026 (datagravity)")
impl=75e6/3/2.0*1e6/72/(365*DAY)
print(f"NVIDIA $5M->$75M/3yr @ $2/M output implies {impl:,.0f} output tok/s/GPU sustained 24x7")
