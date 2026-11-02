import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../api/types';
import { outletGradient } from '../lib/gradient';
import { relativeTime } from '../lib/format';

interface ArticleCardProps {
  article: Article;
  onSparkle?: (article: Article) => void;
}

const SOURCE_TYPE_LABELS: Record<Article['sourceType'], string> = {
  wire: 'Wire',
  primary: 'Primary',
  opinion: 'Opinion',
  state_media: 'State Media',
  aggregator: 'Aggregator',
  unknown: 'Unknown',
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSparkle }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleCardClick = () => {
    navigate(`/article/${article.id}`);
  };

  const handleSparkle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSparkle?.(article);
  };

  return (
    <motion.article
      role="article"
      aria-label={article.title}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer shadow-[var(--shadow-card)] bg-[var(--color-surface)]"
      style={{ minHeight: 280 }}
      onClick={handleCardClick}
    >
      {/* Image or gradient fallback */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
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
            className="absolute inset-0 w-full h-full"
            style={{ background: outletGradient(article.outlet) }}
            aria-hidden="true"
            data-testid="gradient-fallback"
          />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 card-gradient" aria-hidden="true" />

        {/* Sparkle / Ask AI button */}
        <button
          onClick={handleSparkle}
          aria-label={`Open AI panel for: ${article.title}`}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5
                     bg-black/55 backdrop-blur-md border border-white/30 text-white text-xs font-mono font-medium
                     hover:bg-black/75 active:scale-95 transition-all touch-target z-10 shadow-lg"
          style={{ minHeight: 36 }}
        >
          <span aria-hidden="true" className="text-sm leading-none text-amber-300">✦</span>
          <span>Ask AI</span>
        </button>

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <p className="text-white/70 text-xs font-mono uppercase tracking-wide mb-1 line-clamp-1">
            {article.outlet}
          </p>
          <h2 className="text-white font-serif text-xl leading-tight line-clamp-3 mb-2">
            {article.title}
          </h2>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-white/60 text-xs font-mono">
            {article.outletCount !== undefined && (
              <span>{article.outletCount} outlets</span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium badge-${article.sourceType}`}
            >
              {SOURCE_TYPE_LABELS[article.sourceType]}
            </span>
            <span className="ml-auto">{relativeTime(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
