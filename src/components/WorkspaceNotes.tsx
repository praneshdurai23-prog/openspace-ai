import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  Eye,
  Edit3,
} from 'lucide-react';

export const WorkspaceNotes: React.FC = () => {
  const {
    activeConversation,
    updateConversationNotes,
    sendMessage,
    setCurrentMode,
  } = useChat();

  const initialNotes = activeConversation?.notes || '';
  const [notes, setNotes] = useState(initialNotes);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Keep synced with conversation changes
  useEffect(() => {
    setNotes(activeConversation?.notes || '');
  }, [activeConversation?.id]);

  // Debounced auto-save
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      updateConversationNotes(notes);
      setSaveStatus('saved');
    }, 600);
    return () => clearTimeout(timer);
  }, [notes, updateConversationNotes]);

  const handleCopyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy notes:', err);
    }
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeConversation?.title || 'openspace-notes'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAISummarizeToNotes = () => {
    setCurrentMode('writing');
    sendMessage(
      'Please produce a structured, high-level summary of our entire discussion so far, including Key Takeaways, Action Items, and Critical Insights in Markdown format for my notes.'
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60 dark:bg-[#080A12] p-4 sm:p-6 space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] flex items-center justify-center border border-[#7C3AED]/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F7FF]">
              Workspace Notes & Scratchpad
            </h2>
            <p className="text-xs text-slate-400 dark:text-[#9CA3AF]">
              Auto-saved with Markdown support • {saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Summarize with AI Button */}
          <button
            type="button"
            onClick={handleAISummarizeToNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-xs font-semibold shadow-xs hover:from-[#6D28D9] hover:to-[#7C3AED] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Summarize Chat into Notes</span>
            <span className="sm:hidden">AI Summary</span>
          </button>

          {/* Toggle Edit/Preview */}
          <div className="flex items-center bg-slate-100 dark:bg-[#171A2B] p-1 rounded-xl border border-slate-200 dark:border-[#1E2337]">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-[#1E2337] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-[#1E2337] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyNotes}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-colors"
            title="Copy notes"
          >
            {copied ? <Check className="w-4 h-4 text-[#06B6D4]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownloadNotes}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-colors"
            title="Download notes (.md)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Area */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] p-4 sm:p-6 overflow-y-auto shadow-xs scrollbar-thin">
        {viewMode === 'edit' ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="# Conversation Notes&#10;&#10;Use this scratchpad to organize thoughts, paste key snippets, or generate an AI executive summary..."
            className="w-full h-full min-h-[350px] resize-none bg-transparent text-sm sm:text-base text-slate-900 dark:text-[#F5F7FF] placeholder-slate-400 focus:outline-hidden leading-relaxed font-sans"
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
            {notes ? (
              <Markdown remarkPlugins={[remarkGfm]}>{notes}</Markdown>
            ) : (
              <p className="text-slate-400 italic">No notes written yet. Switch to Edit mode to begin.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
