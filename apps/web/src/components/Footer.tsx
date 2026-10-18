import { A } from '../data';

export const DISCLAIMER =
  'Personal side project. Not affiliated with, sponsored by, or representing the views of any employer or any company named here. Not financial, investment, tax, or purchasing advice. Estimates from public sources under stated assumptions; they can be wrong by large factors. The knobs exist so you can disagree.';

export const SOURCE_URL = '';

export function Footer() {
  return (
    <footer className="footer" data-testid="disclaimer">
      <p>{DISCLAIMER}</p>
      <p className="muted">
        Data as of {A.version}
        {SOURCE_URL ? (
          <> · <a href={SOURCE_URL}>Source code</a></>
        ) : null}
      </p>
    </footer>
  );
}
