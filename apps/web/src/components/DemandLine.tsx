import { fmtPct, fmtTokens } from '@gpu-roi/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { Info } from './Info';

export function DemandLine({ model }: { model: Model }) {
  const { demand, result } = model;
  const rental = A.anchors.rentalUsdPerGpuHr;
  return (
    <p className="demand" data-testid="demand-line">
      <span>
        Sells {fmtTokens(demand.tokensPerDay)} tokens/day: {fmtPct(demand.shareOfOpenRouter)} of OpenRouter
        <Info sourceId={A.anchors.openrouterTokensPerDay.source} note="All of OpenRouter, every model: ~8.7T tokens/day." />
      </span>
      <span className="sep" aria-hidden>·</span>
      <span>
        {fmtPct(demand.shareOfDeepSeek2025)} of DeepSeek's Feb-2025 volume
        <Info sourceId={A.anchors.deepseekTokensPerDay.source} note="DeepSeek's entire API + app: 776B tokens/day on 1,814 GPUs." />
      </span>
      <span className="sep" aria-hidden>·</span>
      <span>
        ${result.daily.revenuePerGpuHr.toFixed(2)}/GPU-hr earned vs ${rental.committed.toFixed(2)} lease
        <Info sourceId={rental.source} note={`Committed lease ~$${rental.committed}/GPU-hr; on-demand ~$${rental.onDemand}.`} />
      </span>
    </p>
  );
}
