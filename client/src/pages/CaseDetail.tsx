import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCase, useAddSource } from '../api/hooks/useCases';
import { AiPanel } from '../components/AiPanel';
import { Skeleton } from '../components/Skeleton';
import { casesApi } from '../api/client';
import { formatDate } from '../lib/format';

const STATUS_COLORS: Record<string, string> = {
  verified: 'badge-verified',
  disputed: 'badge-disputed',
  unverified: 'badge-unverified',
};

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'claims' | 'sources' | 'timeline'>('claims');
  const { data: investigation, isLoading, error } = useCase(id!);
  useAddSource(id!); // keep hook wired; used via casesApi.addSource in handlers

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" role="status" aria-label="Loading investigation">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <span className="sr-only">Loading case...</span>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="p-4 text-center" role="alert">
        <p className="text-[var(--color-text)] mb-4">Case not found.</p>
        <button onClick={() => navigate('/cases')} className="text-sm text-[var(--color-text-secondary)]">
          ← Back to cases
        </button>
      </div>
    );
  }

  const csvUrl = casesApi.exportCsv(id!);

  return (
    <main aria-label={`Investigation: ${investigation.title}`} className="pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-3">
        <button
          onClick={() => navigate('/cases')}
          className="text-xs font-mono text-[var(--color-text-secondary)] mb-2 flex items-center gap-1 touch-target"
          aria-label="Back to cases"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Cases
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[var(--color-text)]">{investigation.title}</h1>
            {investigation.topic && (
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{investigation.topic}</span>
            )}
          </div>
          <button
            onClick={() => setAiOpen(true)}
            aria-label="Open AI research panel"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)]
                       flex items-center justify-center text-base touch-target"
          >
            ✦
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] px-4 gap-4">
        {(['claims', 'sources', 'timeline'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            role="tab"
            aria-selected={activeSection === s}
            className={`pb-2 text-sm capitalize transition-colors touch-target
              ${activeSection === s
                ? 'text-[var(--color-text)] font-semibold border-b-2 border-[var(--color-text)]'
                : 'text-[var(--color-text-secondary)]'
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {/* Claims section */}
        {activeSection === 'claims' && (
          <div className="space-y-3" role="list" aria-label="Claims">
            {investigation.claims.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
                No claims tracked yet. Use the AI panel to verify claims.
              </p>
            ) : (
              investigation.claims.map((claim) => (
                <div
                  key={claim.id}
                  role="listitem"
                  className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
                >
                  <div className="flex items-start gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono flex-shrink-0 mt-0.5 ${STATUS_COLORS[claim.status]}`}>
                      {claim.status}
                    </span>
                    <p className="text-sm text-[var(--color-text)] flex-1">{claim.text}</p>
                  </div>
                  {claim.supportingArticleIds.length > 0 && (
                    <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-1 ml-0">
                      {claim.supportingArticleIds.length} supporting source{claim.supportingArticleIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Sources section */}
        {activeSection === 'sources' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                {investigation.sourceLog.length} source{investigation.sourceLog.length !== 1 ? 's' : ''}
              </p>
              <a
                href={csvUrl}
                download={`${investigation.title}-sources.csv`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-alt)]
                           border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)]
                           hover:bg-[var(--color-border)] transition-colors no-underline touch-target"
                aria-label="Export sources as CSV"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </a>
            </div>

            {investigation.sourceLog.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
                No sources logged yet. Save sources from AI answers or article details.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[var(--color-surface-alt)]">
                      {['Outlet', 'URL', 'Access Date', 'What it supports'].map((h) => (
                        <th key={h} scope="col" className="text-left p-2 font-mono text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investigation.sourceLog.map((entry, i) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-[var(--color-surface-alt)]/50'}>
                        <td className="p-2 font-medium border-b border-[var(--color-border)]/50">{entry.outlet}</td>
                        <td className="p-2 border-b border-[var(--color-border)]/50">
                          <a href={entry.url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-500 hover:underline max-w-[150px] block truncate">
                            {entry.url}
                          </a>
                        </td>
                        <td className="p-2 font-mono border-b border-[var(--color-border)]/50">{formatDate(entry.accessDate)}</td>
                        <td className="p-2 text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/50">{entry.whatItSupports}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Timeline section */}
        {activeSection === 'timeline' && (
          <div className="flex flex-col items-center py-12 text-center">
            <button
              onClick={() => setAiOpen(true)}
              className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-sm font-medium touch-target"
            >
              ✦ Generate timeline with AI
            </button>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              AI will build a timeline from pinned articles and sources.
            </p>
          </div>
        )}
      </div>

      <AiPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        caseId={id}
      />
    </main>
  );
};
