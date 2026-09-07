import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Play,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface ExtractedSnippet {
  id: string;
  language: string;
  code: string;
  messageId: string;
  timestamp: number;
}

export const WorkspaceCode: React.FC = () => {
  const {
    activeConversation,
    sendMessage,
    setCurrentMode,
  } = useChat();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Extract all code blocks from messages
  const snippets: ExtractedSnippet[] = useMemo(() => {
    if (!activeConversation) return [];
    const list: ExtractedSnippet[] = [];

    activeConversation.messages.forEach((msg) => {
      if (msg.role !== 'assistant') return;
      const regex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      let count = 0;
      while ((match = regex.exec(msg.content)) !== null) {
        count++;
        list.push({
          id: `${msg.id}_code_${count}`,
          language: match[1] || 'text',
          code: match[2].trim(),
          messageId: msg.id,
          timestamp: msg.timestamp,
        });
      }
    });

    return list;
  }, [activeConversation]);

  // Unique languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    snippets.forEach((s) => set.add(s.language.toLowerCase()));
    return Array.from(set);
  }, [snippets]);

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    if (selectedLanguage === 'all') return snippets;
    return snippets.filter((s) => s.language.toLowerCase() === selectedLanguage.toLowerCase());
  }, [snippets, selectedLanguage]);

  const activeSnippet = useMemo(() => {
    if (activeSnippetId) {
      return snippets.find((s) => s.id === activeSnippetId) || snippets[0] || null;
    }
    return snippets[0] || null;
  }, [snippets, activeSnippetId]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  };

  const handleDownload = (snippet: ExtractedSnippet) => {
    const ext = getExtension(snippet.language);
    const blob = new Blob([snippet.code], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snippet-${snippet.id}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getExtension = (lang: string) => {
    const map: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      bash: 'sh',
      sh: 'sh',
    };
    return map[lang.toLowerCase()] || 'txt';
  };

  const handleAskAIToRefactor = () => {
    if (!activeSnippet) return;
    setCurrentMode('coding');
    sendMessage(
      `Please review, refactor, and optimize the following ${activeSnippet.language} snippet with best practices and performance tips:\n\n\`\`\`${activeSnippet.language}\n${activeSnippet.code}\n\`\`\``
    );
  };

  const canPreview =
    activeSnippet &&
    (activeSnippet.language.toLowerCase() === 'html' ||
      activeSnippet.code.includes('<html') ||
      activeSnippet.code.includes('<!DOCTYPE'));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50/60 dark:bg-[#080A12]">
      {/* Code Snippets Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-[#1E2337] flex flex-col h-full bg-white dark:bg-[#0D101C]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1E2337] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#06B6D4]" />
              <span>Extracted Code ({snippets.length})</span>
            </h3>
          </div>

          {/* Language filter pills */}
          {languages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedLanguage('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                  selectedLanguage === 'all'
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-slate-100 dark:bg-[#171A2B] text-slate-600 dark:text-[#9CA3AF]'
                }`}
              >
                All
              </button>
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                    selectedLanguage === lang
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-slate-100 dark:bg-[#171A2B] text-slate-600 dark:text-[#9CA3AF]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Snippet items list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
                <Terminal className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                No code blocks generated in this chat yet.
              </p>
            </div>
          ) : (
            filteredSnippets.map((snippet) => {
              const isSelected = activeSnippet?.id === snippet.id;
              const lines = snippet.code.split('\n').length;
              return (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => {
                    setActiveSnippetId(snippet.id);
                    setShowLivePreview(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#F5F7FF] ring-1 ring-[#7C3AED]/40'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-[#1E2337] hover:bg-slate-50 dark:hover:bg-[#171A2B]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase text-[#7C3AED] dark:text-[#06B6D4]">
                        {snippet.language}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {lines} {lines === 1 ? 'line' : 'lines'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {snippet.code.slice(0, 50)}...
                    </p>
                  </div>
                  <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Code Editor & Viewer Panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        {activeSnippet ? (
          <>
            {/* Header with actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] font-mono text-xs font-bold uppercase">
                  {activeSnippet.language}
                </span>
                <span className="text-xs text-slate-400">
                  {activeSnippet.code.split('\n').length} lines
                </span>
              </div>

              <div className="flex items-center gap-2">
                {canPreview && (
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      showLivePreview
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#171A2B] text-slate-700 dark:text-white border border-slate-200 dark:border-[#1E2337]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{showLivePreview ? 'Show Code' : 'Live HTML Preview'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAskAIToRefactor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-xs font-semibold shadow-xs hover:from-[#6D28D9] hover:to-[#7C3AED] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refactor with AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(activeSnippet.id, activeSnippet.code)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-colors"
                  title="Copy code snippet"
                >
                  {copiedId === activeSnippet.id ? (
                    <Check className="w-4 h-4 text-[#06B6D4]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(activeSnippet)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-colors"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Body or Live HTML Preview */}
            <div className="flex-1 min-h-[400px] rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-[#0B0E19] overflow-hidden shadow-lg flex flex-col font-mono text-xs">
              {showLivePreview && canPreview ? (
                <div className="w-full h-full min-h-[400px] bg-white">
                  <iframe
                    title="Live Preview"
                    srcDoc={activeSnippet.code}
                    className="w-full h-full min-h-[400px] border-none"
                    sandbox="allow-scripts"
                  />
                </div>
              ) : (
                <div className="p-4 overflow-x-auto text-slate-100 leading-relaxed scrollbar-thin">
                  <pre className="flex">
                    <div className="select-none pr-4 text-slate-600 text-right min-w-[2.5rem]">
                      {activeSnippet.code.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <code className="flex-1">{activeSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="m-auto text-center py-16 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
              <Code2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F5F7FF]">
              No Code Extracted Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ask OpenSpace AI to write code in any language (Python, TypeScript, React, SQL), and every code block will automatically appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
