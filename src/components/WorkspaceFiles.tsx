import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { FileAttachment } from '../types.ts';
import {
  FileText,
  Image as ImageIcon,
  Table,
  FileCode,
  UploadCloud,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  Check,
  Search,
} from 'lucide-react';

export const WorkspaceFiles: React.FC = () => {
  const {
    activeConversation,
    sendMessage,
    setCurrentMode,
    addPendingFiles,
  } = useChat();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Collect all files from conversation messages
  const allFiles: (FileAttachment & { messageId: string; role: string; timestamp: number })[] = useMemo(() => {
    if (!activeConversation) return [];
    const list: (FileAttachment & { messageId: string; role: string; timestamp: number })[] = [];
    activeConversation.messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          list.push({
            ...att,
            messageId: msg.id,
            role: msg.role,
            timestamp: msg.timestamp,
          });
        });
      }
    });
    return list;
  }, [activeConversation]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return allFiles;
    return allFiles.filter((f) =>
      f.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [allFiles, searchFilter]);

  // Selected file
  const activeFile = useMemo(() => {
    if (selectedFileId) {
      return allFiles.find((f) => f.id === selectedFileId) || allFiles[0] || null;
    }
    return allFiles[0] || null;
  }, [allFiles, selectedFileId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileCategoryIcon = (mimeType: string, name: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes('csv') || name.endsWith('.csv')) return <Table className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('pdf') || name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (name.match(/\.(js|ts|tsx|jsx|py|html|css|json)$/i)) return <FileCode className="w-5 h-5 text-cyan-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  const handleAskAIAboutFile = (promptTemplate: string) => {
    if (!activeFile) return;
    setCurrentMode('file_analysis');
    sendMessage(`${promptTemplate} for "${activeFile.name}"`);
  };

  const handleCopyExtracted = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    const newAttachments: FileAttachment[] = [];

    for (const file of fileList) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: file.type.startsWith('image/') ? base64 : undefined,
        base64Data: base64,
        createdAt: Date.now(),
      });
    }

    if (newAttachments.length > 0) {
      addPendingFiles(newAttachments);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50/60 dark:bg-[#080A12]">
      {/* File List Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-[#1E2337] flex flex-col h-full bg-white dark:bg-[#0D101C]">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1E2337] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7FF]">
              Workspace Files ({allFiles.length})
            </h3>
            <label className="p-1.5 rounded-lg text-slate-500 hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B] cursor-pointer transition-colors" title="Upload new files">
              <UploadCloud className="w-4 h-4" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.csv"
                className="hidden"
              />
            </label>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-800 dark:text-[#F5F7FF] focus:outline-hidden focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>
        </div>

        {/* Files items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                {searchFilter ? 'No matching files found.' : 'No files attached to this conversation yet.'}
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload a File</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.csv"
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#F5F7FF] ring-1 ring-[#7C3AED]/40'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-[#1E2337] hover:bg-slate-50 dark:hover:bg-[#171A2B]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#171A2B] border border-slate-200 dark:border-[#262D47] flex items-center justify-center shrink-0">
                    {getFileCategoryIcon(file.mimeType, file.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-[#9CA3AF]">
                      {formatFileSize(file.size)} • {new Date(file.createdAt || file.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* File Inspector Detail Panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
        {activeFile ? (
          <>
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#7C3AED]/15 flex items-center justify-center shrink-0 border border-[#7C3AED]/30">
                  {getFileCategoryIcon(activeFile.mimeType, activeFile.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5F7FF] truncate">
                    {activeFile.name}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-[#9CA3AF]">
                    {formatFileSize(activeFile.size)} • Type: {activeFile.mimeType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFile.dataUrl && (
                  <a
                    href={activeFile.dataUrl}
                    download={activeFile.name}
                    className="p-2 rounded-xl border border-slate-200 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-50 dark:hover:bg-[#171A2B] transition-colors"
                    title="Download original file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick AI Action Cards */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                AI Document Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAskAIAboutFile('Provide a comprehensive summary and key takeaways')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
                >
                  <Sparkles className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <span>Summarize Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAIAboutFile('Extract all important questions, answers, and study notes')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-[#06B6D4]/60 hover:bg-[#06B6D4]/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
                >
                  <ExternalLink className="w-4 h-4 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                  <span>Extract Q&A & Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAIAboutFile('Perform deep forensic analysis, structure evaluation, and data anomalies check')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] hover:border-purple-500/60 hover:bg-purple-500/5 text-left text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] transition-all cursor-pointer shadow-xs group"
                >
                  <Table className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Deep Data Inspection</span>
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0E111E] border-b border-slate-200 dark:border-[#1E2337] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-[#F5F7FF]">
                  Preview & Extracted Content
                </span>
                {activeFile.extractedText && (
                  <button
                    type="button"
                    onClick={() => handleCopyExtracted(activeFile.extractedText!)}
                    className="flex items-center gap-1 text-xs text-[#06B6D4] hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>

              <div className="p-4">
                {activeFile.mimeType.startsWith('image/') && (activeFile.dataUrl || activeFile.base64Data) ? (
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-[#080A12] rounded-xl">
                    <img
                      src={activeFile.dataUrl || `data:${activeFile.mimeType};base64,${activeFile.base64Data}`}
                      alt={activeFile.name}
                      className="max-h-96 rounded-lg object-contain shadow-lg"
                    />
                  </div>
                ) : activeFile.extractedText ? (
                  <div className="max-h-96 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-[#080A12] font-mono text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed scrollbar-thin">
                    {activeFile.extractedText}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-[#9CA3AF] space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-400" />
                    <p>
                      Binary payload stored securely. OpenSpace AI processes this document directly via server-side Gemini multimodal synthesis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="m-auto text-center py-16 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] dark:text-[#06B6D4]">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F5F7FF]">
              No Files in this Conversation
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Attach PDFs, Word documents, CSV spreadsheets, code files, or photos using the composer paperclip or drag & drop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
