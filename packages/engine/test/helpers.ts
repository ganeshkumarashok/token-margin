import raw from '../../../data/assumptions.json';
import { applyPreset, curveFor, defaultSettings, inputsFromSettings, withModel, type Assumptions, type ModelId, type Settings } from '../src';

export const A = raw as unknown as Assumptions;
export const gb200 = curveFor(A, 'gb200');
export const gb300 = curveFor(A, 'gb300');

export function settings(over: Partial<Settings> = {}): Settings {
  return { ...defaultSettings(A), ...over };
}
/** Defaults (renting). */
export function inputs(over: Partial<Settings> = {}) {
  return inputsFromSettings(A, settings(over));
}
export function rent(over: Partial<Settings> = {}) {
  return inputs({ tenure: 'rent', ...over });
}
export function own(over: Partial<Settings> = {}) {
  return inputs({ tenure: 'own', ...over });
}
export function presetInputs(id: 'pitch' | 'realistic' | 'bear', over: Partial<Settings> = {}) {
  return inputsFromSettings(A, applyPreset(A, settings(over), id));
}
/** Defaults for another model (its own traffic mix), then overrides. */
export function forModel(model: ModelId, over: Partial<Settings> = {}) {
  return inputsFromSettings(A, { ...withModel(A, settings(), model), ...over });
}
export const ds200 = curveFor(A, 'gb200', 'dsv4pro');
export const ds300 = curveFor(A, 'gb300', 'dsv4pro');
