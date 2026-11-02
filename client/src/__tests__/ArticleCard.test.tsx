import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import type { Article } from '../api/types';

const baseArticle: Article = {
  id: 'test-1',
  url: 'https://example.com/article',
  outlet: 'Reuters',
  title: 'Test Article Headline',
  publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  sourceType: 'wire',
  snippet: 'A short snippet',
  outletCount: 4,
};

function renderCard(article: Article, onSparkle = vi.fn()) {
  return render(
    <MemoryRouter>
      <ArticleCard article={article} onSparkle={onSparkle} />
    </MemoryRouter>,
  );
}

describe('ArticleCard', () => {
  it('renders the article title', () => {
    renderCard(baseArticle);
    expect(screen.getByText('Test Article Headline')).toBeInTheDocument();
  });

  it('shows gradient fallback when imageUrl is absent', () => {
    const articleNoImage = { ...baseArticle, imageUrl: undefined };
    renderCard(articleNoImage);
    expect(screen.getByTestId('gradient-fallback')).toBeInTheDocument();
  });

  it('shows gradient fallback when image errors', async () => {
    const articleWithBadImage = {
      ...baseArticle,
      imageUrl: 'https://broken.example.com/image.jpg',
    };
    renderCard(articleWithBadImage);

    // Initially the img element is rendered
    const img = document.querySelector('img');
    expect(img).toBeTruthy();

    // Simulate image error
    fireEvent.error(img!);

    // After error, the gradient fallback should appear
    expect(screen.getByTestId('gradient-fallback')).toBeInTheDocument();
  });

  it('calls onSparkle with the article when sparkle button is clicked', () => {
    const onSparkle = vi.fn();
    renderCard(baseArticle, onSparkle);
    const sparkleBtn = screen.getByRole('button', {
      name: /open ai panel for/i,
    });
    fireEvent.click(sparkleBtn);
    expect(onSparkle).toHaveBeenCalledWith(baseArticle);
  });

  it('renders source-type badge with correct label', () => {
    renderCard({ ...baseArticle, sourceType: 'opinion' });
    expect(screen.getByText('Opinion')).toBeInTheDocument();
  });

  it('shows outlet count when provided', () => {
    renderCard(baseArticle);
    expect(screen.getByText('4 outlets')).toBeInTheDocument();
  });
});

