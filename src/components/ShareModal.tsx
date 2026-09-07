import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Share2, Copy, Check, X, Globe, Shield, ExternalLink } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalData, closeShareModal } = useChat();
  const [copied, setCopied] = useState(false);

  if (!shareModalData || !shareModalData.isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareModalData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2337]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Share Conversation</h3>
              <p className="text-xs text-slate-400">Read-only snapshot link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeShareModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Preview */}
        <div className="my-5 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-[#1E2337]">
            <p className="text-xs text-slate-400 font-medium">Conversation Title</p>
            <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100 mt-0.5">
              {shareModalData.title || 'OpenSpace AI Conversation'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Shareable Public Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareModalData.shareUrl}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#15192E] border border-slate-200 dark:border-[#242A45] text-slate-800 dark:text-slate-200 font-mono focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security guarantee */}
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs flex items-start gap-2.5 mb-5">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Anyone with this link can view this conversation snapshot. API keys, personal memories, and private account settings are never shared.
          </p>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closeShareModal}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-[#1E2337] hover:bg-slate-300 dark:hover:bg-[#28304E] text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
