import React, { useState, useRef, useCallback } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { TabBar } from '../components/TabBar';
import { AiPanel } from '../components/AiPanel';
import { ListSkeleton } from '../components/Skeleton';
import { useNews } from '../api/hooks/useNews';
import type { Article } from '../api/types';

const TABS = ['For You', 'Trending', 'World', 'India', 'Fact-checks'];

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center" role="status">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" className="mb-4 opacity-30">
      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2"/>
      <path d="M26 32h28M26 40h20M26 48h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="58" cy="54" r="10" fill="currentColor" opacity="0.15"/>
      <path d="M54 54h8M58 50v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <h2 className="font-serif text-xl text-[var(--color-text)] mb-2">No stories yet</h2>
    <p className="text-sm text-[var(--color-text-secondary)]">
      Pull down to refresh or check back soon for the latest news.
    </p>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="mx-4 mt-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" role="alert">
    <p className="text-sm text-[var(--color-text)] mb-3">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-sm font-medium touch-target"
    >
      Try again
    </button>
  </div>
);

export const News: React.FC = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | undefined>();

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);

  const filters = activeTab !== 'For You' ? { topic: activeTab } : undefined;
  const { data: articles, isLoading, error, refetch } = useNews(filters);

  const handleSparkle = useCallback((article: Article) => {
    setSelectedArticle(article);
    setAiOpen(true);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    pullStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - pullStartY.current;
    if (delta > 80) {
      setIsPulling(true);
      refetch().finally(() => setIsPulling(false));
    }
  };

  return (
    <main className="flex flex-col h-full" aria-label="News feed">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-text)]">
          News
        </h1>
        <button
          onClick={() => { setSelectedArticle(undefined); setAiOpen(true); }}
          className="px-3 py-1.5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                     text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm
                     hover:opacity-90 active:scale-95 transition-all"
          aria-label="Open AI Research Assistant"
        >
          <span className="text-sm text-amber-300">✦</span>
          <span>Ask AI</span>
        </button>
      </header>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="ptr-indicator">
          <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Refreshing...
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto pb-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <ErrorState
            message="Failed to load news. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : !articles || articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4 space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onSparkle={handleSparkle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Ask AI Button pinned inside mobile container */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 flex justify-end pointer-events-none z-20"
        style={{ bottom: 'calc(64px + var(--safe-bottom) + 16px)' }}
      >
        <button
          onClick={() => { setSelectedArticle(undefined); setAiOpen(true); }}
          aria-label="Open AI research panel"
          className="pointer-events-auto px-4 py-2.5 rounded-full
                     bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                     shadow-2xl flex items-center gap-2 border border-white/20
                     hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="text-base text-amber-300">✦</span>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider">Ask AI</span>
        </button>
      </div>

      <AiPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        article={selectedArticle}
      />
    </main>
  );
};
