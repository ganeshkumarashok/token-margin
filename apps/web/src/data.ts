import raw from '../../../data/assumptions.json';
import type { Assumptions } from '@gpu-roi/engine';

export const A = raw as unknown as Assumptions;

export function sourceFor(id: string | undefined) {
  if (!id) return undefined;
  return A.sources[id];
}
