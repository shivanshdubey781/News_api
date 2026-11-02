import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../client';

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => newsApi.get(id),
    enabled: !!id,
    staleTime: 120_000,
  });
}
