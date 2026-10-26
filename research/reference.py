"""Reference implementation used to derive the expected values in the engine tests.
Mirrors the engine exactly (discrete monthly schedule). Run: python3 research/reference.py

Capacity: InferenceX AgentX curves are output tok/s per GPU with prefill GPUs included, measured on
traffic that prefills REF uncached input tokens per output token. Other traffic shifts prefill time:
    cap = 1 / (1 / bench + (io * (1 - c) - REF) / pf)      # output tok/s per GPU
Tenure: 'own' pays capex + power + colo + opex (+ depreciation); 'rent' pays $/GPU-hr and nothing else.
"""
import math
DAY=86400
REF=5.0
CURVES={"gb200":[(94.7,312.2),(106.2,264.4),(111.5,253.7),(128.7,175.8),(141.8,126.4),(195.3,91.7),(263.9,49.9)],
        "gb300":[(89.4,458.2),(94.7,393.0),(114.3,313.8),(131.8,202.5),(184.8,109.1),(246.3,54.2)]}
RACK={"gb200":dict(gpus=72,price=3.9e6,itKw=120.0,pf=3200.0,rent=10.50,contract=5.85),
      "gb300":dict(gpus=72,price=5.0e6,itKw=132.0,pf=3200.0,rent=12.42,contract=6.60)}
PRICES={"floor":(0.5625,0.125,2.50),"median":(1.12,0.14,4.40),"list":(1.40,0.26,4.40)}

def tput(curve,I):
    xs=[p[0] for p in curve]; I=min(max(I,xs[0]),xs[-1])
    for (x0,y0),(x1,y1) in zip(curve,curve[1:]):
        if x0<=I<=x1:
            f=(I-x0)/(x1-x0); return math.exp(math.log(y0)+f*(math.log(y1)-math.log(y0)))

def daily(rack="gb200",racks=1,I=95,a=1.0,u=0.7,price="median",c=0.9,io=63.0,elec=0.1453,pue=1.2,idle=0.35,colo=200.0,
          ox=0.04,life=4.0,res=0.10,listShare=0.0,priceMult=1.0,tenure="rent",basis="onDemand",rent=None,pf=None,oh=0.0,ops=220.0,av=0.98):
    r=RACK[rack]; pin,pc,po=[x*priceMult for x in PRICES[price]]; lin,lc,lo=PRICES["list"]
    renting=tenure=="rent"; pf=r["pf"] if pf is None else pf
    rent=(r["contract"] if basis=="contract" else r["rent"]) if rent is None else rent
    capex=0.0 if renting else racks*r["price"]; gpus=racks*r["gpus"]
    bench=tput(CURVES[rack],I); cap=1.0/(1.0/bench+(io*(1-c)-REF)/pf); tps=cap*a*av
    out=tps*gpus*u*DAY; inp=out*io
    def rev(pin,pc,po): return (out*po+inp*(1-c)*pin+inp*c*pc)/1e6
    revenue=(1-listShare)*rev(pin,pc,po)+listShare*rev(lin,lc,lo)
    kw=r["itKw"]*racks*(u+(1-u)*idle)*pue
    rentUsd=rent*gpus*24 if renting else 0.0
    e=0.0 if renting else kw*24*elec; cl=0.0 if renting else colo*r["itKw"]*racks*12/365; other=0.0 if renting else capex*ox/365
    opsUsd=0.0 if renting else ops*racks
    ohUsd=revenue*oh
    cashCost=rentUsd+e+cl+other+opsUsd+ohUsd; cash=revenue-cashCost
    dep=0.0 if renting else capex*(1-res)/(life*365); cost=cashCost+dep; profit=revenue-cost
    return dict(oh=oh,ohUsd=ohUsd,opsUsd=opsUsd,capex=capex,bench=bench,cap=cap,tps=tps,out=out,inp=inp,revenue=revenue,rent=rentUsd,elec=e,colo=cl,other=other,
                dep=dep,cashCost=cashCost,cost=cost,cash=cash,profit=profit,
                cashM=cash/revenue if revenue else None, opM=profit/revenue if revenue else None,
                cashCostM=cashCost/(out/1e6) if out else None, fullCostM=cost/(out/1e6) if out else None,
                gpuHr=revenue/(gpus*24), inputRev=revenue-(out*po/1e6)*(1-listShare)-(out*lo/1e6)*listShare)

def schedule(d,life=4.0,decline=0.5,k=0.07,res=0.10,m0=0):
    months=int(round(life*12)); flows=[-d["capex"]]; fixed=d["rent"]+d["colo"]+d["other"]+d["opsUsd"]; renting=d["rent"]>0; under=None
    for m in range(1,months+1):
        if m<=m0: flows.append(-fixed*365/12)  # lead time: no revenue, fixed costs accrue
        else:
            pf=(1-decline)**((m-1)/12)
            f=(d["revenue"]*pf*(1-d["oh"])-d["elec"]-fixed)*365/12
            if f<0 and under is None: under=m
            flows.append(0.0 if (renting and under is not None) else f)  # renter walks away; owner is stuck
    cum=0; payback=None
    for m,f in enumerate(flows):
        cum+=f
        if m>0 and d["capex"]>0 and payback is None and cum>=0: payback=m
    rm=(1+k)**(1/12)-1
    term=flows[:]; term[-1]+=d["capex"]*res
    npv=sum(f/(1+rm)**m for m,f in enumerate(term))
    def npv_at(r): return sum(f/(1+r)**m for m,f in enumerate(term))
    lo,hi=-0.99,10.0; irr=None
    if npv_at(lo)*npv_at(hi)<0:
        for _ in range(200):
            mid=(lo+hi)/2
            if npv_at(lo)*npv_at(mid)<=0: hi=mid
            else: lo=mid
        irr=(1+(lo+hi)/2)**12-1
    return dict(paybackMonth=payback,underwaterMonth=under,npv=npv,irr=irr,cum=cum)

def sold_be(**kw):
    """utilization at which profit = 0 (bisection, mirrors engine)."""
    f=lambda u: daily(**{**kw,"u":u})["profit"]
    if f(1.0)<0: return None
    if f(0.0)>=0: return 0.0
    lo,hi=0.0,1.0
    for _ in range(50):
        mid=(lo+hi)/2
        if f(mid)>=0: hi=mid
        else: lo=mid
    return hi

def show(name,d,s=None):
    print(f"\n== {name}")
    for k_,v in d.items():
        if isinstance(v,float): print(f"  {k_:10} {v:,.4f}")
        else: print(f"  {k_:10} {v}")
    if s: print("  schedule", {k_:(round(v,4) if isinstance(v,float) else v) for k_,v in s.items()})

if __name__=="__main__":
    c2,c3=CURVES["gb200"],CURVES["gb300"]
    print("T1 throughputAt gb200: 94.7->",tput(c2,94.7)," 95->",round(tput(c2,95),4)," 100->",round(tput(c2,100),4),
          " 60(clamp)->",tput(c2,60)," 400(clamp)->",tput(c2,400),"; gb300 95->",round(tput(c3,95),4))
    print("T2 InferenceX cost per M output at $1.86/GPU-hr, 312.2 tok/s:",round(1.86e6/(3600*312.2),4))
    # T3 benchmark traffic reproduces the measured points exactly (InferenceX validation)
    for rk,cv in CURVES.items():
        for I,y in cv: assert abs(daily(rk,I=I,io=REF,c=0.0)["cap"]-y)<1e-9  # capacity before availability
    print("T3 every measured InferenceX point reproduced at REF traffic")
    # T4 defaults: rent on demand, contract, own
    d=daily(); show("T4 default gb200 RENT on-demand", d, schedule(d)); print("  soldBE",sold_be())
    d=daily(basis="contract"); show("T4 default gb200 RENT contract", d, schedule(d)); print("  soldBE",sold_be(basis="contract"))
    d=daily(tenure="own"); show("T4 default gb200 OWN", d, schedule(d)); print("  soldBE",sold_be(tenure="own"))
    d=daily("gb300"); show("T4b default gb300 RENT on-demand", d, schedule(d))
    d=daily("gb300",basis="contract"); show("T4b default gb300 RENT contract", d, schedule(d))
    d=daily("gb300",tenure="own"); show("T4b default gb300 OWN", d, schedule(d))
    d=daily(u=1.0); show("T4c rent peak gb200 u=1", d)
    # T5 pitch: fastest measured throughput, everything sold, list price
    d=daily(I=94.7,u=1.0,price="list",tenure="own"); show("T5 pitch gb200 OWN", d, schedule(d,decline=0.0))
    # T6 bear: 80% achieved, 50% sold, low price, 70%/yr decline
    d=daily(a=0.8,u=0.5,price="floor"); show("T6 bear gb200 RENT", d, schedule(d,decline=0.7)); print("  soldBE",sold_be(a=0.8,u=0.5,price="floor"))
    d=daily(a=0.8,u=0.5,price="floor",tenure="own"); show("T6 bear gb200 OWN", d, schedule(d,decline=0.7))
    # T7 break-even output price with io=0 (no input revenue, less prefill), pitch otherwise
    d=daily(I=94.7,u=1.0,price="list",tenure="own",io=0.0); print("\nT7 breakeven P_out (io=0, pitch own): cap",round(d['cap'],4),"full cost/day",round(d['cost'],2),"-> $/M",round(d['fullCostM'],5))
    # T8 demand share
    d=daily(); print("T8 tokens/day",round((d['out']+d['inp'])/1e9,4),"B; of OpenRouter 8.7T:",round((d['out']+d['inp'])/8.7e12,6),"; of DeepSeek 776B:",round((d['out']+d['inp'])/7.76e11,5))
    # T9 lead time
    d=daily(tenure="own"); print("T9 own with m0=6:",schedule(d,m0=6))
    d=daily(); print("T9b rent with m0=2:",schedule(d,m0=2))
    # T10 zero utilization, owning
    d=daily(u=0.0,tenure="own"); print("T10 own u=0: revenue",d['revenue'],"elec/day",round(d['elec'],2))
    # T12 overhead: 10% of revenue
    d=daily(oh=0.10); show("T12 default gb200 RENT, 10% overhead", d, schedule(d)); print("  soldBE",sold_be(oh=0.10))
    # T11 prefill properties at peak
    for kw in (dict(c=0.0),dict(c=0.95),dict(io=20.0),dict(pf=6400.0)):
        print("T11",kw,"cap",round(daily(u=1.0,**kw)["cap"],4))
