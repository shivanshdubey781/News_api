import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AiPanel } from '../components/AiPanel';
import type { AiMessage } from '../api/types';

// Mock the useAiAsk hook
vi.mock('../api/hooks/useAiAsk', () => ({
  useAiAsk: vi.fn(),
}));

import { useAiAsk } from '../api/hooks/useAiAsk';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPanel(props: {
  isOpen?: boolean;
  messages?: AiMessage[];
  isLoading?: boolean;
}) {
  const mockAsk = vi.fn();
  const mockStop = vi.fn();

  vi.mocked(useAiAsk).mockReturnValue({
    messages: props.messages ?? [],
    isLoading: props.isLoading ?? false,
    ask: mockAsk,
    stop: mockStop,
    clear: vi.fn(),
  });

  render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <AiPanel isOpen={props.isOpen ?? true} onClose={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { mockAsk, mockStop };
}

describe('AiPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the panel when open', () => {
    renderPanel({ isOpen: true });
    expect(screen.getByRole('dialog', { name: /AI Research Assistant/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderPanel({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows "Unverified" badge for a message with isUnsourced=true and no citations', () => {
    const unsourcedMsg: AiMessage = {
      id: 'msg-1',
      role: 'assistant',
      content: 'This claim has no sources.',
      isUnsourced: true,
      isStreaming: false,
    };
    renderPanel({ messages: [unsourcedMsg] });
    expect(screen.getByText(/unverified/i)).toBeInTheDocument();
  });

  it('shows "Not found in the fetched sources" when notFound=true', () => {
    const notFoundMsg: AiMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: '',
      notFound: true,
      isStreaming: false,
    };
    renderPanel({ messages: [notFoundMsg] });
    expect(screen.getByText(/not found in the fetched sources/i)).toBeInTheDocument();
  });

  it('shows source chips when citations are present', () => {
    const msgWithCitations: AiMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: 'The article discusses climate change.',
      isStreaming: false,
      citations: [
        {
          url: 'https://guardian.com/article',
          outlet: 'The Guardian',
          publishedAt: '2024-01-15',
          quoteSnippet: 'Climate change impact',
        },
      ],
    };
    renderPanel({ messages: [msgWithCitations] });
    expect(screen.getByText(/The Guardian/i)).toBeInTheDocument();
  });

  it('renders footer disclaimer on every non-streaming AI message', () => {
    const msg: AiMessage = {
      id: 'msg-4',
      role: 'assistant',
      content: 'Some answer.',
      isStreaming: false,
    };
    renderPanel({ messages: [msg] });
    expect(screen.getByText(/AI assists your research\. Verify before publishing/i)).toBeInTheDocument();
  });

  it('shows typing indicator when isStreaming=true', () => {
    const streamingMsg: AiMessage = {
      id: 'msg-5',
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    renderPanel({ messages: [streamingMsg] });
    expect(screen.getByLabelText(/AI is typing/i)).toBeInTheDocument();
  });

  it('shows Stop button when isLoading', () => {
    renderPanel({ isLoading: true });
    expect(screen.getByRole('button', { name: /stop ai response/i })).toBeInTheDocument();
  });

  it('shows quick action chips when no messages', () => {
    renderPanel({ messages: [] });
    expect(screen.getByText(/Summarize/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare outlets/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify a claim/i)).toBeInTheDocument();
  });

  it('calls ask() when quick action chip is clicked', () => {
    const { mockAsk } = renderPanel({ messages: [] });
    fireEvent.click(screen.getByText(/✦ Summarize/i));
    expect(mockAsk).toHaveBeenCalledOnce();
    expect(mockAsk).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'summarize' }),
    );
  });
});
