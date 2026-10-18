import { useEffect, useId, useState } from 'react';
import { Info } from './Info';

export interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** display = value × scale (e.g. 100 for percent) */
  scale?: number;
  unit?: string;
  decimals?: number;
  sourceId?: string;
  note?: string;
  testId?: string;
  onChange: (v: number) => void;
  children?: React.ReactNode;
}

export function Knob({ label, value, min, max, step, scale = 1, unit, decimals, sourceId, note, testId, onChange, children }: KnobProps) {
  const id = useId();
  const dec = decimals ?? Math.max(0, -Math.floor(Math.log10(step * scale) + 1e-9));
  const shown = (value * scale).toFixed(dec);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = (text: string) => {
    const v = Number(text) / scale;
    if (Number.isFinite(v) && text.trim() !== '') onChange(Math.min(Math.max(v, min), max));
    else setDraft(shown);
  };

  return (
    <div className="knob" data-testid={testId}>
      <div className="knob-head">
        <label htmlFor={id} className="knob-label">
          {label}
        </label>
        <Info sourceId={sourceId} note={note} />
        <span className="knob-value">
          <input
            id={`${id}-num`}
            className="knob-num"
            inputMode="decimal"
            aria-label={`${label} value`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
            }}
          />
          {unit && <span className="knob-unit">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="knob-range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  label, value, options, onChange, testId,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label} data-testid={testId}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={value === o.id ? 'on' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
