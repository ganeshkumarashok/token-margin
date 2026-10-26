import { fmtPct, fmtTokens, fmtUsdInt } from '@token-margin/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { ProfitChart } from './ProfitChart';

/** Martian Mono sets commas a full cell wide; tuck them in so $23,309 reads as one number. */
function Tight({ text }: { text: string }) {
  return <>{text.split(/(,)/).map((part, k) => (part === ',' ? <span key={k} className="cm">,</span> : part))}</>;
}

export function Answer({ m }: { m: Model }) {
  const { settings: s, result, inputs: i } = m;
  const d = result.daily;
  const rack = A.racks[s.rack];
  const owning = s.tenure === 'own';
  const costNote = owning
    ? 'power, space, support, ops, wear'
    : `${fmtUsdInt(m.rent * rack.gpus)}/hr ${s.rentBasis === 'contract' ? '3-yr contract' : 'on demand'}`;
  const loss = d.operatingProfitUsd < 0;
  const gross = i.overheadPct === 0;

  return (
    <section className="answer" aria-label="One day">
      <p className="lede">
        One <span className="nb">{rack.label}</span> rack serving <span className="nb">{A.model.label}</span> for a day at {Math.round(i.interactivity)} tokens/s per user.
      </p>

      <div className="eq" data-testid="equation">
        <div className="term">
          <span className="big" data-testid="revenue"><Tight text={fmtUsdInt(d.revenueUsd)} /></span>
          <span className="sub">revenue</span>
          <span className="note">{fmtTokens(d.outputTokens)} out · {fmtTokens(d.inputTokens)} in</span>
        </div>
        <span className="op" aria-hidden>−</span>
        <div className="term">
          <span className="big" data-testid="cost"><Tight text={fmtUsdInt(d.costUsd - d.overheadUsd)} /></span>
          <span className="sub">{owning ? 'cost of owning' : 'rent'}</span>
          <span className="note">{costNote}</span>
        </div>
        {!gross && (
          <>
            <span className="op" aria-hidden>−</span>
            <div className="term">
              <span className="big" data-testid="overhead"><Tight text={fmtUsdInt(d.overheadUsd)} /></span>
              <span className="sub">overhead</span>
              <span className="note">{fmtPct(i.overheadPct)} of revenue</span>
            </div>
          </>
        )}
        <span className="op" aria-hidden>=</span>
        <div className="term">
          <span className={`big profit${loss ? ' loss' : ''}`} data-testid="profit"><Tight text={fmtUsdInt(d.operatingProfitUsd)} /></span>
          <span className="sub">{gross ? (loss ? 'gross loss' : 'gross profit') : loss ? 'loss' : 'profit'}</span>
          <span className="note" data-testid="margin">{fmtPct(d.operatingMargin)} {gross ? 'gross margin' : 'margin'}</span>
        </div>
      </div>

      <ProfitChart m={m} />
    </section>
  );
}
