import { useId } from 'react';
import { sourceFor } from '../data';

/** Small "i" button; tooltip shows on hover and on keyboard focus / tap. */
export function Info({ sourceId, note }: { sourceId?: string; note?: string }) {
  const id = useId();
  const src = sourceFor(sourceId);
  if (!src && !note) return null;
  return (
    <span className="info">
      <button type="button" className="info-btn" aria-describedby={id} aria-label="Source">
        i
      </button>
      <span role="tooltip" id={id} className="info-tip">
        {note && <span className="info-note">{note}</span>}
        {src && (
          <span className="info-src">
            {src.kind === 'assumption' ? 'Assumption, no external source' : src.title}
            {src.kind !== 'assumption' && <> · {src.date}</>}
          </span>
        )}
      </span>
    </span>
  );
}
