import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fmtPct, fmtUsdInt, type Settings } from '@token-margin/engine';
import { breakEven, profitOf, settingsForMode, type Model } from '../state/useModel';

type Basis = 'onDemand' | 'contract' | 'own';
const BASES: Basis[] = ['onDemand', 'contract', 'own'];
const LABEL: Record<Basis, string> = { onDemand: 'on demand', contract: '3-yr contract', own: 'own' };
const DOING: Record<Basis, string> = { onDemand: 'renting on demand', contract: 'renting on a 3-yr contract', own: 'owning' };
const STEPS = 50;

/** Rounds a step to 1, 2 or 5 × 10^n so axis labels stay readable. */
function niceStep(span: number, ticks: number): number {
  const raw = span / ticks;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Axis money: $20K, −$10K. */
const fmtAxis = (v: number) => (v === 0 ? '$0' : `${v < 0 ? '−' : ''}$${Math.abs(v) >= 1000 ? `${+(Math.abs(v) / 1000).toFixed(1)}K` : Math.abs(v)}`);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function ProfitChart({ m }: { m: Model }) {
  const s = m.settings;
  const active: Basis = s.tenure === 'own' ? 'own' : s.rentBasis;
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const lines = useMemo(() => BASES.map((b) => {
    const sb = settingsForMode(s, b, m.modes);
    const pts = Array.from({ length: STEPS + 1 }, (_, k) => profitOf({ ...sb, utilization: k / STEPS }));
    return { b, sb, pts, zero: breakEven(sb, 'utilization', 0, 1) };
  }), [s, m.modes]);

  const narrow = width < 520;
  const H = narrow ? 260 : 280;
  const pad = { l: narrow ? 52 : 60, r: narrow ? 84 : 110, t: 14, b: 34 };
  const all = lines.flatMap((l) => l.pts).concat(0);
  const step = niceStep(Math.max(...all) - Math.min(...all), narrow ? 4 : 5);
  const yMin = Math.floor(Math.min(...all) / step) * step;
  const yMax = Math.ceil(Math.max(...all) / step) * step;
  const x = (u: number) => pad.l + u * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + ((yMax - v) / (yMax - yMin)) * (H - pad.t - pad.b);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-6; v += step) ticks.push(v);

  const cur = lines.find((l) => l.b === active)!;
  const uNow = s.utilization;
  const pNow = m.result.daily.operatingProfitUsd;

  // End labels on the right, nudged apart so they never overlap.
  const ends = lines.map((l) => ({ b: l.b, y: y(l.pts[STEPS]) })).sort((a, c) => a.y - c.y);
  for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 15);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width;
    setHover(Math.min(1, Math.max(0, Math.round(u * STEPS) / STEPS)));
  };

  const summary = lines.map((l) => `${DOING[l.b]} breaks even at ${l.zero === null ? 'no utilization' : fmtPct(l.zero)}`).join('; ');

  return (
    <figure className="pchart" data-testid="profit-chart">
      <figcaption>Profit per day as the rack gets busier</figcaption>
      <div ref={wrap} className="pchart-box">
        <svg width={width} height={H} role="img" aria-label={`Profit per day against GPU utilization. ${summary}.`}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} className={v === 0 ? 'zero' : 'grid'} />
              <text x={pad.l - 8} y={y(v)} dy="0.32em" textAnchor="end" className="tick">{fmtAxis(v)}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((u) => (
            <text key={u} x={x(u)} y={H - pad.b + 18} textAnchor={u === 0 ? 'start' : u === 1 ? 'end' : 'middle'} className="tick">{fmtPct(u)}</text>
          ))}
          <text x={width - pad.r} y={H - 2} textAnchor="end" className="axis">GPU utilization</text>

          {lines.map((l) => (
            <polyline key={l.b} className={l.b === active ? 'line on' : 'line'} fill="none"
              points={l.pts.map((p, k) => `${x(k / STEPS)},${y(p)}`).join(' ')} />
          ))}
          {lines.filter((l) => !narrow || l.b === active).map((l) => l.zero !== null && l.zero > 0 && (
            <g key={`z-${l.b}`} className={l.b === active ? 'be on' : 'be'}>
              <circle cx={x(l.zero)} cy={y(0)} r={3.5} />
              <text x={x(l.zero)} y={y(0) + 15} textAnchor="middle">{fmtPct(l.zero)}</text>
            </g>
          ))}

          {ends.map((e) => (
            <text key={`e-${e.b}`} x={width - pad.r + 8} y={e.y} dy="0.32em" className={e.b === active ? 'end on' : 'end'}>{LABEL[e.b]}</text>
          ))}

          <circle cx={x(uNow)} cy={y(pNow)} r={6} className="now" />

          {hover !== null && (
            <g className="hover">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} />
              {lines.map((l) => <circle key={l.b} cx={x(hover)} cy={y(l.pts[Math.round(hover * STEPS)])} r={3} />)}
            </g>
          )}
          <rect x={pad.l} y={pad.t} width={Math.max(0, width - pad.l - pad.r)} height={H - pad.t - pad.b} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
      </div>
      <div className="pchart-read" data-testid="chart-readout">
        {hover === null ? (
          <>At <b>{fmtPct(uNow)}</b> utilization: {fmtUsdInt(pNow)} a day {DOING[active]}. Break-even at {cur.zero === null ? 'no utilization' : fmtPct(cur.zero)}.</>
        ) : (
          <>At <b>{fmtPct(hover)}</b>: {lines.map((l, k) => (
            <span key={l.b}>{k > 0 ? ' · ' : ''}{LABEL[l.b]} {fmtUsdInt(l.pts[Math.round(hover * STEPS)])}</span>
          ))}</>
        )}
      </div>
    </figure>
  );
}

