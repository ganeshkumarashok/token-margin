import { fmtUsdPerM, priceFactor } from '@gpu-roi/engine';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Model } from '../state/useModel';
import { axisProps, C } from './chartTheme';

/**
 * Revenue per million output tokens includes the input-token revenue that rides along with each output token
 * (ISL/OSL × price), so it is comparable to cost per million output tokens. Output price alone would understate it.
 */
export function PriceVsCostChart({ model }: { model: Model }) {
  const { daily: d, schedule: s } = model.result;
  const i = model.inputs;
  const mOut = d.outputTokens / 1e6;
  if (mOut <= 0) {
    return (
      <figure className="card">
        <figcaption><h3>Revenue vs cost per million output tokens</h3></figcaption>
        <p className="muted">No tokens sold at 0% utilization.</p>
      </figure>
    );
  }
  const rev0 = d.revenueUsd / mOut;
  const cash = d.cashCostPerMOut ?? 0;
  const full = d.fullCostPerMOut ?? 0;
  const data = Array.from({ length: s.months + 1 }, (_, m) => ({ m, rev: rev0 * priceFactor(i, Math.max(1, m)), cash, full }));
  const cross = data.find((p) => p.rev < full);
  const summary = `Revenue per million output tokens starts at ${fmtUsdPerM(rev0)} and ends at ${fmtUsdPerM(data[data.length - 1].rev)}; full cost is ${fmtUsdPerM(full)}, cash cost ${fmtUsdPerM(cash)}.${cross ? ` Revenue falls below full cost in month ${cross.m}.` : ''}`;
  const all = data.flatMap((p) => [p.rev, p.cash, p.full]).filter((v) => v > 0);
  const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...all))));
  const hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...all))));
  return (
    <figure className="card">
      <figcaption>
        <h3>Revenue vs cost per million output tokens</h3>
        <span className="muted small">$ per M output tokens, log scale · revenue includes the input tokens billed with them</span>
      </figcaption>
      <p className="sr-only">{summary}</p>
      <div className="chart" aria-hidden>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="m" {...axisProps} type="number" domain={[0, s.months]} tickCount={7} allowDecimals={false} />
            <YAxis {...axisProps} width={56} scale="log" domain={[lo, hi]} allowDataOverflow tickFormatter={(v: number) => fmtUsdPerM(v)} />
            <Tooltip
              formatter={(v: number, name: string) => [fmtUsdPerM(v), name]}
              labelFormatter={(m: number) => `Month ${m}`}
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--grid)', borderRadius: 8, color: 'var(--text-primary)' }}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            {cross && <ReferenceLine x={cross.m} stroke={C.axis} strokeDasharray="3 3" label={{ value: 'below cost', position: 'insideTopRight', fill: C.ink, fontSize: 12 }} />}
            <Line name="Revenue" type="monotone" dataKey="rev" stroke={C.s1} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line name="Full cost" type="linear" dataKey="full" stroke={C.s2} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line name="Cash cost" type="linear" dataKey="cash" stroke={C.s3} strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
