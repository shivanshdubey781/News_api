import React, { useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { AiPanel } from '../components/AiPanel';
import { ListSkeleton } from '../components/Skeleton';
import { useNews } from '../api/hooks/useNews';
import type { Article, NewsFilters } from '../api/types';

const SOURCE_TYPES = [
  { value: '', label: 'All types' },
  { value: 'wire', label: 'Wire' },
  { value: 'primary', label: 'Primary' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'state_media', label: 'State Media' },
];

const TOPICS = ['', 'Politics', 'Economy', 'Technology', 'Climate', 'India', 'World'];

export const Discover: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<NewsFilters>({});
  const [submitted, setSubmitted] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | undefined>();

  const searchFilters: NewsFilters = submitted ? { ...filters, query } : {};
  const { data: results, isLoading, error, refetch } = useNews(Object.keys(searchFilters).length > 0 ? searchFilters : undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleSparkle = (article: Article) => {
    setSelectedArticle(article);
    setAiOpen(true);
  };

  return (
    <main aria-label="Discover and search" className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 pt-4 pb-3">
        <h1 className="font-serif text-2xl text-[var(--color-text)] mb-3">Discover</h1>

        {/* Search form */}
        <form onSubmit={handleSearch} role="search">
          <div className="relative mb-3">
            <label htmlFor="search-input" className="sr-only">Search news</label>
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              id="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, outlets, events..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                         pl-10 pr-4 py-3 text-sm text-[var(--color-text)]
                         placeholder-[var(--color-text-secondary)] outline-none
                         focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 tabs-scroll">
            {/* Topic filter */}
            <div className="flex-shrink-0">
              <label htmlFor="topic-filter" className="sr-only">Topic</label>
              <select
                id="topic-filter"
                value={filters.topic || ''}
                onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value || undefined }))}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t || 'Topic'}</option>
                ))}
              </select>
            </div>

            {/* Source type filter */}
            <div className="flex-shrink-0">
              <label htmlFor="source-filter" className="sr-only">Source type</label>
              <select
                id="source-filter"
                value={filters.sourceType || ''}
                onChange={(e) => setFilters((f) => ({ ...f, sourceType: (e.target.value as NewsFilters['sourceType']) || undefined }))}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              >
                {SOURCE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div className="flex-shrink-0">
              <label htmlFor="date-from" className="sr-only">Date from</label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              />
            </div>

            {/* Date to */}
            <div className="flex-shrink-0">
              <label htmlFor="date-to" className="sr-only">Date to</label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                           px-3 py-2 text-sm text-[var(--color-text)] outline-none
                           focus:border-[var(--color-accent)] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                         text-sm font-medium touch-target"
            >
              Search
            </button>
          </div>
        </form>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto pb-24">
        {!submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="mb-4 opacity-30">
              <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="2"/>
              <path d="M44 44l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 28h12M28 22v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Search for stories, filter by outlet, topic, or date range.
            </p>
          </div>
        ) : isLoading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" role="alert">
            <p className="text-sm text-[var(--color-text)] mb-2">Search failed. Please try again.</p>
            <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-xs touch-target">
              Retry
            </button>
          </div>
        ) : results && results.length === 0 ? (
          <div className="flex flex-col items-center py-12 px-8 text-center">
            <p className="font-serif text-xl text-[var(--color-text)] mb-2">No results found</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Try different keywords or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-xs font-mono text-[var(--color-text-secondary)]">
              {results?.length} result{results?.length !== 1 ? 's' : ''}
            </p>
            {results?.map((article) => (
              <ArticleCard key={article.id} article={article} onSparkle={handleSparkle} />
            ))}
          </div>
        )}
      </div>

      <AiPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        article={selectedArticle}
      />
    </main>
  );
};
