import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCases, useCreateCase } from '../api/hooks/useCases';
import { ListSkeleton } from '../components/Skeleton';
import { formatDate } from '../lib/format';

const EmptyState = () => (
  <div className="flex flex-col items-center py-16 px-8 text-center">
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" className="mb-4 opacity-30">
      <rect x="12" y="20" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 20V14a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v6" stroke="currentColor" strokeWidth="2"/>
      <path d="M26 36h20M26 44h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <h2 className="font-serif text-xl text-[var(--color-text)] mb-2">No investigations yet</h2>
    <p className="text-sm text-[var(--color-text-secondary)]">
      Start your first investigation to track claims, sources, and timelines.
    </p>
  </div>
);

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const { data: cases, isLoading, error, refetch } = useCases();
  const createCase = useCreateCase();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const newCase = await createCase.mutateAsync({ title: title.trim(), topic: topic.trim() });
      setIsCreating(false);
      setTitle('');
      setTopic('');
      navigate(`/cases/${newCase.id}`);
    } catch { /* error handled by mutation */ }
  };

  return (
    <main aria-label="Investigation cases" className="flex flex-col h-full">
      <header className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-text)]">Cases</h1>
        <button
          onClick={() => setIsCreating(true)}
          aria-label="New investigation"
          className="px-3 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                     text-sm font-medium touch-target flex items-center gap-1"
        >
          <span aria-hidden="true">+</span> New
        </button>
      </header>

      {/* New case form */}
      {isCreating && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="font-serif text-lg mb-3">New Investigation</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label htmlFor="case-title" className="text-xs font-mono text-[var(--color-text-secondary)] block mb-1">
                Title *
              </label>
              <input
                id="case-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Electoral bond case..."
                required
                className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="case-topic" className="text-xs font-mono text-[var(--color-text-secondary)] block mb-1">
                Topic
              </label>
              <input
                id="case-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Politics, Economy..."
                className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--color-border)]
                           text-sm text-[var(--color-text-secondary)] touch-target"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || createCase.isPending}
                className="flex-1 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                           text-sm font-medium touch-target disabled:opacity-50"
              >
                {createCase.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <ListSkeleton count={2} />
        ) : error ? (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" role="alert">
            <p className="text-sm text-[var(--color-text)] mb-2">Failed to load cases.</p>
            <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-xs touch-target">
              Retry
            </button>
          </div>
        ) : !cases || cases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4 space-y-3">
            {cases.map((c) => (
              <motion.button
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left p-4 rounded-2xl bg-[var(--color-surface)]
                           border border-[var(--color-border)] shadow-[var(--shadow-card)]
                           hover:border-[var(--color-text-secondary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-serif text-base text-[var(--color-text)] flex-1">{c.title}</h2>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0 mt-1 text-[var(--color-text-secondary)]">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  {c.topic && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] font-mono">
                      {c.topic}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {formatDate(c.createdAt)}
                  </span>
                  <span className="ml-auto text-xs text-[var(--color-text-secondary)] font-mono">
                    {c.claims.length} claims · {c.sourceLog.length} sources
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
