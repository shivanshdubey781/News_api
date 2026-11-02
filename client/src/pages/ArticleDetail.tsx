import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useArticle } from '../api/hooks/useArticle';
import { AiPanel } from '../components/AiPanel';
import { Skeleton } from '../components/Skeleton';
import { formatDateTime } from '../lib/format';
import { outletGradient } from '../lib/gradient';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Go back"
    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center
               text-white border border-white/20 touch-target"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  </button>
);

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { data: article, isLoading, error, refetch } = useArticle(id!);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" role="status" aria-label="Loading article">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <span className="sr-only">Loading article...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]" role="alert">
        <p className="text-[var(--color-text)] mb-4">Article not found or failed to load.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-sm touch-target"
        >
          Retry
        </button>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-[var(--color-text-secondary)]">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <main aria-label={`Article: ${article.title}`} className="pb-24">
      {/* Hero image */}
      <div className="relative" style={{ paddingBottom: '60%' }}>
        {!imgError && article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: outletGradient(article.outlet) }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 card-gradient" aria-hidden="true" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={() => navigate(-1)} />
        </div>

        {/* Sparkle button */}
        <button
          onClick={() => setAiOpen(true)}
          aria-label="Open AI research panel"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full
                     bg-white/20 backdrop-blur-md border border-white/20 text-white
                     hover:bg-white/30 active:scale-95 transition-all touch-target"
        >
          <span aria-hidden="true">✦</span>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-3">
        {/* Outlet + date */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-wide">
            {article.outlet}
          </span>
          <span className="text-[var(--color-border)]" aria-hidden="true">·</span>
          <time className="text-xs font-mono text-[var(--color-text-secondary)]" dateTime={article.publishedAt}>
            {formatDateTime(article.publishedAt)}
          </time>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-2xl leading-tight text-[var(--color-text)]">
          {article.title}
        </h1>

        {/* AI summary label */}
        <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1 flex items-center gap-1">
            <span aria-hidden="true">✦</span> AI summary
          </p>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">
            {article.snippet}
          </p>
        </div>

        {/* Read original button */}
        <motion.a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                     bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-sm font-medium
                     touch-target no-underline"
          aria-label={`Read full article on ${article.outlet} (opens in new tab)`}
        >
          Read on {article.outlet}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </motion.a>

        {/* Action row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: '📁 Save to case', action: () => setAiOpen(true) },
            { label: '⟺ Compare outlets', action: () => setAiOpen(true) },
            { label: '✓ Verify claims', action: () => setAiOpen(true) },
            { label: '⊙ Timeline', action: () => setAiOpen(true) },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl
                         bg-[var(--color-surface)] border border-[var(--color-border)]
                         text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]
                         transition-colors touch-target"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <AiPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        article={article}
      />
    </main>
  );
};
