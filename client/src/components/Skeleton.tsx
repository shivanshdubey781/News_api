import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" role="presentation" />
);

export const ArticleCardSkeleton: React.FC = () => (
  <div className="rounded-3xl overflow-hidden" aria-label="Loading article" role="status">
    <div className="skeleton" style={{ paddingBottom: '56.25%', position: 'relative' }} />
    <div className="p-4 space-y-2 bg-[var(--color-surface)]">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4 p-4" role="status" aria-label="Loading content">
    {Array.from({ length: count }).map((_, i) => (
      <ArticleCardSkeleton key={i} />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);
