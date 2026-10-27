import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
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

// Cookieless page-view counts (Vercel Web Analytics), served only by a Vercel deployment.
if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) inject();
