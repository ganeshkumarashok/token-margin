import raw from '../../../data/assumptions.json';
import { applyPreset, curveFor, defaultSettings, inputsFromSettings, type Assumptions, type Settings } from '../src';

export const A = raw as unknown as Assumptions;
export const gb200 = curveFor(A, 'gb200');
export const gb300 = curveFor(A, 'gb300');

export function settings(over: Partial<Settings> = {}): Settings {
  return { ...defaultSettings(A), ...over };
}
export function inputs(over: Partial<Settings> = {}) {
  return inputsFromSettings(A, settings(over));
}
export function presetInputs(id: 'pitch' | 'realistic' | 'bear', over: Partial<Settings> = {}) {
  return inputsFromSettings(A, applyPreset(A, settings(over), id));
}
