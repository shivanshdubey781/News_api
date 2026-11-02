import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { AiMessage, Article, QuickAction } from '../api/types';
import { useAiAsk } from '../api/hooks/useAiAsk';
import { SourceChip } from './SourceChip';
import { CompareTable } from './CompareTable';
import { TimelineList } from './TimelineList';
import { VerifyChecklist } from './VerifyChecklist';

// Speech Recognition type shim (webkit-prefixed or standard)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface AiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  article?: Article;
  caseId?: string;
}

const QUICK_ACTIONS: { id: QuickAction; label: string; prompt: string }[] = [
  { id: 'summarize', label: '✦ Summarize', prompt: 'Summarize this article' },
  { id: 'compare', label: '⟺ Compare outlets', prompt: 'Compare how different outlets covered this story' },
  { id: 'verify', label: '✓ Verify a claim', prompt: 'Verify the main claims in this article' },
  { id: 'timeline', label: '⊙ Build timeline', prompt: 'Build a timeline of events for this story' },
  { id: 'angles', label: '◈ Suggest angles', prompt: 'Suggest angles and follow-up story ideas' },
  { id: 'interview', label: '⊹ Who to interview', prompt: 'Who should I interview to investigate this story further?' },
];

const MessageBubble: React.FC<{ msg: AiMessage }> = ({ msg }) => {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.error) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{msg.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm leading-relaxed">
          {msg.content || (msg.isStreaming && <TypingIndicator />)}

          {/* Specialized renders */}
          {msg.comparison && <CompareTable comparison={msg.comparison} />}
          {msg.timeline && <TimelineList timeline={msg.timeline} />}
          {msg.verifyResult && <VerifyChecklist result={msg.verifyResult} />}

          {/* Not found notice */}
          {msg.notFound && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2 italic">
              Not found in the fetched sources.
            </p>
          )}
        </div>

        {/* Citations */}
        {msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.citations.map((c, i) => (
              <SourceChip key={i} citation={c} />
            ))}
            {msg.isUnsourced && <SourceChip citation={msg.citations[0]} unsourced />}
          </div>
        )}
        {msg.isUnsourced && (!msg.citations || msg.citations.length === 0) && (
          <div className="px-1">
            <SourceChip citation={{ url: '', outlet: '', publishedAt: '', quoteSnippet: '' }} unsourced />
          </div>
        )}

        {/* Footer disclaimer */}
        {!msg.isStreaming && (
          <p className="text-xs text-[var(--color-text-secondary)] px-1 italic">
            AI assists your research. Verify before publishing.
          </p>
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <span className="inline-flex gap-1 items-center" aria-label="AI is typing">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
        aria-hidden="true"
      />
    ))}
  </span>
);

export const AiPanel: React.FC<AiPanelProps> = ({ isOpen, onClose, article, caseId }) => {
  const [inputValue, setInputValue] = useState('');
  const [snapPoint, setSnapPoint] = useState<'peek' | 'full'>('peek');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();
  const { messages, isLoading, ask, stop } = useAiAsk();

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue('');
    setSnapPoint('full');
    ask({
      action: 'chat',
      prompt: trimmed,
      articleId: article?.id,
      caseId,
    });
  }, [inputValue, isLoading, ask, article, caseId]);

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    setSnapPoint('full');
    ask({
      action: action.id,
      prompt: action.prompt,
      articleId: article?.id,
      caseId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInputValue(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const peekHeight = '42vh';
  const fullHeight = '92vh';
  const currentHeight = snapPoint === 'peek' ? peekHeight : fullHeight;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-label="AI Research Assistant"
            aria-modal="true"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                       bg-[var(--color-surface)] rounded-t-[var(--radius-panel)]
                       flex flex-col overflow-hidden"
            style={{ boxShadow: 'var(--shadow-panel)' }}
            initial={{ y: '100%' }}
            animate={{ height: currentHeight, y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Drag handle */}
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
              onClick={() => setSnapPoint((s) => (s === 'peek' ? 'full' : 'peek'))}
              aria-label={`${snapPoint === 'peek' ? 'Expand' : 'Collapse'} AI panel`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSnapPoint((s) => s === 'peek' ? 'full' : 'peek')}
            >
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center px-4 pb-3 border-b border-[var(--color-border)]">
              <span className="text-lg font-serif flex-1">
                {article ? article.outlet : 'AI Research'}
              </span>
              {article && (
                <span className="text-xs font-mono text-[var(--color-text-secondary)] max-w-[200px] truncate mr-2">
                  {article.title}
                </span>
              )}
              <button
                onClick={onClose}
                aria-label="Close AI panel"
                className="w-8 h-8 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center
                           text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages / Quick actions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    What would you like to investigate?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-1.5 rounded-full text-sm bg-[var(--color-surface-alt)]
                                   border border-[var(--color-border)] text-[var(--color-text)]
                                   hover:bg-[var(--color-border)] transition-colors touch-target"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-2"
                 style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
              {speechSupported && (
                <button
                  onClick={isListening ? stopVoice : startVoice}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 touch-target
                              transition-colors border
                              ${isListening
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                              }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="18" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this story..."
                className="flex-1 bg-[var(--color-surface-alt)] rounded-full px-4 py-2 text-sm
                           text-[var(--color-text)] placeholder-[var(--color-text-secondary)]
                           border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]
                           transition-colors"
                aria-label="Ask AI a question"
                disabled={isLoading}
              />

              {isLoading ? (
                <button
                  onClick={stop}
                  aria-label="Stop AI response"
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                             bg-red-500 text-white touch-target"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                    <rect x="1" y="1" width="8" height="8" rx="1"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                             bg-[var(--color-accent)] text-[var(--color-accent-fg)] touch-target
                             disabled:opacity-40 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/>
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
