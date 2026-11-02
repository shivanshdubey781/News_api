import React from 'react';
import type { Citation } from '../api/types';
import { formatDate } from '../lib/format';

interface SourceChipProps {
  citation: Citation;
  unsourced?: boolean;
}

export const SourceChip: React.FC<SourceChipProps> = ({ citation, unsourced }) => {
  if (unsourced) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono badge-unverified"
        aria-label="Unverified claim"
      >
        <span aria-hidden="true">⚠</span>
        Unverified
      </span>
    );
  }

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono
                 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]
                 hover:bg-[var(--color-border)] transition-colors no-underline"
      aria-label={`Source: ${citation.outlet}, published ${formatDate(citation.publishedAt)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] opacity-60" aria-hidden="true" />
      <span className="max-w-[120px] truncate">{citation.outlet}</span>
      <span className="opacity-60">{formatDate(citation.publishedAt).split(',')[0]}</span>
    </a>
  );
};
