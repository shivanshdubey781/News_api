import React from 'react';
import type { Timeline } from '../api/types';
import { SourceChip } from './SourceChip';
import { formatDate } from '../lib/format';

interface TimelineListProps {
  timeline: Timeline;
}

export const TimelineList: React.FC<TimelineListProps> = ({ timeline }) => {
  return (
    <div className="mt-2" role="region" aria-label="Event timeline">
      <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">
        Timeline: <span className="font-mono text-xs text-[var(--color-text-secondary)]">{timeline.story}</span>
      </h3>

      <ol className="relative border-l border-[var(--color-border)] ml-2 space-y-4">
        {timeline.events.map((event, i) => (
          <li key={i} className="ml-4">
            <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg)]" aria-hidden="true" />
            <time className="text-xs font-mono text-[var(--color-text-secondary)]">
              {formatDate(event.date)}
            </time>
            <p className="text-sm text-[var(--color-text)] mt-0.5">{event.description}</p>
            {event.citations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {event.citations.map((c, j) => (
                  <SourceChip key={j} citation={c} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {timeline.gaps.length > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-[var(--color-badge-unverified)]/10 border border-[var(--color-badge-unverified)]/20">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">⚠ Gaps in coverage:</p>
          {timeline.gaps.map((g) => (
            <p key={g} className="text-xs text-[var(--color-text)]">• {g}</p>
          ))}
        </div>
      )}
    </div>
  );
};
