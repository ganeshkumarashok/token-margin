import { throughputAt } from '@gpu-roi/engine';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import { A } from '../data';
import type { Model } from '../state/useModel';
import { axisProps, C } from './chartTheme';

export function CurveChart({ model }: { model: Model }) {
  const { points, inputs, result, settings } = model;
  const x0 = points[0].interactivity;
  const x1 = points[points.length - 1].interactivity;
  const line = Array.from({ length: x1 - x0 + 1 }, (_, k) => ({ x: x0 + k, y: throughputAt(points, x0 + k) }));
  const published = points.map((p) => ({ x: p.interactivity, y: p.tps }));
  const bench = throughputAt(points, inputs.interactivity);
  const op = [{ x: inputs.interactivity, y: Math.max(result.daily.tpsPerGpu, 1) }];
  const curve = A.curves[settings.rack];
  const minY = Math.pow(10, Math.floor(Math.log10(Math.min(op[0].y, ...published.map((p) => p.y)))));
  return (
    <figure className="card">
      <figcaption>
        <h3>Throughput vs serving speed</h3>
        <span className="muted small">InferenceX · {curve.label} · output tok/s per GPU, log scale · dots = published, ring = this scenario</span>
      </figcaption>
      <p className="sr-only">
        At {inputs.interactivity} tokens per second per user the benchmark gives {Math.round(bench)} output tokens per second per GPU; this scenario achieves {Math.round(result.daily.tpsPerGpu)}.
      </p>
      <div className="chart" aria-hidden>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="x" type="number" {...axisProps} domain={[Math.floor(x0 / 10) * 10, Math.ceil(x1 / 10) * 10]} ticks={Array.from({ length: Math.ceil(x1 / 10) - Math.floor(x0 / 10) + 1 }, (_, k) => (Math.floor(x0 / 10) + k) * 10)} />
            <YAxis dataKey="y" type="number" {...axisProps} width={56} scale="log" domain={[minY, 20000]} allowDataOverflow
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)} />
            <Tooltip
              formatter={(v: number) => [`${Math.round(v).toLocaleString('en-US')} tok/s/GPU`, '']}
              labelFormatter={(x: number) => `${x} tok/s per user`}
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--grid)', borderRadius: 8, color: 'var(--text-primary)' }}
            />
            <Line data={line} dataKey="y" stroke={C.s1} strokeWidth={2} dot={false} isAnimationActive={false} name="Benchmark" />
            <Scatter data={published} fill={C.s1} isAnimationActive={false} name="Published" />
            <Scatter data={op} isAnimationActive={false} name="This scenario"
              shape={(p: { cx?: number; cy?: number }) => (
                <circle cx={p.cx} cy={p.cy} r={7} fill="none" stroke={C.s2} strokeWidth={3} />
              )} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="muted small chart-note">
        Ring sits below the line by the achieved-throughput knob ({Math.round(inputs.achieved * 100)}%).
      </p>
    </figure>
  );
}
