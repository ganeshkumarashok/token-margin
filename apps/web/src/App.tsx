import { Answer } from './components/Answer';
import { Controls } from './components/Controls';
import { Details } from './components/Details';
import { useModel } from './state/useModel';

export function App() {
  const m = useModel();
  return (
    <main className="page">
      <header className="masthead">
        <h1>What are the margins on inference?</h1>
      </header>
      <Answer m={m} />
      <Controls m={m} />
      <Details m={m} />
    </main>
  );
}
