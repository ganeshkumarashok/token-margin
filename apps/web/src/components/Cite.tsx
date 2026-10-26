import { useState } from 'react';
import type { Settings } from '@token-margin/engine';
import { toSearch } from '../state/url';
import { A } from '../data';

import { SITE } from '../links';

const TITLE = 'What are the margins on inference?';
const AUTHOR = { family: 'Ashokavardhanan', given: 'Ganeshkumar' };
const year = A.version.slice(0, 4);
const asOf = new Date(`${A.version}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Cites the page with the reader's settings (only ones that differ from the defaults), so quoted figures can be reproduced. */
export function Cite({ settings }: { settings: Settings }) {
  const url = `${SITE}${toSearch(A, settings)}`;
  const [copied, setCopied] = useState(false);
  const text = `${AUTHOR.family}, ${AUTHOR.given[0]}. (${year}). ${TITLE} Token margin, data as of ${asOf}. ${url}`;
  const bibtex = [
    `@misc{${AUTHOR.family.toLowerCase()}${year}margins,`,
    `  author = {${AUTHOR.family}, ${AUTHOR.given}},`,
    `  title = {${TITLE}},`,
    `  year = {${year}},`,
    `  howpublished = {\\url{${url}}},`,
    `  note = {Token margin, data as of ${A.version}}`,
    '}',
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: select the text so the reader can copy it by hand.
      const el = document.getElementById('cite-text');
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  };

  return (
    <div className="cite" data-testid="cite">
      <p>
        <span className="cite-label">Cite</span> <span id="cite-text">{text}</span>{' '}
        <button type="button" className="cite-copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </p>
      <details>
        <summary>BibTeX</summary>
        <pre>{bibtex}</pre>
      </details>
    </div>
  );
}
