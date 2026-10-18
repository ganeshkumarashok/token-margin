import type { PricePresetId, Settings } from '@gpu-roi/engine';
import { A } from '../data';
import { Info } from './Info';
import { Segmented } from './Knob';

type Choice = PricePresetId | 'custom';

export function PriceKnobs({ settings, update }: { settings: Settings; update: (p: Partial<Settings>) => void }) {
  const choice: Choice = settings.customPrice ? 'custom' : settings.pricePreset;
  const current = settings.customPrice ?? A.pricePresets[settings.pricePreset];
  const preset = A.pricePresets[settings.pricePreset];

  const pick = (c: Choice) => {
    if (c === 'custom') update({ customPrice: { inUsdPerM: current.inUsdPerM, cacheUsdPerM: current.cacheUsdPerM, outUsdPerM: current.outUsdPerM } });
    else update({ pricePreset: c, customPrice: null });
  };

  const setCustom = (k: 'inUsdPerM' | 'cacheUsdPerM' | 'outUsdPerM', v: number) => {
    if (!Number.isFinite(v) || v < 0) return;
    update({ customPrice: { ...current, [k]: v } });
  };

  return (
    <div className="knob" data-testid="knob-price">
      <div className="knob-head">
        <span className="knob-label">Token price</span>
        <Info sourceId={choice === 'custom' ? 'assumption' : preset.source} note={choice === 'custom' ? 'Your prices, $ per million tokens' : preset.note ?? preset.label} />
        <span className="knob-value muted small">$/M in · cached · out</span>
      </div>
      <Segmented<Choice>
        label="Token price"
        value={choice}
        onChange={pick}
        options={[
          { id: 'floor', label: 'Floor' },
          { id: 'median', label: 'Median' },
          { id: 'list', label: 'List' },
          { id: 'custom', label: 'Custom' },
        ]}
      />
      {choice === 'custom' ? (
        <div className="price-grid">
          {(['inUsdPerM', 'cacheUsdPerM', 'outUsdPerM'] as const).map((k) => (
            <label key={k}>
              <span>{k === 'inUsdPerM' ? 'Input' : k === 'cacheUsdPerM' ? 'Cached' : 'Output'}</span>
              <input
                className="knob-num"
                inputMode="decimal"
                defaultValue={current[k]}
                aria-label={`Custom ${k === 'inUsdPerM' ? 'input' : k === 'cacheUsdPerM' ? 'cached input' : 'output'} price`}
                onBlur={(e) => setCustom(k, Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setCustom(k, Number((e.target as HTMLInputElement).value));
                }}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="price-line">
          ${current.inUsdPerM.toFixed(current.inUsdPerM < 1 ? 3 : 2)} · ${current.cacheUsdPerM.toFixed(3)} · ${current.outUsdPerM.toFixed(2)}
        </div>
      )}
    </div>
  );
}
