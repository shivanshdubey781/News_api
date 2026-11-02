import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';

export const handlers = [
  // News
  http.get('/api/news', () => {
    return HttpResponse.json(fixtures.articles);
  }),

  // Single article
  http.get('/api/articles/:id', ({ params }) => {
    const article = fixtures.articles.find((a) => a.id === params.id);
    if (!article) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(article);
  }),

  // AI ask (returns compare/timeline/verify based on action keyword)
  http.post('/api/ai/ask', async ({ request }) => {
    const body = await request.json() as { action: string; prompt: string };
    const encoder = new TextEncoder();
    let response: Response;

    const stream = new ReadableStream({
      async start(controller) {
        // Stream tokens
        const tokens = fixtures.streamedAnswer.split(' ');
        for (const token of tokens) {
          await new Promise((r) => setTimeout(r, 20));
          const data = JSON.stringify({ token: token + ' ' });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        // Done event with citations
        const doneData = JSON.stringify({
          done: true,
          id: `ai-${Date.now()}`,
          citations: fixtures.citations,
          comparison: body.action === 'compare' ? fixtures.comparison : undefined,
          timeline: body.action === 'timeline' ? fixtures.timeline : undefined,
          verifyResult: body.action === 'verify' ? fixtures.verifyResult : undefined,
        });
        controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
    return response;
  }),

  // Cases
  http.get('/api/cases', () => {
    return HttpResponse.json(fixtures.cases);
  }),

  http.get('/api/cases/:id', ({ params }) => {
    const c = fixtures.cases.find((c) => c.id === params.id);
    if (!c) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(c);
  }),

  http.post('/api/cases', async ({ request }) => {
    const body = await request.json() as { title: string; topic: string };
    const newCase = {
      id: `case-${Date.now()}`,
      title: body.title,
      topic: body.topic,
      createdAt: new Date().toISOString(),
      ownerId: 'user-1',
      pinnedArticles: [],
      claims: [],
      sourceLog: [],
    };
    fixtures.cases.push(newCase);
    return HttpResponse.json(newCase, { status: 201 });
  }),

  http.post('/api/cases/:id/sources', async ({ request, params }) => {
    const body = await request.json() as Record<string, string>;
    const c = fixtures.cases.find((c) => c.id === params.id);
    if (c) {
      c.sourceLog.push({ ...body, investigationId: params.id as string } as import('../api/types').SourceLogEntry);
    }
    return HttpResponse.json({ ok: true });
  }),

  // Auth
  http.get('/api/auth/me', () => {
    return HttpResponse.json({ id: 'user-1', email: 'journalist@example.com', name: 'Alex Reporter' });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email && body.password) {
      return HttpResponse.json({ id: 'user-1', email: body.email, name: 'Alex Reporter' });
    }
    return new HttpResponse('Invalid credentials', { status: 401 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ ok: true });
  }),
];
