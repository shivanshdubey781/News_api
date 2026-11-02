import type {
  AiAskPayload,
  AiMessage,
  Article,
  AuthUser,
  Case,
  NewsFilters,
  SourceLogEntry,
} from './types';
import { fixtures } from '../mocks/fixtures';

const BASE = '/api';

function isMock(): boolean {
  return import.meta.env.VITE_USE_MOCKS === 'true';
}

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
  list: async (filters?: NewsFilters): Promise<Article[]> => {
    // Return mock fixtures directly if in mock mode
    if (isMock()) {
      return getFilteredMockArticles(filters);
    }

    try {
      const params = new URLSearchParams();
      if (filters?.query) params.set('q', filters.query);
      if (filters?.topic) params.set('topic', filters.topic);
      if (filters?.country) params.set('country', filters.country);
      if (filters?.outlet) params.set('outlet', filters.outlet);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      if (filters?.sourceType) params.set('sourceType', filters.sourceType);
      const qs = params.toString();
      return await apiFetch<Article[]>(`/news${qs ? `?${qs}` : ''}`);
    } catch (_err) {
      // Fallback gracefully to fixtures if backend is not reachable
      return getFilteredMockArticles(filters);
    }
  },

  get: async (id: string): Promise<Article> => {
    if (isMock()) {
      return fixtures.articles.find((a) => a.id === id) || fixtures.articles[0];
    }
    try {
      return await apiFetch<Article>(`/articles/${id}`);
    } catch {
      return fixtures.articles.find((a) => a.id === id) || fixtures.articles[0];
    }
  },
};

function getFilteredMockArticles(filters?: NewsFilters): Article[] {
  let list = [...fixtures.articles];

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.snippet.toLowerCase().includes(q)
    );
  }

  if (filters?.topic && filters.topic !== 'For You') {
    const t = filters.topic.toLowerCase();
    if (t === 'india') {
      list = list.filter((a) =>
        ['ndtv', 'times of india', 'the hindu'].some((o) => a.outlet.toLowerCase().includes(o))
      );
    } else if (t === 'world') {
      list = list.filter((a) =>
        ['bbc', 'reuters', 'the guardian', 'al jazeera', 'afp', 'cnn', 'ap'].some((o) =>
          a.outlet.toLowerCase().includes(o)
        )
      );
    } else if (t === 'trending') {
      list = [...list].sort((a, b) => (b.outletCount || 0) - (a.outletCount || 0));
    } else if (t === 'fact-checks') {
      list = list.filter((a) => a.sourceType === 'primary' || a.outletCount! > 50);
    } else {
      list = list.filter(
        (a) => a.title.toLowerCase().includes(t) || a.snippet.toLowerCase().includes(t)
      );
    }
    // Guarantee non-empty results for demo tabs
    if (list.length === 0) {
      list = fixtures.articles.slice(0, 4);
    }
  }

  if (filters?.outlet) {
    list = list.filter((a) => a.outlet.toLowerCase() === filters.outlet!.toLowerCase());
  }

  if (filters?.sourceType) {
    list = list.filter((a) => a.sourceType === filters.sourceType);
  }

  return list;
}

// ===== Cases API =====
export const casesApi = {
  list: async (): Promise<Case[]> => {
    if (isMock()) return fixtures.cases;
    try {
      return await apiFetch<Case[]>('/cases');
    } catch {
      return fixtures.cases;
    }
  },

  get: async (id: string): Promise<Case> => {
    if (isMock()) {
      return fixtures.cases.find((c) => c.id === id) || fixtures.cases[0];
    }
    try {
      return await apiFetch<Case>(`/cases/${id}`);
    } catch {
      return fixtures.cases.find((c) => c.id === id) || fixtures.cases[0];
    }
  },

  create: async (data: { title: string; topic: string }): Promise<Case> => {
    if (isMock()) {
      const newCase: Case = {
        id: `case-${Date.now()}`,
        title: data.title,
        topic: data.topic,
        createdAt: new Date().toISOString(),
        ownerId: 'user-1',
        pinnedArticles: [fixtures.articles[0]],
        claims: [
          {
            id: `claim-${Date.now()}`,
            text: `Initial claim for ${data.title}`,
            status: 'unverified',
            supportingArticleIds: [],
          },
        ],
        sourceLog: [],
      };
      fixtures.cases.push(newCase);
      return newCase;
    }
    return apiFetch<Case>('/cases', { method: 'POST', body: JSON.stringify(data) });
  },

  addSource: async (id: string, data: Omit<SourceLogEntry, 'investigationId'>): Promise<void> => {
    if (isMock()) {
      const c = fixtures.cases.find((item) => item.id === id);
      if (c) {
        c.sourceLog.push({ ...data, investigationId: id });
      }
      return;
    }
    return apiFetch<void>(`/cases/${id}/sources`, { method: 'POST', body: JSON.stringify(data) });
  },

  exportCsv: (id: string): string => {
    if (isMock()) {
      const c = fixtures.cases.find((item) => item.id === id);
      const rows = [
        ['URL', 'Outlet', 'Access Date', 'What It Supports'],
        ...(c?.sourceLog || []).map((s) => [
          `"${s.url}"`,
          `"${s.outlet}"`,
          `"${s.accessDate}"`,
          `"${s.whatItSupports}"`,
        ]),
      ];
      const csvContent =
        'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map((e) => e.join(',')).join('\n'));
      return csvContent;
    }
    return `${BASE}/cases/${id}/sources.csv`;
  },
};

// ===== Auth API =====
export const authApi = {
  me: async (): Promise<AuthUser> => {
    if (isMock()) {
      return { id: 'user-1', email: 'student@diploma.edu', name: 'Priya Sharma (Student)' };
    }
    try {
      return await apiFetch<AuthUser>('/auth/me');
    } catch {
      return { id: 'user-1', email: 'student@diploma.edu', name: 'Priya Sharma (Student)' };
    }
  },

  login: async (email: string, _password: string): Promise<AuthUser> => {
    if (isMock()) {
      return { id: 'user-1', email, name: email.split('@')[0] };
    }
    return apiFetch<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: _password }),
    });
  },

  logout: async (): Promise<void> => {
    if (isMock()) return;
    return apiFetch<void>('/auth/logout', { method: 'POST' });
  },
};

// ===== SSE / AI streaming =====
async function* mockStreamAsk(_payload: AiAskPayload): AsyncGenerator<string> {
  const text = fixtures.streamedAnswer;
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 20));
  }
}

export async function* streamAsk(
  payload: AiAskPayload,
  signal?: AbortSignal
): AsyncGenerator<AiMessage> {
  if (isMock()) {
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
    // Final message with citations & specialized render
    yield {
      id: 'mock-final',
      role: 'assistant',
      content: accumulated,
      citations: fixtures.citations,
      comparison: payload.action === 'compare' ? fixtures.comparison : undefined,
      timeline: payload.action === 'timeline' ? fixtures.timeline : undefined,
      verifyResult: payload.action === 'verify' ? fixtures.verifyResult : undefined,
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
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

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
        } catch {
          /* skip malformed SSE */
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
