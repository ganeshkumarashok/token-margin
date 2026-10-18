/** Chart colors are CSS variables so light/dark swap in one place (styles.css). */
export const C = {
  s1: 'var(--series-1)',
  s2: 'var(--series-2)',
  s3: 'var(--series-3)',
  grid: 'var(--grid)',
  axis: 'var(--text-muted)',
  ink: 'var(--text-primary)',
  surface: 'var(--surface-1)',
};
export const axisProps = {
  stroke: C.grid,
  tick: { fill: C.axis, fontSize: 12 },
  tickLine: false,
} as const;
