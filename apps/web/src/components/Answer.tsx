import { fmtPct, fmtTokens, fmtUsdInt } from '@token-margin/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';

/** Martian Mono sets commas a full cell wide; tuck them in so $23,309 reads as one number. */
function Tight({ text }: { text: string }) {
  return <>{text.split(/(,)/).map((part, k) => (part === ',' ? <span key={k} className="cm">,</span> : part))}</>;
}

/** How the rack's GPUs split by what their output pays for: profit, cost, or nothing (unsold). */
export function rackSplit(revenue: number, cost: number, utilization: number, gpus: number) {
  const working = Math.round(gpus * utilization);
  const costShare = revenue > 0 ? Math.min(1, cost / revenue) : 1;
  const forCost = Math.round(working * costShare);
  return { profit: working - forCost, cost: forCost, unused: gpus - working, covered: cost > 0 ? revenue / cost : 1 };
}

export function Answer({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const rack = A.racks[s.rack];
  const owning = s.tenure === 'own';
  const utilization = i.utilization;
  const split = rackSplit(d.revenueUsd, d.costUsd, utilization, d.gpus);
  const rackHr = m.rent * rack.gpus;
  const costNote = owning
    ? 'power, space, upkeep, wear'
    : `${fmtUsdInt(rackHr)}/hr ${s.rentBasis === 'contract' ? '3-yr contract' : 'on demand'}`;
  const loss = d.operatingProfitUsd < 0;

  const cells = Array.from({ length: d.gpus }, (_, k) =>
    k < split.profit ? 'p' : k < split.profit + split.cost ? 'c' : 'u');

  return (
    <section className="answer" aria-label="One day">
      <p className="lede">
        One {rack.label} rack, 72 GPUs, one day of serving {A.model.label} at {Math.round(i.interactivity)} tokens/s per user.
      </p>

      <div className="eq" data-testid="equation">
        <div className="term">
          <span className="big" data-testid="revenue"><Tight text={fmtUsdInt(d.revenueUsd)} /></span>
          <span className="sub">revenue</span>
          <span className="note">{fmtTokens(d.outputTokens)} out · {fmtTokens(d.inputTokens)} in</span>
        </div>
        <span className="op" aria-hidden>−</span>
        <div className="term">
          <span className="big" data-testid="cost"><Tight text={fmtUsdInt(d.costUsd)} /></span>
          <span className="sub">{owning ? 'cost of owning' : 'rent'}</span>
          <span className="note">{costNote}</span>
        </div>
        <span className="op" aria-hidden>=</span>
        <div className="term">
          <span className={`big profit${loss ? ' loss' : ''}`} data-testid="profit"><Tight text={fmtUsdInt(d.operatingProfitUsd)} /></span>
          <span className="sub">{loss ? 'loss' : 'profit'}</span>
          <span className="note" data-testid="margin">{fmtPct(d.operatingMargin)} margin</span>
        </div>
      </div>

      <figure className="rack" aria-label={`Rack of ${d.gpus} GPUs`}>
        <div className="cells" role="img" aria-hidden>
          {cells.map((c, k) => <i key={k} className={c} />)}
        </div>
        <figcaption data-testid="rack-caption">
          {split.profit > 0 ? (
            <>
              Output of <b className="k-p">{split.profit}</b> GPUs is profit, <b className="k-c">{split.cost}</b> pay {owning ? 'for the rack' : 'the rent'},{' '}
              <b className="k-u">{split.unused}</b> unused at {fmtPct(utilization)} utilization
            </>
          ) : (
            <>
              Output of all <b className="k-c">{split.cost}</b> busy GPUs covers {fmtPct(split.covered)} of {owning ? 'the cost' : 'the rent'},{' '}
              <b className="k-u">{split.unused}</b> unused at {fmtPct(utilization)} utilization
            </>
          )}
        </figcaption>
      </figure>
    </section>
  );
}
