import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import * as api from '../services/api.ts';
import {
  FileEdit,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Wand2,
  Minimize2,
  Maximize2,
  Type,
  BookOpen,
  CheckCheck,
  Smile,
  Briefcase,
  Layers,
} from 'lucide-react';

export const CanvasView: React.FC = () => {
  const { canvasDocument, setCanvasDocument } = useChat();

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([canvasDocument.content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  // Document statistics
  const text = canvasDocument.content;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  const updateContentWithHistory = (newContent: string) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newContent);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setCanvasDocument((prev) => ({ ...prev, content: newContent }));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCanvasDocument((prev) => ({ ...prev, content: history[prevIdx] }));
    }
  };

  const handleAction = async (
    action: 'rewrite' | 'summarize' | 'expand' | 'simplify' | 'fix_grammar' | 'change_tone' | 'custom',
    toneOrInstruction?: string
  ) => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const apiAction =
        action === 'fix_grammar'
          ? ('improve_grammar' as const)
          : action === 'custom'
          ? ('generate_content' as const)
          : action;

      const resultText = await api.executeCanvasAction({
        action: apiAction,
        text,
        customPrompt: toneOrInstruction || customInstruction,
        tone: action === 'change_tone' ? toneOrInstruction : undefined,
      });

      if (resultText) {
        updateContentWithHistory(resultText);
        setShowPromptInput(false);
        setCustomInstruction('');
      }
    } catch (err) {
      console.error('Canvas AI action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(canvasDocument.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const blob = new Blob([canvasDocument.content], {
      type: format === 'md' ? 'text/markdown' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (canvasDocument.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanTitle}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-slate-50 dark:bg-[#080A12] overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-[#0B0E19] border-b border-slate-200 dark:border-[#1E2337] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] flex items-center justify-center">
            <FileEdit className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={canvasDocument.title}
            onChange={(e) =>
              setCanvasDocument((prev) => ({ ...prev, title: e.target.value }))
            }
            className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F5F7FF] bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#7C3AED] focus:outline-hidden px-1"
            placeholder="Document Title..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={historyIndex === 0}
            onClick={handleUndo}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171A2B] disabled:opacity-30 cursor-pointer"
            title="Undo last change"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E2337] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1E2337] overflow-hidden">
            <button
              type="button"
              onClick={() => handleDownload('md')}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171A2B] border-r border-slate-200 dark:border-[#1E2337] cursor-pointer"
              title="Download as Markdown"
            >
              .MD
            </button>
            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171A2B] cursor-pointer"
              title="Download as Plain Text"
            >
              .TXT
            </button>
          </div>
        </div>
      </div>

      {/* AI Actions Strip */}
      <div className="bg-slate-100 dark:bg-[#0E1220] border-b border-slate-200 dark:border-[#1E2337] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-[#06B6D4]" /> AI Transform:
        </span>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('rewrite')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Rewrite
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('simplify')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Simplify
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('expand')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Expand
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('summarize')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Summarize
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('fix_grammar')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Fix Grammar
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('change_tone', 'Professional & executive')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Tone: Professional
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleAction('change_tone', 'Engaging & friendly')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#161B2E] hover:bg-slate-200 dark:hover:bg-[#202742] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222A47] shrink-0 transition-colors cursor-pointer"
        >
          Tone: Engaging
        </button>

        <button
          type="button"
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#06B6D4] hover:bg-[#7C3AED]/30 border border-[#7C3AED]/40 shrink-0 transition-colors cursor-pointer"
        >
          Custom Instruction...
        </button>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[#06B6D4] font-semibold animate-pulse shrink-0 ml-auto">
            <Wand2 className="w-3.5 h-3.5 animate-spin" />
            <span>AI transforming...</span>
          </div>
        )}
      </div>

      {/* Custom Instruction Box */}
      {showPromptInput && (
        <div className="p-3 bg-white dark:bg-[#121629] border-b border-slate-200 dark:border-[#1E2337] flex items-center gap-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="Tell OpenSpace how to edit this text (e.g. Convert into bullet points with emojis, translate to Tamil)..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0E19] border border-slate-200 dark:border-[#20263F] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
          />
          <button
            type="button"
            disabled={!customInstruction.trim() || isLoading}
            onClick={() => handleAction('custom')}
            className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        <textarea
          value={canvasDocument.content}
          onChange={(e) => {
            const val = e.target.value;
            setCanvasDocument((prev) => ({ ...prev, content: val }));
          }}
          placeholder="Start typing your document or paste notes here..."
          className="flex-1 w-full p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] text-slate-900 dark:text-[#F5F7FF] text-sm sm:text-base leading-relaxed resize-none focus:outline-hidden focus:ring-1 focus:ring-[#7C3AED]/50 font-sans shadow-xs"
        />
      </div>

      {/* Document Stats Status Bar */}
      <div className="bg-white dark:bg-[#0B0E19] border-t border-slate-200 dark:border-[#1E2337] px-6 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span>~{readingTimeMinutes} min read</span>
        </div>
        <div>
          <span>OpenSpace Canvas Engine</span>
        </div>
      </div>
    </div>
  );
};
