import { evaluate, fmtPayback, type Inputs } from '@gpu-roi/engine';
import { useMemo, useState } from 'react';
import type { Model } from '../state/useModel';

const UTILS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
const DECLINES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

/** Binned sequential blue: light = fast payback, dark = slow. "Never" is hatched gray. */
const BINS: Array<{ max: number; label: string; fill: string; ink: string }> = [
  // Cell ink is fixed per bin (not themed): the fills are light in both modes for the first three bins.
  { max: 3, label: '≤3 mo', fill: 'var(--seq-1)', ink: '#0b0b0b' },
  { max: 6, label: '≤6 mo', fill: 'var(--seq-2)', ink: '#0b0b0b' },
  { max: 12, label: '≤1 yr', fill: 'var(--seq-3)', ink: '#0b0b0b' },
  { max: 24, label: '≤2 yr', fill: 'var(--seq-4)', ink: '#ffffff' },
  { max: Infinity, label: '>2 yr', fill: 'var(--seq-5)', ink: '#ffffff' },
];

function bin(m: number) {
  return BINS.find((b) => m <= b.max)!;
}

function short(m: number | null): string {
  if (m === null) return '—';
  if (m <= 1) return '≤1';
  if (m <= 24) return `${m}`;
  return `${(m / 12).toFixed(1)}y`;
}

export function PaybackHeatmap({ model }: { model: Model }) {
  const { inputs, points } = model;
  const [hover, setHover] = useState<{ u: number; d: number; m: number | null } | null>(null);
  const grid = useMemo(
    () =>
      UTILS.map((u) =>
        DECLINES.map((d) => {
          const x: Inputs = { ...inputs, utilization: u, priceDeclinePerYear: d };
          return evaluate(x, points).schedule.paybackMonth;
        }),
      ),
    [inputs, points],
  );
  const months = model.result.schedule.months;
  const cw = 40;
  const ch = 28;
  const left = 40;
  const top = 8;
  const w = left + cw * DECLINES.length + 4;
  const h = top + ch * UTILS.length + 30;
  const curU = UTILS.findIndex((u) => Math.abs(u - inputs.utilization) < 0.05 + 1e-9);
  const curD = DECLINES.findIndex((d) => Math.abs(d - inputs.priceDeclinePerYear) < 0.05 + 1e-9);
  const nNever = grid.flat().filter((m) => m === null).length;

  return (
    <figure className="card">
      <figcaption>
        <h3>Payback by utilization and price decline</h3>
        <span className="muted small">months · everything else as set · outlined = closest to this scenario</span>
      </figcaption>
      <p className="sr-only">
        {nNever} of 100 combinations never pay back within {months / 12} years. Higher utilization and slower price decline pay back faster.
      </p>
      <div className="heat-ylabel muted small">↑ utilization (share sold)</div>
      <div className="heat-wrap">
        <svg viewBox={`0 0 ${w} ${h}`} className="heat" role="img" aria-label="Payback heatmap" onMouseLeave={() => setHover(null)}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--never-bg)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--never-line)" strokeWidth="2" />
            </pattern>
          </defs>
          {UTILS.map((u, r) => (
            <text key={u} x={left - 6} y={top + r * ch + ch / 2 + 4} textAnchor="end" className="heat-axis">
              {Math.round(u * 100)}%
            </text>
          ))}
          {DECLINES.map((d, c) => (
            <text key={d} x={left + c * cw + cw / 2} y={top + UTILS.length * ch + 14} textAnchor="middle" className="heat-axis">
              {Math.round(d * 100)}%
            </text>
          ))}
          <text x={left + (cw * DECLINES.length) / 2} y={h - 2} textAnchor="middle" className="heat-axis">price decline per year →</text>
          {grid.map((row, r) =>
            row.map((m, c) => {
              const b = m === null ? null : bin(m);
              const x = left + c * cw;
              const y = top + r * ch;
              return (
                <g key={`${r}-${c}`} onMouseEnter={() => setHover({ u: UTILS[r], d: DECLINES[c], m })} onClick={() => setHover({ u: UTILS[r], d: DECLINES[c], m })}>
                  <rect x={x + 1} y={y + 1} width={cw - 2} height={ch - 2} rx={3} fill={b ? b.fill : 'url(#hatch)'} />
                  <text x={x + cw / 2} y={y + ch / 2 + 4} textAnchor="middle" className="heat-cell" fill={b ? b.ink : 'var(--text-secondary)'}>
                    {short(m)}
                  </text>
                </g>
              );
            }),
          )}
          {curU >= 0 && curD >= 0 && (
            <rect x={left + curD * cw} y={top + curU * ch} width={cw} height={ch} rx={4} fill="none" stroke="var(--text-primary)" strokeWidth={2} />
          )}
        </svg>
      </div>
      <div className="heat-legend small">
        {BINS.map((b) => (
          <span key={b.label}><i style={{ background: b.fill }} />{b.label}</span>
        ))}
        <span><i className="never-swatch" />never in {months / 12} yr</span>
      </div>
      <p className="heat-tip small" aria-live="polite">
        {hover ? `${Math.round(hover.u * 100)}% sold · prices −${Math.round(hover.d * 100)}%/yr → payback ${fmtPayback(hover.m, months)}` : 'Hover or tap a cell.'}
      </p>
    </figure>
  );
}
