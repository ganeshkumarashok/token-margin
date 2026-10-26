// Writes the pre-rendered default view into dist/index.html. Runs after the client and SSR builds.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { render } from './dist-ssr/entry-server.js';

const assumptions = JSON.parse(readFileSync(new URL('../../data/assumptions.json', import.meta.url), 'utf8'));
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'What are the margins on inference?',
  url: 'https://tokens.ganeshkumarashok.com/',
  description: 'The daily economics of one NVIDIA NVL72 rack serving an open-weights model: measured throughput, real OpenRouter traffic and prices, published rents and owning costs.',
  applicationCategory: 'BusinessApplication',
  isAccessibleForFree: true,
  author: { '@type': 'Person', name: 'Ganeshkumar Ashokavardhanan', url: 'https://ganeshkumarashok.com' },
  dateModified: assumptions.version,
  version: `data-${assumptions.version}`,
  sameAs: 'https://github.com/ganeshkumarashok/token-margin',
};

const file = new URL('./dist/index.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error('index.html has no empty #root to fill');
const withLd = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`);
writeFileSync(file, withLd.replace(marker, `<div id="root">${render()}</div>`));
rmSync(new URL('./dist-ssr', import.meta.url), { recursive: true, force: true });
