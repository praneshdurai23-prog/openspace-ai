import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { FileAttachment } from '../types.ts';
import { AI_MODES } from '../config/modes.ts';
import { ModeIcon } from './ModeIcons.tsx';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileText,
  Mic,
  MicOff,
  Globe,
  Sparkles,
  BookOpen,
  Volume2,
} from 'lucide-react';

export const ChatInput: React.FC = () => {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    currentMode,
    pendingFiles,
    addPendingFiles,
    removePendingFile,
    settings,
    webSearchActive,
    toggleWebSearch,
    simpleExplanationMode,
    setSimpleExplanationMode,
    setIsPromptLibraryOpen,
    setIsVoiceModalOpen,
  } = useChat();

  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const modeConfig = AI_MODES[currentMode] || AI_MODES.normal;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInput((prev) => (prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim()));
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start voice recognition:', err);
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (settings.sendOnEnter && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      stopGeneration();
      return;
    }
    if (!input.trim() && pendingFiles.length === 0) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Convert File to base64 and create FileAttachment object in parallel
  const processFiles = async (fileList: FileList | File[]) => {
    setIsProcessingFile(true);
    const filesArray = Array.from(fileList);

    try {
      const tasks = filesArray.map(async (file) => {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File "${file.name}" exceeds maximum 10MB limit.`);
          return null;
        }

        try {
          const base64 = await readFileAsBase64(file);
          const isImage = file.type.startsWith('image/');
          return {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: isImage ? base64 : undefined,
            base64Data: base64,
            createdAt: Date.now(),
          } as FileAttachment;
        } catch (err) {
          console.error('Failed to read file:', file.name, err);
          return null;
        }
      });

      const results = await Promise.all(tasks);
      const validAttachments = results.filter((f): f is FileAttachment => f !== null);

      if (validAttachments.length > 0) {
        addPendingFiles(validAttachments);
      }
    } finally {
      setIsProcessingFile(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !isProcessingFile;

  return (
    <div
      className="p-3 sm:p-5 bg-gradient-to-t from-[#080A12] via-[#080A12]/95 to-transparent border-t border-transparent"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        {/* Floating Composer Container */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl border transition-all duration-200 bg-white dark:bg-[#101321] shadow-2xl backdrop-blur-md ${
            isDragging
              ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/30 bg-[#101321]/90 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
              : 'border-slate-200 dark:border-[#1E2337] focus-within:border-[#7C3AED]/70 focus-within:ring-2 focus-within:ring-[#7C3AED]/20 focus-within:shadow-[0_0_30px_rgba(124,58,237,0.18)]'
          }`}
        >
          {/* Pending files tray */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-slate-100 dark:border-[#1E2337] max-h-36 overflow-y-auto scrollbar-thin">
              {pendingFiles.map((file) => {
                const isImage = file.mimeType.startsWith('image/');
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded-xl pl-2 pr-2.5 py-1.5 bg-slate-100 dark:bg-[#171A2B] text-xs border border-slate-200 dark:border-[#262D47] text-slate-800 dark:text-[#F5F7FF] group shadow-xs"
                  >
                    {isImage && file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#7C3AED]/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="max-w-[140px] truncate">
                      <p className="font-semibold text-slate-800 dark:text-[#F5F7FF] truncate text-xs">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-[#9CA3AF]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingFile(file.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center text-[11px] font-medium text-slate-400 dark:text-[#9CA3AF] pl-1">
                {pendingFiles.length}/15 files
              </div>
            </div>
          )}

          {/* Voice Listening Active Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-4 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Listening to your voice... Speak now</span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-600 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Text input & Action Controls Area */}
          <div className="flex items-end gap-1.5 sm:gap-2 p-2.5 sm:p-3">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.csv"
              className="hidden"
            />

            <button
              id="attachment-btn"
              type="button"
              disabled={isStreaming || pendingFiles.length >= 15}
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 sm:p-2.5 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer ${
                pendingFiles.length >= 15 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={
                pendingFiles.length >= 15
                  ? 'Max 15 files reached'
                  : 'Attach images, documents (PDF, DOCX), data (CSV) or code (max 15)'
              }
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Web Search Toggle Button */}
            <button
              id="web-search-toggle-btn"
              type="button"
              onClick={toggleWebSearch}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                webSearchActive
                  ? 'bg-cyan-500/15 text-[#06B6D4] border border-[#06B6D4]/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-500 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B] border border-transparent'
              }`}
              title={webSearchActive ? 'Web Search is ON (Click to disable)' : 'Web Search is OFF (Click to enable)'}
            >
              <Globe className={`w-4 h-4 ${webSearchActive ? 'text-[#06B6D4] animate-pulse' : ''}`} />
              <span className="hidden md:inline text-xs font-semibold">
                {webSearchActive ? 'Search ON' : 'Search'}
              </span>
            </button>

            {/* Simple Explanation Toggle Button */}
            <button
              id="simple-explanation-toggle-btn"
              type="button"
              onClick={() => setSimpleExplanationMode(!simpleExplanationMode)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                simpleExplanationMode
                  ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-slate-500 dark:text-[#9CA3AF] hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-[#171A2B] border border-transparent'
              }`}
              title={
                simpleExplanationMode
                  ? 'Simple Explanation Mode is ON (Click to disable)'
                  : 'Simple Explanation Mode is OFF (Click to enable step-by-step beginner breakdown)'
              }
            >
              <Sparkles className={`w-4 h-4 ${simpleExplanationMode ? 'text-amber-400 animate-spin' : ''}`} />
              <span className="hidden lg:inline text-xs font-semibold">
                {simpleExplanationMode ? 'Simple ON' : 'Simple'}
              </span>
            </button>

            {/* Voice Mode Modal Launcher */}
            <button
              id="voice-mode-modal-btn"
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
              title="Open Voice Assistant Mode"
            >
              <Volume2 className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden xl:inline text-xs font-semibold">Voice</span>
            </button>

            {/* Prompt Library Button */}
            <button
              id="prompt-library-btn"
              type="button"
              onClick={() => setIsPromptLibraryOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
              title="Open Prompt Library"
            >
              <BookOpen className="w-4 h-4 text-[#06B6D4]" />
              <span className="hidden xl:inline text-xs font-semibold">Prompts</span>
            </button>

            {/* Dictation (Inline mic) Button */}
            <button
              id="voice-dictate-btn"
              type="button"
              onClick={toggleVoiceInput}
              disabled={isStreaming}
              className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-500 ring-1 ring-rose-500 animate-pulse'
                  : 'text-slate-500 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-100 dark:hover:bg-[#171A2B]'
              }`}
              title={isListening ? 'Stop recording voice' : 'Voice dictation'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              id="chat-input-textarea"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingFiles.length > 0
                  ? 'Add instructions for attached file(s)...'
                  : webSearchActive
                  ? 'Ask anything with live web search...'
                  : modeConfig.placeholder
              }
              className="flex-1 max-h-48 resize-none bg-transparent py-1.5 px-2 text-sm sm:text-base text-slate-900 dark:text-[#F5F7FF] placeholder-slate-400 dark:placeholder-[#9CA3AF]/60 focus:outline-hidden leading-relaxed"
            />

            {/* Send / Stop Button with Neural Core Aesthetic */}
            {isStreaming ? (
              <button
                id="stop-generation-btn"
                type="button"
                onClick={stopGeneration}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-[#171A2B] border border-[#06B6D4]/50 text-[#06B6D4] hover:bg-slate-800 dark:hover:bg-[#20253B] transition-transform active:scale-95 shadow-md shadow-[#06B6D4]/20 cursor-pointer group"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current animate-pulse" />
              </button>
            ) : (
              <button
                id="send-message-btn"
                type="button"
                disabled={!canSend}
                onClick={handleSubmit}
                className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl transition-all duration-150 ${
                  canSend
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/35 cursor-pointer active:scale-95 border border-[#A855F7]/40'
                    : 'bg-slate-100 dark:bg-[#171A2B] text-slate-400 dark:text-[#9CA3AF]/50 cursor-not-allowed border border-transparent dark:border-[#1E2337]'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
              </button>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-slate-400 dark:text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <ModeIcon mode={currentMode} size={12} className="text-[#06B6D4]" />
              <span className="text-slate-600 dark:text-[#F5F7FF]">{modeConfig.name} Mode</span>
            </div>
            {webSearchActive && (
              <>
                <span className="text-slate-300 dark:text-[#1E2337]">•</span>
                <span className="text-[#06B6D4] font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Search Active
                </span>
              </>
            )}
            <span className="text-slate-300 dark:text-[#1E2337]">•</span>
            <span className="hidden sm:inline text-slate-500 dark:text-[#9CA3AF]">
              Shift + Enter for new line
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-[#9CA3AF]">
            <span>OpenSpace Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
