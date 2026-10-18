import { fmtPct, fmtUsd, fmtUsdPerM, impliedTps } from '@gpu-roi/engine';
import { A } from '../data';
import type { Model } from '../state/useModel';

export function Details({ model }: { model: Model }) {
  const { daily: d } = model.result;
  const be = model.be;
  const mOut = d.outputTokens / 1e6;
  const perM = (v: number) => (mOut > 0 ? fmtUsdPerM(v / mOut) : '—');
  const rows: Array<[string, number]> = [
    ['Electricity', d.electricityUsd],
    ['Colocation', d.coloUsd],
    ['Other opex', d.otherOpexUsd],
    ['Depreciation', d.depreciationUsd],
  ];
  const claim = A.anchors.nvidiaClaim;
  const needTps = impliedTps(claim.revenueUsd / claim.years, claim.priceOutUsdPerM, claim.gpus);
  const soldTps = d.tpsPerGpu * model.inputs.utilization;
  return (
    <section className="card details" aria-label="Cost stack and break-evens">
      <div>
        <h3>Cost per day</h3>
        <table className="cost">
          <thead>
            <tr><th scope="col">Item</th><th scope="col">Per day</th><th scope="col">Per M output</th></tr>
          </thead>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}><th scope="row">{k}</th><td>{fmtUsd(v)}</td><td>{perM(v)}</td></tr>
            ))}
            <tr className="total"><th scope="row">Total</th><td>{fmtUsd(d.cashCostUsd + d.depreciationUsd)}</td><td>{fmtUsdPerM(d.fullCostPerMOut)}</td></tr>
            <tr><th scope="row">Revenue</th><td>{fmtUsd(d.revenueUsd)}</td><td>{perM(d.revenueUsd)}</td></tr>
          </tbody>
        </table>
        <p className="muted small">Revenue split: output {fmtUsd(d.outputRevenueUsd)} · input {fmtUsd(d.inputRevenueUsd)}.</p>
      </div>
      <div>
        <h3>Break-evens</h3>
        <ul className="be" data-testid="breakevens">
          <li>
            <b>Prices can fall to {fmtPct(be.priceLevel)}</b> of today's before operating profit hits zero
            {be.outPriceUsdPerM !== null && <> (output {fmtUsdPerM(be.outPriceUsdPerM)}/M)</>}.
          </li>
          <li>
            <b>Utilization for payback within life:</b>{' '}
            {be.utilizationForPaybackAtLife === null ? 'none, even fully sold' : fmtPct(be.utilizationForPaybackAtLife)}.
          </li>
          <li>
            <b>Price decline at which NPV = 0:</b>{' '}
            {be.priceDeclineForZeroNpv === null ? 'none; NPV < 0 even with flat prices' : be.priceDeclineForZeroNpv >= 0.98 ? '≥98%/yr' : `${fmtPct(be.priceDeclineForZeroNpv)}/yr`}.
          </li>
        </ul>
        <h3>The claim</h3>
        <p className="small">
          NVIDIA: ${claim.capexUsd / 1e6}M rack → ${claim.revenueUsd / 1e6}M in {claim.years} years at ${claim.priceOutUsdPerM}/M output. That needs{' '}
          <b>{Math.round(needTps).toLocaleString('en-US')}</b> output tok/s per GPU sold 24×7. This scenario sells <b>{Math.round(soldTps).toLocaleString('en-US')}</b>.
        </p>
      </div>
    </section>
  );
}
