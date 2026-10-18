import type { ScenarioPresetId } from '@gpu-roi/engine';
import type { Model } from '../state/useModel';

const blurbs: Record<ScenarioPresetId, string> = {
  pitch: 'Benchmark-best speed and throughput, sold out, list price, flat prices',
  realistic: '100 tok/s/user, half of benchmark, 60% sold, market floor, −50%/yr',
  bear: 'Quarter of benchmark, 40% sold, half the floor, −70%/yr',
};

export function PresetBar({ model }: { model: Model }) {
  return (
    <div className="presets" role="group" aria-label="Scenario presets">
      {(['pitch', 'realistic', 'bear'] as ScenarioPresetId[]).map((id) => (
        <button
          key={id}
          type="button"
          className={model.preset === id ? 'preset on' : 'preset'}
          aria-pressed={model.preset === id}
          title={blurbs[id]}
          onClick={() => model.choosePreset(id)}
        >
          {id === 'pitch' ? 'Pitch' : id === 'realistic' ? 'Realistic' : 'Bear'}
        </button>
      ))}
    </div>
  );
}
