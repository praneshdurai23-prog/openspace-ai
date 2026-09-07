import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, FileAttachment } from '../types.ts';
import { AI_MODES } from '../config/modes.ts';
import { OpenSpaceSymbol } from './OpenSpaceLogo.tsx';
import { useChat } from '../context/ChatContext.tsx';
import {
  Copy,
  Check,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Play,
  Pencil,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
  isStreaming?: boolean;
  onRegenerate?: (messageId?: string) => void;
}

// Subcomponent for Code Block with Language Tag and Copy Button
const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="relative my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#1E2337] bg-[#0B0E19] shadow-lg font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#080A12] border-b border-[#1E2337] text-slate-400">
        <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-sans font-medium text-slate-400 hover:text-[#F5F7FF] hover:bg-[#171A2B] transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-[#06B6D4]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-3.5 overflow-x-auto text-slate-100 leading-relaxed scrollbar-thin">
        <pre>
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

export const MessageItem = React.memo<MessageItemProps>(({
  message,
  isLastAssistant = false,
  isStreaming = false,
  onRegenerate,
}) => {
  const {
    regenerateResponse,
    continueGeneration,
    editUserMessage,
    setMessageFeedback,
    streamingGrounding,
  } = useChat();

  const [messageCopied, setMessageCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';
  const modeConfig = message.mode ? AI_MODES[message.mode] : undefined;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown syntax for cleaner speech
    const cleanText = message.content.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsEditing(false);
    await editUserMessage(message.id, editText);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAttachment = (att: FileAttachment) => {
    const isImage = att.mimeType.startsWith('image/');
    return (
      <div
        key={att.id}
        className="flex items-center gap-2 rounded-xl p-1.5 pr-3 border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] shadow-xs max-w-xs"
      >
        {isImage && (att.dataUrl || att.base64Data) ? (
          <img
            src={att.dataUrl || `data:${att.mimeType};base64,${att.base64Data}`}
            alt={att.name}
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-[#2A314D] shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] flex items-center justify-center shrink-0">
            {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] truncate">
            {att.name}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-[#9CA3AF]">
            {formatFileSize(att.size)}
          </p>
        </div>
      </div>
    );
  };

  // Sources to display
  const displaySources = message.groundingSources || (isStreaming ? streamingGrounding?.sources : []);
  const displayQueries = message.searchQueries || (isStreaming ? streamingGrounding?.queries : []);
  const hasWebSearch = message.webSearchUsed || (displaySources && displaySources.length > 0);

  return (
    <div
      id={`message-${message.id}`}
      className={`py-5 px-3 sm:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-slate-100/40 dark:bg-[#101321]/60 border-y border-slate-200/50 dark:border-[#1E2337]/70'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
            isUser
              ? 'bg-slate-700 dark:bg-[#171A2B] border border-transparent dark:border-[#1E2337] text-white'
              : 'bg-[#101321] border border-[#7C3AED]/40 shadow-sm shadow-[#7C3AED]/20'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-slate-200" />
          ) : (
            <OpenSpaceSymbol size={18} animated={isStreaming} />
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-[#F5F7FF]">
                {isUser ? 'You' : 'OpenSpace AI'}
              </span>
              {!isUser && modeConfig && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] border border-[#7C3AED]/30">
                  {modeConfig.name}
                </span>
              )}
              {hasWebSearch && !isUser && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-[#06B6D4] border border-[#06B6D4]/30">
                  <Globe className="w-3 h-3" /> Web Grounded
                </span>
              )}
              <span className="text-[10px] text-slate-400 dark:text-[#9CA3AF]">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Quick edit button for user messages */}
            {isUser && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setEditText(message.content);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
                title="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1.5">
              {message.attachments.map(renderAttachment)}
            </div>
          )}

          {/* Inline Edit Form for User Message */}
          {isEditing ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-[#7C3AED]/50 bg-white dark:bg-[#171A2B] text-slate-900 dark:text-[#F5F7FF] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-xs font-semibold shadow-xs hover:from-[#6D28D9] hover:to-[#7C3AED] cursor-pointer"
                >
                  Save & Resend
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1E2337] text-slate-600 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#171A2B] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Message Text / Markdown */
            message.content ? (
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed break-words text-slate-900 dark:text-[#F5F7FF]">
                <div className="markdown-body">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');
                        return !isInline ? (
                          <CodeBlock
                            language={match ? match[1] : ''}
                            value={String(children).replace(/\n$/, '')}
                          />
                        ) : (
                          <code
                            className="px-1.5 py-0.5 rounded-md bg-[#7C3AED]/10 dark:bg-[#171A2B] font-mono text-[13px] text-[#7C3AED] dark:text-[#06B6D4] border border-[#7C3AED]/20 font-semibold"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      table({ children }: any) {
                        return (
                          <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1E2337]">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      th({ children }: any) {
                        return (
                          <th className="border-b border-slate-200 dark:border-[#1E2337] bg-slate-100 dark:bg-[#171A2B] px-3 py-2 font-semibold text-slate-800 dark:text-[#F5F7FF]">
                            {children}
                          </th>
                        );
                      },
                      td({ children }: any) {
                        return (
                          <td className="border-b border-slate-100 dark:border-[#1E2337]/60 px-3 py-2 text-slate-700 dark:text-[#9CA3AF]">
                            {children}
                          </td>
                        );
                      },
                      a({ href, children }: any) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#06B6D4] hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            <span>{children}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 inline opacity-70" />
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
              </div>
            ) : (
              isStreaming && (
                <div className="flex items-center gap-2 py-1 text-[#06B6D4] text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-ping" />
                  <span>Synthesizing response...</span>
                </div>
              )
            )
          )}

          {/* Web Search Grounding Citations */}
          {displaySources && displaySources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2337] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-[#F5F7FF]">
                <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Web Sources & Citations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displaySources.map((source, sIdx) => {
                  let host = '';
                  try {
                    host = new URL(source.uri).hostname.replace('www.', '');
                  } catch {
                    host = source.uri;
                  }
                  return (
                    <a
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] hover:border-[#06B6D4]/60 hover:bg-slate-50 dark:hover:bg-[#1E2337] transition-all text-xs text-slate-800 dark:text-[#F5F7FF] shadow-xs group"
                      title={source.title}
                    >
                      <span className="w-4 h-4 rounded-full bg-cyan-500/15 text-[#06B6D4] flex items-center justify-center text-[10px] font-bold">
                        {sIdx + 1}
                      </span>
                      <span className="max-w-[180px] sm:max-w-[240px] truncate font-medium group-hover:text-[#06B6D4] transition-colors">
                        {source.title || host}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#06B6D4] shrink-0" />
                    </a>
                  );
                })}
              </div>
              {displayQueries && displayQueries.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#9CA3AF] pt-1">
                  <span>Searched:</span>
                  <div className="flex flex-wrap gap-1">
                    {displayQueries.map((q, qIdx) => (
                      <span
                        key={qIdx}
                        className="px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-[#171A2B] font-mono text-[10px]"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message banner */}
          {message.error && (
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs sm:text-sm my-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <p>{message.error}</p>
              </div>
              {onRegenerate && !isStreaming && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800/80 text-rose-900 dark:text-rose-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Action buttons on assistant message */}
          {!isUser && !isStreaming && (message.content || message.error) && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 text-xs">
              {/* Copy */}
              {message.content && (
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 dark:text-[#9CA3AF] hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {messageCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span className="text-[#06B6D4] font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}

              {/* Text to speech (Listen / Stop) */}
              {message.content && (
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    isSpeaking
                      ? 'text-[#06B6D4] bg-[#06B6D4]/10 font-semibold'
                      : 'text-slate-400 dark:text-[#9CA3AF] hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B]'
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud (Voice)'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}

              {/* Regenerate */}
              <button
                type="button"
                onClick={() => (onRegenerate ? onRegenerate(message.id) : regenerateResponse(message.id))}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 dark:text-[#9CA3AF] hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              {/* Continue */}
              {isLastAssistant && (
                <button
                  type="button"
                  onClick={() => continueGeneration()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 dark:text-[#9CA3AF] hover:text-[#7C3AED] dark:hover:text-[#06B6D4] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer font-medium"
                  title="Continue response seamlessly"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Continue</span>
                </button>
              )}

              {/* Like Feedback */}
              <button
                type="button"
                onClick={() =>
                  setMessageFeedback(message.id, message.feedback === 'like' ? null : 'like')
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  message.feedback === 'like'
                    ? 'text-emerald-500 bg-emerald-500/10 font-medium'
                    : 'text-slate-400 dark:text-[#9CA3AF] hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-[#171A2B]'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              {/* Dislike Feedback */}
              <button
                type="button"
                onClick={() =>
                  setMessageFeedback(message.id, message.feedback === 'dislike' ? null : 'dislike')
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  message.feedback === 'dislike'
                    ? 'text-rose-500 bg-rose-500/10 font-medium'
                    : 'text-slate-400 dark:text-[#9CA3AF] hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-[#171A2B]'
                }`}
                title="Bad response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
