import type { AiAskPayload, AiMessage, Article, Case, NewsFilters } from './types';

const BASE = '/api';
const IS_MOCK = import.meta.env.VITE_USE_MOCKS === 'true';

// ===== Typed fetch wrapper =====
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Request failed');
    throw { message: text, status: res.status };
  }
  return res.json() as Promise<T>;
}

// ===== News API =====
export const newsApi = {
  list: (filters?: NewsFilters) => {
    const params = new URLSearchParams();
    if (filters?.query) params.set('q', filters.query);
    if (filters?.topic) params.set('topic', filters.topic);
    if (filters?.country) params.set('country', filters.country);
    if (filters?.outlet) params.set('outlet', filters.outlet);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.sourceType) params.set('sourceType', filters.sourceType);
    const qs = params.toString();
    return apiFetch<Article[]>(`/news${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => apiFetch<Article>(`/articles/${id}`),
};

// ===== Cases API =====
export const casesApi = {
  list: () => apiFetch<Case[]>('/cases'),
  get: (id: string) => apiFetch<Case>(`/cases/${id}`),
  create: (data: { title: string; topic: string }) =>
    apiFetch<Case>('/cases', { method: 'POST', body: JSON.stringify(data) }),
  addSource: (id: string, data: Omit<import('./types').SourceLogEntry, 'investigationId'>) =>
    apiFetch<void>(`/cases/${id}/sources`, { method: 'POST', body: JSON.stringify(data) }),
  exportCsv: (id: string) => `${BASE}/cases/${id}/sources.csv`,
};

// ===== Auth API =====
export const authApi = {
  me: () => apiFetch<import('./types').AuthUser>('/auth/me'),
  login: (email: string, password: string) =>
    apiFetch<import('./types').AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
};

// ===== SSE / AI streaming =====
// Mock stream helper
async function* mockStreamAsk(_payload: AiAskPayload): AsyncGenerator<string> {
  const { fixtures } = await import('../mocks/fixtures');
  const text = fixtures.streamedAnswer;
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 20));
  }
}

export async function* streamAsk(
  payload: AiAskPayload,
  signal?: AbortSignal,
): AsyncGenerator<AiMessage> {
  if (IS_MOCK) {
    let accumulated = '';
    for await (const token of mockStreamAsk(payload)) {
      if (signal?.aborted) return;
      accumulated += token;
      yield {
        id: 'mock-streaming',
        role: 'assistant',
        content: accumulated,
        isStreaming: true,
      };
    }
    // Final message with citations
    const { fixtures } = await import('../mocks/fixtures');
    yield {
      id: 'mock-final',
      role: 'assistant',
      content: accumulated,
      citations: fixtures.citations,
      isStreaming: false,
    };
    return;
  }

  if (signal?.aborted) return;

  let res: Response;
  try {
    res = await fetch(`${BASE}/ai/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (e: unknown) {
    // Swallow AbortError — the caller handles cancellation
    if ((e as { name?: string }).name === 'AbortError') return;
    throw e;
  }

  if (!res.ok) {
    throw { message: 'AI request failed', status: res.status };
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) { reader.cancel(); return; }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            accumulated += parsed.token;
            yield { id: 'streaming', role: 'assistant', content: accumulated, isStreaming: true };
          } else if (parsed.done) {
            yield {
              id: parsed.id || 'final',
              role: 'assistant',
              content: accumulated,
              citations: parsed.citations,
              comparison: parsed.comparison,
              timeline: parsed.timeline,
              verifyResult: parsed.verifyResult,
              isUnsourced: parsed.isUnsourced,
              notFound: parsed.notFound,
              isStreaming: false,
            };
          }
        } catch { /* skip malformed SSE */ }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
