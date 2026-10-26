import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// index.html carries the pre-rendered default view. A link with settings in its query renders a
// different first view, so it starts fresh instead of hydrating markup that will not match.
if (root.hasChildNodes() && window.location.search === '') hydrateRoot(root, app);
else {
  root.replaceChildren();
  createRoot(root).render(app);
}
