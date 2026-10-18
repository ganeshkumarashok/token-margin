import { fmtPayback, fmtUsd } from '@gpu-roi/engine';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Model } from '../state/useModel';
import { axisProps, C } from './chartTheme';

export function CashflowChart({ model }: { model: Model }) {
  const s = model.result.schedule;
  const data = s.cumulative.map((v, m) => ({ m, cum: v / 1e6 }));
  const last = s.cumulative[s.months] / 1e6;
  const withRes = (s.cumulative[s.months] + s.residualUsd) / 1e6;
  const summary = `Cumulative cash starts at ${fmtUsd(s.cumulative[0])}, ends at ${fmtUsd(s.cumulative[s.months])} after ${s.months} months; payback ${fmtPayback(s.paybackMonth, s.months)}.`;
  return (
    <figure className="card">
      <figcaption>
        <h3>Cumulative cash</h3>
        <span className="muted small">$M · month 0 = rack bought · dashed = resale</span>
      </figcaption>
      <p className="sr-only">{summary}</p>
      <div className="chart" aria-hidden>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="m" {...axisProps} type="number" domain={[0, s.months]} tickCount={7} allowDecimals={false} />
            <YAxis {...axisProps} width={56} tickFormatter={(v: number) => `${Number(v.toPrecision(3))}`} domain={['auto', 'auto']} />
            <ReferenceLine y={0} stroke={C.axis} strokeWidth={1} />
            <Tooltip
              formatter={(v: number) => [fmtUsd(v * 1e6), 'Cumulative cash']}
              labelFormatter={(m: number) => `Month ${m}`}
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--grid)', borderRadius: 8, color: 'var(--text-primary)' }}
            />
            <Line type="linear" dataKey="cum" stroke={C.s1} strokeWidth={2} dot={false} isAnimationActive={false} />
            {s.residualUsd > 0 && (
              <ReferenceLine segment={[{ x: s.months, y: last }, { x: s.months, y: withRes }]} stroke={C.s1} strokeDasharray="4 3" strokeWidth={2} />
            )}
            {s.paybackMonth !== null && (
              <ReferenceDot x={s.paybackMonth} y={s.cumulative[s.paybackMonth] / 1e6} r={5} fill={C.s1} stroke={C.surface} strokeWidth={2}
                label={(p: { viewBox?: { x?: number; y?: number } }) => (
                  // below-right of the point: empty space (curve is left/below and right/above)
                  <text x={(p.viewBox?.x ?? 0) + 10} y={(p.viewBox?.y ?? 0) + 20} fill="var(--text-primary)" fontSize={12}>
                    payback {fmtPayback(s.paybackMonth, s.months)}
                  </text>
                )} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
