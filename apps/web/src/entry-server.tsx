import { renderToString } from 'react-dom/server';
import { App } from './App';

/** The default view as HTML, written into index.html at build time so the page reads without JavaScript. */
export function render(): string {
  return renderToString(<App />);
}
