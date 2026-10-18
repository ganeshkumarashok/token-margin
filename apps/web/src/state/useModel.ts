import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyPreset, breakevens, clampInteractivity, curveFor, demandShare, evaluate, inputsFromSettings,
  type ScenarioPresetId, type Settings,
} from '@gpu-roi/engine';
import { A } from '../data';
import { parseUrl, toSearch } from './url';

export function useModel() {
  const initial = useMemo(() => parseUrl(A, window.location.search), []);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [preset, setPreset] = useState<ScenarioPresetId | null>(initial.preset);

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const search = toSearch(A, settings, preset);
      const url = `${window.location.pathname}${search}${window.location.hash}`;
      window.history.replaceState(null, '', url);
    }, 150);
    return () => window.clearTimeout(timer.current);
  }, [settings, preset]);

  const derived = useMemo(() => {
    const points = curveFor(A, settings.rack);
    const inputs = inputsFromSettings(A, settings);
    const result = evaluate(inputs, points);
    const be = breakevens(inputs, points);
    const demand = demandShare(result.daily, {
      openrouterTokensPerDay: A.anchors.openrouterTokensPerDay.value,
      deepseekTokensPerDay: A.anchors.deepseekTokensPerDay.value,
    });
    return { points, inputs, result, be, demand };
  }, [settings]);

  const update = (patch: Partial<Settings>) => {
    setPreset(null);
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (patch.rack && patch.rack !== s.rack) next.interactivity = clampInteractivity(A, patch.rack, next.interactivity);
      return next;
    });
  };

  const choosePreset = (id: ScenarioPresetId) => {
    setSettings((s) => applyPreset(A, s, id));
    setPreset(id);
  };

  return { settings, preset, update, choosePreset, ...derived };
}

export type Model = ReturnType<typeof useModel>;
