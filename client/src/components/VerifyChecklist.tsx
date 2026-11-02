import React, { useState } from 'react';
import type { VerifyResult } from '../api/types';
import { SourceChip } from './SourceChip';

interface VerifyChecklistProps {
  result: VerifyResult;
}

export const VerifyChecklist: React.FC<VerifyChecklistProps> = ({ result }) => {
  const [checked, setChecked] = useState<boolean[]>(() => result.checklist.map(() => false));

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)));
  };

  const verdictClass =
    result.verdict === 'verified'
      ? 'badge-verified'
      : result.verdict === 'disputed'
      ? 'badge-disputed'
      : 'badge-unverified';

  return (
    <div className="mt-2" role="region" aria-label="Claim verification">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-[var(--color-text)] flex-1 line-clamp-2">
          Claim: {result.claim}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-mono flex-shrink-0 ${verdictClass}`}>
          {result.verdict}
        </span>
      </div>

      {result.factcheckHits.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">Fact-check results:</p>
          {result.factcheckHits.map((hit) => (
            <a
              key={hit.url}
              href={hit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-alt)]
                         hover:bg-[var(--color-border)] transition-colors no-underline mb-1"
            >
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{hit.rating}</span>
              <span className="text-xs text-[var(--color-text)] flex-1">{hit.title}</span>
              <span aria-hidden="true" className="text-[var(--color-text-secondary)] text-xs">↗</span>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">Verification checklist:</p>
      <ul className="space-y-2">
        {result.checklist.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <button
              role="checkbox"
              aria-checked={checked[i]}
              onClick={() => toggle(i)}
              className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center
                          transition-colors touch-target
                          ${checked[i]
                            ? 'border-[var(--color-verified)] bg-[var(--color-verified)]'
                            : 'border-[var(--color-border)]'
                          }`}
              aria-label={`${checked[i] ? 'Uncheck' : 'Check'}: ${item}`}
            >
              {checked[i] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className={`text-sm ${checked[i] ? 'line-through text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      {result.relatedSources.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">Related sources:</p>
          <div className="flex flex-wrap gap-1">
            {result.relatedSources.map((c, i) => (
              <SourceChip key={i} citation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
