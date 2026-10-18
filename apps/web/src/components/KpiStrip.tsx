import { fmtIrr, fmtPayback, fmtPct, fmtTokens, fmtUsd } from '@gpu-roi/engine';
import type { Model } from '../state/useModel';

export function KpiStrip({ model }: { model: Model }) {
  const { daily: d, schedule: s } = model.result;
  const tiles: Array<[string, string, string]> = [
    ['kpi-tokens', 'Output tokens / day', fmtTokens(d.outputTokens)],
    ['kpi-revenue', 'Revenue / day', fmtUsd(d.revenueUsd)],
    ['kpi-cost', 'Cash cost / day', fmtUsd(d.cashCostUsd)],
    ['kpi-margin', 'Cash margin', fmtPct(d.cashMargin)],
    ['kpi-payback', 'Payback', fmtPayback(s.paybackMonth, s.months)],
    ['kpi-irr', 'IRR', fmtIrr(s.irr)],
  ];
  return (
    <section className="kpis" aria-label="Results">
      {tiles.map(([id, label, value]) => (
        <div className={`kpi ${id === 'kpi-payback' ? 'kpi-hero' : ''}`} key={id} data-testid={id}>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
      ))}
    </section>
  );
}
