import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { newsApi } from '../client';
import type { NewsFilters } from '../types';

export function useNews(filters?: NewsFilters) {
  return useQuery({
    queryKey: ['news', filters],
    queryFn: () => newsApi.list(filters),
    staleTime: 60_000,
  });
}

export function useNewsInfinite(tab: string) {
  return useInfiniteQuery({
    queryKey: ['news-infinite', tab],
    queryFn: ({ pageParam: _pageParam = 1 }) => newsApi.list({ topic: tab === 'For You' ? undefined : tab }),
    initialPageParam: 1,
    getNextPageParam: (_lastPage, pages) => pages.length + 1,
  });
}
