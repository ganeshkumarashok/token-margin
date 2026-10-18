export * from './types';
export * from './curve';
export * from './daily';
export * from './schedule';
export * from './breakevens';
export * from './sensitivity';
export * from './format';
export * from './inputs';

import { daily } from './daily';
import { schedule } from './schedule';
import type { CurvePoint, Inputs, Result } from './types';

export function evaluate(i: Inputs, points: readonly CurvePoint[]): Result {
  const d = daily(i, points);
  return { inputs: i, daily: d, schedule: schedule(i, d) };
}
