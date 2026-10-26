// Writes the pre-rendered default view into dist/index.html. Runs after the client and SSR builds.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { render } from './dist-ssr/entry-server.js';

const file = new URL('./dist/index.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error('index.html has no empty #root to fill');
writeFileSync(file, html.replace(marker, `<div id="root">${render()}</div>`));
rmSync(new URL('./dist-ssr', import.meta.url), { recursive: true, force: true });
