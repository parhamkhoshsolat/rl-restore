// ============================================================================
// A collapsed "Why?" disclosure — teaching on pull, not push. Used to attach the
// science (e.g. regression-to-the-mean) to the exact moment the visual provokes
// the question, without lecturing.
// ============================================================================

import type { ReactNode } from 'react';
import './teach-note.css';

export function TeachNote({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="teach">
      <summary>{q}</summary>
      <div className="teach__body">{children}</div>
    </details>
  );
}
