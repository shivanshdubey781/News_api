import { useState, useCallback, useRef } from 'react';
import { streamAsk } from '../client';
import type { AiAskPayload, AiMessage } from '../types';

export function useAiAsk() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (payload: AiAskPayload) => {
    // Abort any ongoing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Add user message
    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: payload.prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      for await (const msg of streamAsk(payload, controller.signal)) {
        if (controller.signal.aborted) break;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [...prev.slice(0, -1), msg];
          }
          return [...prev, msg];
        });
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      const errMsg: AiMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '',
        error: 'Failed to get AI response. Please try again.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isStreaming) {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      }
      return prev;
    });
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, ask, stop, clear };
}
