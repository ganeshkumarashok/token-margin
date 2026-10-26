"""Average-to-peak load of production LLM traffic, from the Azure LLM Inference Dataset 2024 (CC-BY).

Capacity sized for the busiest hour (or 5 minutes) sells, on average, mean load / peak load of it.
Download the week-long traces (AzureLLMInferenceTrace_conv_1week.csv, AzureLLMInferenceTrace_code_1week.csv) from
https://github.com/Azure/AzurePublicDataset/blob/master/AzureLLMInferenceDataset2024.md, then:

    python3 research/azure_trace_utilization.py AzureLLMInferenceTrace_conv_1week.csv AzureLLMInferenceTrace_code_1week.csv

Each CSV row is TIMESTAMP,ContextTokens,GeneratedTokens.
"""
import sys, collections
def load(path, gran):  # gran: chars of timestamp to bucket: 13=hour, 16=minute
    req=collections.Counter(); out=collections.Counter(); tot=collections.Counter()
    with open(path) as f:
        next(f)
        for line in f:
            ts,c,g=line.rstrip().split(',')
            if gran=='5m':
                k=ts[:15]+str(int(ts[15])//5*5)
            else:
                k=ts[:13]
            req[k]+=1; out[k]+=int(g); tot[k]+=int(c)+int(g)
    return req,out,tot
def stats(name,s):
    keys=sorted(s); vals=[s[k] for k in keys]
    # drop partial edges
    n=len(vals); mean=sum(vals)/n; pk=max(vals)
    days=collections.defaultdict(list)
    for k,v in zip(keys,vals): days[k[:10]].append(v)
    full=[d for d in days if len(days[d])==max(len(x) for x in days.values())]
    dr=[ (sum(days[d])/len(days[d]))/max(days[d]) for d in full]
    dm=[sum(days[d])/len(days[d]) for d in full]
    print(f"  {name}: buckets={n} days={len(full)} week avg/peak={mean/pk:.3f} (peak/avg {pk/mean:.2f}); mean of daily avg/peak={sum(dr)/len(dr):.3f} range {min(dr):.3f}-{max(dr):.3f}; week avg / busiest-day avg={ (sum(dm)/len(dm))/max(dm):.3f}; min/peak={min(vals)/pk:.3f}")
    srt=sorted(vals); p95=srt[int(0.95*n)]; print(f"     avg/p95={mean/p95:.3f}")
for path in sys.argv[1:]:
    for gran in ['hour','5m']:
        r,o,t=load(path,gran)
        print(path.split('/')[-1],gran)
        stats('requests',r); stats('output tokens',o); stats('total tokens',t)
