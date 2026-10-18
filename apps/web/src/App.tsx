import { useState } from 'react';
import { AboutPanel } from './components/AboutPanel';
import { CashflowChart } from './components/CashflowChart';
import { CurveChart } from './components/CurveChart';
import { DemandLine } from './components/DemandLine';
import { Details } from './components/Details';
import { Footer } from './components/Footer';
import { KnobPanel } from './components/KnobPanel';
import { KpiStrip } from './components/KpiStrip';
import { PaybackHeatmap } from './components/PaybackHeatmap';
import { PresetBar } from './components/PresetBar';
import { PriceVsCostChart } from './components/PriceVsCostChart';
import { A } from './data';
import { useModel } from './state/useModel';

export function App() {
  const model = useModel();
  const [about, setAbout] = useState(false);
  const rack = A.racks[model.settings.rack];
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Token factory economics</h1>
          <p className="sub">
            {model.settings.racks > 1 ? `${model.settings.racks} ${rack.label} racks` : `One ${rack.label} rack`} serving {A.model.label}. Change the knobs, watch the payback.
          </p>
        </div>
        <div className="header-right">
          <button type="button" className="link-btn" onClick={() => setAbout(true)}>About</button>
          <span className="muted small header-note">Personal project · no employer affiliation · not financial advice</span>
        </div>
      </header>

      <KpiStrip model={model} />
      <DemandLine model={model} />
      <PresetBar model={model} />

      <main className="layout">
        <aside className="left">
          <KnobPanel model={model} />
        </aside>
        <div className="right">
          <div className="charts">
            <CashflowChart model={model} />
            <PaybackHeatmap model={model} />
            <PriceVsCostChart model={model} />
            <CurveChart model={model} />
          </div>
          <Details model={model} />
        </div>
      </main>

      <Footer />
      <AboutPanel open={about} onClose={() => setAbout(false)} />
    </div>
  );
}
