import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { MessageItem } from './MessageItem.tsx';
import { AI_MODES } from '../config/modes.ts';
import { AIMode, ChatMessage } from '../types.ts';
import { OpenSpaceLogo } from './OpenSpaceLogo.tsx';
import { ModeIcon } from './ModeIcons.tsx';
import {
  ArrowDown,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const ChatArea: React.FC = () => {
  const {
    activeConversation,
    currentMode,
    setCurrentMode,
    sendMessage,
    isStreaming,
    streamingContent,
    streamingMessageId,
    error,
    clearError,
    regenerateResponse,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const userScrolledUpRef = useRef(false);

  const messages = activeConversation?.messages || [];
  const currentConfig = AI_MODES[currentMode] || AI_MODES.normal;

  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 100) {
      userScrolledUpRef.current = true;
      setShowScrollBottom(true);
    } else {
      userScrolledUpRef.current = false;
      setShowScrollBottom(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
  };

  // Auto-scroll when messages or streaming content changes (using high-performance RAF)
  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const rafId = requestAnimationFrame(() => {
      if (scrollRef.current && !userScrolledUpRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages.length, streamingContent]);

  // When switching conversations, jump to bottom
  useEffect(() => {
    userScrolledUpRef.current = false;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.id]);

  // Streaming assistant message mock for rendering
  const activeStreamingMessage: ChatMessage | null = useMemo(() => {
    if (!isStreaming || !streamingMessageId) return null;
    return {
      id: streamingMessageId,
      role: 'assistant',
      content: streamingContent,
      timestamp: Date.now(),
      mode: currentMode,
      isStreaming: true,
    };
  }, [isStreaming, streamingMessageId, streamingContent, currentMode]);

  // Find index of last assistant message
  const lastAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin relative flex flex-col bg-slate-50/50 dark:bg-[#080A12]"
    >
      {/* Error alert toast */}
      {error && (
        <div className="sticky top-2 z-30 max-w-2xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-900 shadow-lg text-rose-800 dark:text-rose-200 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="truncate">{error}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  regenerateResponse();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-200/80 dark:bg-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-medium text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={clearError}
                className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Welcome Screen */}
      {messages.length === 0 && !isStreaming ? (
        <div className="my-auto py-8 sm:py-12 px-4 sm:px-6 max-w-3xl mx-auto w-full text-center space-y-8 animate-in fade-in duration-300">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <OpenSpaceLogo variant="compact" size={54} animated={false} />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F5F7FF] tracking-tight">
              Welcome to OpenSpace AI
            </h1>
            <p className="text-sm font-semibold text-[#7C3AED] dark:text-[#06B6D4] tracking-wide">
              Your AI. Your Space.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-0.5">
              Created by Pranesh
            </p>
          </div>

          {/* Mode Selector Cards */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
              Choose workflow mode
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(Object.keys(AI_MODES) as AIMode[]).map((modeKey) => {
                const mode = AI_MODES[modeKey];
                const isSelected = currentMode === modeKey;

                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => setCurrentMode(modeKey)}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#7C3AED] bg-[#101321] text-[#F5F7FF] shadow-lg shadow-[#7C3AED]/15 ring-1 ring-[#7C3AED]/40'
                        : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321]/60 text-slate-700 dark:text-[#9CA3AF] hover:border-[#7C3AED]/40 hover:bg-slate-50 dark:hover:bg-[#171A2B]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                        isSelected
                          ? 'bg-[#7C3AED]/20 text-[#06B6D4] border border-[#7C3AED]/40'
                          : 'bg-slate-100 dark:bg-[#171A2B] text-slate-500 dark:text-[#9CA3AF]'
                      }`}
                    >
                      <ModeIcon mode={modeKey} size={18} active={isSelected} />
                    </div>
                    <span className="text-xs font-semibold">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggested Prompts for active mode */}
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
              Suggested prompts for {currentConfig.name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {currentConfig.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321]/70 hover:border-[#7C3AED]/50 hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-all text-xs sm:text-sm text-slate-700 dark:text-[#F5F7FF] shadow-xs group cursor-pointer"
                >
                  <p className="line-clamp-2 group-hover:text-[#06B6D4] transition-colors leading-relaxed">
                    "{prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Messages list */
        <div className="flex-1 py-4">
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isLastAssistant={index === lastAssistantIndex}
              onRegenerate={regenerateResponse}
            />
          ))}

          {/* Live streaming message */}
          {activeStreamingMessage && (
            <MessageItem
              key={activeStreamingMessage.id}
              message={activeStreamingMessage}
              isStreaming={true}
            />
          )}
        </div>
      )}

      {/* Floating Jump-to-Bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 right-6 sm:right-10 z-30 p-2.5 rounded-full bg-white dark:bg-[#171A2B] border border-slate-200 dark:border-[#1E2337] text-slate-700 dark:text-[#F5F7FF] shadow-xl hover:bg-slate-50 dark:hover:bg-[#20253B] transition-all active:scale-95 cursor-pointer animate-in fade-in zoom-in-95 hover:border-[#7C3AED]"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
