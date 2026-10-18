"""Reference implementation used to derive the expected values in IMPLEMENTATION.md tests.
Mirrors the engine spec exactly (discrete monthly schedule). Run: python3 research/reference.py
"""
import math
DAY=86400
CURVES={"gb200":[(58,9598),(67,9135),(86,6589),(104,3619),(114,1997),(141,630)],
        "gb300":[(67,10192),(104,4394),(141,837)]}
RACK={"gb200":dict(gpus=72,price=3.9e6,itKw=120.0),"gb300":dict(gpus=72,price=5.0e6,itKw=132.0)}
PRICES={"floor":(0.5625,0.125,2.50),"median":(0.70,0.13,2.20),"list":(1.40,0.26,4.40)}

def tput(curve,I):
    xs=[p[0] for p in curve]; I=min(max(I,xs[0]),xs[-1])
    for (x0,y0),(x1,y1) in zip(curve,curve[1:]):
        if x0<=I<=x1:
            f=(I-x0)/(x1-x0); return math.exp(math.log(y0)+f*(math.log(y1)-math.log(y0)))

def daily(rack,racks,I,a,u,price,c=0.5,io=8.0,elec=0.1453,pue=1.2,idle=0.35,colo=200.0,ox=0.05,life=4.0,res=0.10,listShare=0.0,priceMult=1.0):
    r=RACK[rack]; pin,pc,po=[x*priceMult for x in PRICES[price]]; lin,lc,lo=PRICES["list"]
    capex=racks*r["price"]; gpus=racks*r["gpus"]
    tps=tput(CURVES[rack],I)*a
    out=tps*gpus*u*DAY; inp=out*io
    def rev(pin,pc,po): return (out*po+inp*(1-c)*pin+inp*c*pc)/1e6
    revenue=(1-listShare)*rev(pin,pc,po)+listShare*rev(lin,lc,lo)
    kw=r["itKw"]*racks*(u+(1-u)*idle)*pue
    e=kw*24*elec; cl=colo*r["itKw"]*racks*12/365; other=capex*ox/365
    cash=revenue-e-cl-other; dep=capex*(1-res)/(life*365)
    return dict(capex=capex,out=out,inp=inp,revenue=revenue,elec=e,colo=cl,other=other,cash=cash,dep=dep,
                cashM=cash/revenue if revenue else None, opM=(cash-dep)/revenue if revenue else None,
                cashCostM=(e+cl+other)/(out/1e6) if out else None, fullCostM=(e+cl+other+dep)/(out/1e6) if out else None,
                gpuHr=revenue/(gpus*24), tps=tps, inputRev=revenue-(out*po/1e6)*(1-listShare)-(out*lo/1e6)*listShare)

def schedule(d,life=4.0,decline=0.5,k=0.07,res=0.10,m0=0,idleElec=None):
    months=int(round(life*12)); flows=[-d["capex"]]
    for m in range(1,months+1):
        if m<=m0: flows.append(-(d["colo"]+d["other"])*365/12)  # lead time: no revenue, facility fixed costs accrue
        else:
            pf=(1-decline)**((m-1)/12)
            flows.append((d["revenue"]*pf-d["elec"]-d["colo"]-d["other"])*365/12)
    cum=0; payback=None
    for m,f in enumerate(flows):
        cum+=f
        if m>0 and payback is None and cum>=0: payback=m
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
    return dict(paybackMonth=payback,npv=npv,irr=irr,cum=cum)

def show(name,d,s=None):
    print(f"\n== {name}")
    for k_,v in d.items():
        if isinstance(v,float): print(f"  {k_:10} {v:,.4f}")
        else: print(f"  {k_:10} {v}")
    if s: print("  schedule", {k_:(round(v,4) if isinstance(v,float) else v) for k_,v in s.items()})

# T1 interpolation
print("T1 throughputAt gb200: 58->",tput(CURVES['gb200'],58)," 104->",tput(CURVES['gb200'],104)," 100->",round(tput(CURVES['gb200'],100),2)," 30(clamp)->",tput(CURVES['gb200'],30)," 200(clamp)->",tput(CURVES['gb200'],200))
print("   gb300: 100->",round(tput(CURVES['gb300'],100),2))
# T2 InferenceX cost per M
print("T2 costPerMillion(1.86, 9598) =",round(1.86e6/(3600*9598),5)," (2.31,10192)=",round(2.31e6/(3600*10192),5))
# T3 pitch (I=58 exact point)
d=daily("gb200",1,58,1.0,1.0,"list"); show("T3 pitch gb200 I=58 a=1 u=1 list c=0.5 io=8", d, schedule(d,decline=0.0))
# T4 realistic default
d=daily("gb200",1,100,0.5,0.6,"floor"); show("T4 realistic gb200 I=100 a=0.5 u=0.6 floor", d, schedule(d,decline=0.5))
d3=daily("gb300",1,100,0.5,0.6,"floor"); show("T4b realistic gb300", d3, schedule(d3,decline=0.5))
# T5 bear
d=daily("gb200",1,100,0.25,0.4,"floor",priceMult=0.5); show("T5 bear gb200 half floor", d, schedule(d,decline=0.7))
# T6 break-even output price with io=0 (no input revenue), pitch otherwise
d=daily("gb200",1,58,1.0,1.0,"list",io=0.0); print("\nT6 breakeven P_out (io=0, pitch): full cost/day",round(d['elec']+d['colo']+d['other']+d['dep'],2),"-> $/M",round((d['elec']+d['colo']+d['other']+d['dep'])/(d['out']/1e6),5))
# T7 DeepSeek revenue formula check
out=168e9; inp=608e9; c=342/608
rev=(out*2.19+inp*(1-c)*0.55+inp*c*0.14)/1e6; print("T7 DeepSeek theoretical revenue/day:",round(rev,0),"cost/day",1814*24*2)
# T8 NVIDIA implied tps
print("T8 NVIDIA implied tok/s/GPU:",round(75e6/3/2.0*1e6/72/(365*DAY),1))
# T9 demand share for realistic
d=daily("gb200",1,100,0.5,0.6,"floor"); print("T9 demand share realistic: tokens/day",round((d['out']+d['inp'])/1e9,2),"B; of OpenRouter 8.7T:",round((d['out']+d['inp'])/8.7e12*100,3),"% ; of DeepSeek 776B:",round((d['out']+d['inp'])/7.76e11*100,2),"%")
# T10 lead time 6 months realistic
d=daily("gb200",1,100,0.5,0.6,"floor"); print("T10 realistic with m0=6:",schedule(d,decline=0.5,m0=6))
# T11 zero utilization
d=daily("gb200",1,100,0.5,0.0,"floor"); print("T11 u=0: revenue",d['revenue'],"elec/day",round(d['elec'],2),"cashCostM",d['cashCostM'])
