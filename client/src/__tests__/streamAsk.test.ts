import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamAsk } from '../api/client';

// Test in real (non-mock) mode
vi.stubEnv('VITE_USE_MOCKS', 'false');

vi.mock('../mocks/fixtures', () => ({
  fixtures: {
    streamedAnswer: 'Hello world test',
    citations: [],
  },
}));

describe('streamAsk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aborts cleanly when abort() called before fetch resolves', async () => {
    const controller = new AbortController();

    // Abort immediately so fetch sees an already-aborted signal
    controller.abort();

    // Fetch should reject with AbortError when signal is already aborted
    global.fetch = vi.fn().mockRejectedValue(
      Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' }),
    );

    let didThrow = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _msg of streamAsk({ action: 'chat', prompt: 'test' }, controller.signal)) {
        // should not yield anything
      }
    } catch (e: unknown) {
      // streamAsk should NOT propagate AbortError to the caller
      didThrow = true;
      console.error('Unexpected error:', e);
    }

    expect(didThrow).toBe(false);
  });

  it('aborts cleanly when signal is aborted mid-stream', async () => {
    const controller = new AbortController();
    const encoder = new TextEncoder();

    // Create a stream that blocks (never closes) to simulate a long-running stream
    const body = new ReadableStream<Uint8Array>({
      start(ctrl) {
        // Immediately enqueue a token then never close — abort should unblock the loop
        ctrl.enqueue(encoder.encode('data: {"token":"Hello"}\n\n'));
      },
    });

    global.fetch = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));

    // Abort the controller immediately after we start iterating
    const received: string[] = [];
    let threw = false;

    const gen = streamAsk({ action: 'chat', prompt: 'q' }, controller.signal);

    // Abort before reading anything
    controller.abort();

    try {
      for await (const msg of gen) {
        received.push(msg.content);
      }
    } catch {
      threw = true;
    }

    // Generator exits cleanly without throwing
    expect(threw).toBe(false);
  });

  it('yields streaming messages with isStreaming=true', async () => {
    const encoder = new TextEncoder();
    let ctrl: ReadableStreamDefaultController<Uint8Array>;

    const stream = new ReadableStream<Uint8Array>({
      start(c) { ctrl = c; },
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(stream, { status: 200 }),
    );

    const messages: string[] = [];

    setTimeout(() => {
      ctrl.enqueue(encoder.encode('data: {"token":"Breaking "}\n\n'));
      ctrl.enqueue(encoder.encode('data: {"token":"news"}\n\n'));
      ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
      ctrl.close();
    }, 5);

    for await (const msg of streamAsk({ action: 'chat', prompt: 'q' })) {
      if (msg.isStreaming) messages.push(msg.content);
      else break;
    }

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[messages.length - 1]).toContain('Breaking');
  });
});
