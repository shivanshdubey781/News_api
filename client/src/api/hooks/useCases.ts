import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../client';

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.list,
    staleTime: 30_000,
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: () => casesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useAddSource(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<import('../types').SourceLogEntry, 'investigationId'>) =>
      casesApi.addSource(caseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['case', caseId] }),
  });
}
