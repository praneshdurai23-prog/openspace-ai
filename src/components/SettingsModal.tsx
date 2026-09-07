import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { AI_MODES } from '../config/modes.ts';
import {
  AIMode,
  ThemeMode,
  LanguageOption,
  ResponseStyleOption,
  FontSizeOption,
  AIPersonality,
} from '../types.ts';
import { OpenSpaceSymbol } from './OpenSpaceLogo.tsx';
import {
  X,
  Sun,
  Moon,
  Monitor,
  FileText,
  Sliders,
  Sparkles,
  Globe2,
  Type,
  UserCheck,
  Brain,
  Smile,
  Compass,
} from 'lucide-react';

interface SettingsModalProps {
  onOpenMemory?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onOpenMemory }) => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    theme,
    setTheme,
    settings,
    updateUserSettings,
    clearCurrentChat,
    clearAllConversations,
    activeConversation,
    memories,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'general' | 'personalization' | 'files' | 'about'>('general');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1E2337]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#7C3AED] dark:text-[#06B6D4] shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F7FF]">
                Settings & Preferences
              </h2>
              <p className="text-xs text-slate-400 dark:text-[#9CA3AF]">
                Configure your OpenSpace AI workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#1E2337] px-6 gap-5 text-xs sm:text-sm font-medium overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#06B6D4] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9CA3AF] dark:hover:text-[#F5F7FF]'
            }`}
          >
            General & Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personalization')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'personalization'
                ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#06B6D4] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9CA3AF] dark:hover:text-[#F5F7FF]'
            }`}
          >
            Personalization
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#06B6D4] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9CA3AF] dark:hover:text-[#F5F7FF]'
            }`}
          >
            Files & Storage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#06B6D4] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-[#9CA3AF] dark:hover:text-[#F5F7FF]'
            }`}
          >
            About OpenSpace AI
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm scrollbar-thin text-slate-800 dark:text-[#F5F7FF]">
          {activeTab === 'general' && (
            <>
              {/* Theme Preference */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map(({ id, label, icon: Icon }) => {
                    const isSelected = theme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id as ThemeMode)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] ring-1 ring-[#7C3AED]/40'
                            : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF] hover:border-slate-300 dark:hover:border-[#2A314D]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default AI Mode */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                  Default Intelligence Workflow Mode
                </label>
                <select
                  value={settings.defaultMode}
                  onChange={(e) => updateUserSettings({ defaultMode: e.target.value as AIMode })}
                  className="w-full rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] px-3 py-2 text-sm text-slate-800 dark:text-[#F5F7FF] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/40"
                >
                  {(Object.keys(AI_MODES) as AIMode[]).map((mode) => (
                    <option key={mode} value={mode}>
                      {AI_MODES[mode].name} - {AI_MODES[mode].tagline}
                    </option>
                  ))}
                </select>
              </div>

              {/* Send on Enter toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E2337]">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                    Send with Enter
                  </p>
                  <p className="text-xs text-slate-400 dark:text-[#9CA3AF]">
                    Press Enter to dispatch messages, Shift + Enter for newline.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sendOnEnter}
                  onChange={(e) => updateUserSettings({ sendOnEnter: e.target.checked })}
                  className="w-5 h-5 rounded-md accent-[#7C3AED] cursor-pointer"
                />
              </div>

              {/* Chat Maintenance Actions */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#1E2337]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                  Workspace Maintenance
                </label>

                {/* Clear Current Chat */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50/50 dark:bg-[#171A2B]/60">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-[#F5F7FF]">
                      Clear current chat
                    </p>
                    <p className="text-xs text-slate-400 dark:text-[#9CA3AF]">
                      Removes all messages from the active thread.
                    </p>
                  </div>
                  {confirmClearChat ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          clearCurrentChat();
                          setConfirmClearChat(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearChat(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#1E2337] text-xs text-slate-700 dark:text-[#9CA3AF]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!activeConversation || activeConversation.messages.length === 0}
                      onClick={() => setConfirmClearChat(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1E2337] hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Delete all conversations */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-rose-200/70 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20">
                  <div>
                    <p className="font-medium text-rose-800 dark:text-rose-300">
                      Delete all chat history
                    </p>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/70">
                      Irreversibly deletes all stored conversations and attachments.
                    </p>
                  </div>
                  {confirmClearAll ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          clearAllConversations();
                          setConfirmClearAll(false);
                          setIsSettingsOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
                      >
                        Delete All
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#1E2337] text-xs text-slate-700 dark:text-[#9CA3AF]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Delete All
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'personalization' && (
            <div className="space-y-5">
              {/* AI Personality */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-[#7C3AED] dark:text-[#06B6D4]" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                    AI Personality
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'friendly', label: 'Friendly', desc: 'Warm & conversational' },
                    { id: 'professional', label: 'Professional', desc: 'Objective & formal' },
                    { id: 'teacher', label: 'Teacher', desc: 'Encouraging & stepwise' },
                    { id: 'concise', label: 'Concise', desc: 'Minimal words' },
                    { id: 'detailed', label: 'Detailed', desc: 'Deep thorough coverage' },
                    { id: 'beginner_friendly', label: 'Beginner', desc: 'No complex jargon' },
                  ].map(({ id, label, desc }) => {
                    const isSelected = (settings.personality || 'friendly') === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateUserSettings({ personality: id as AIPersonality })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] ring-1 ring-[#7C3AED]/40'
                            : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF] hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-xs">{label}</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Memory & Intelligent Defaults */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1E2337]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#06B6D4]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                      Smart Memory
                    </span>
                  </div>
                  {onOpenMemory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenMemory();
                      }}
                      className="px-3 py-1 bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#06B6D4] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Open Manager ({memories.length})
                    </button>
                  )}
                </div>

                {/* Default Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] cursor-pointer">
                    <span className="text-xs font-medium text-slate-700 dark:text-[#F5F7FF]">
                      Simple Explanations Default
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.defaultSimpleExplanations || false}
                      onChange={(e) =>
                        updateUserSettings({ defaultSimpleExplanations: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#7C3AED] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] cursor-pointer">
                    <span className="text-xs font-medium text-slate-700 dark:text-[#F5F7FF]">
                      Live Web Search Default
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.defaultWebSearch || false}
                      onChange={(e) =>
                        updateUserSettings({ defaultWebSearch: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#06B6D4] rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2337]">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#7C3AED] dark:text-[#06B6D4]" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                    Response Language
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'english', label: 'English', desc: 'Default international' },
                    { id: 'tamil', label: 'தமிழ் (Tamil)', desc: 'Pure Tamil responses' },
                    { id: 'tanglish', label: 'Tanglish', desc: 'Tamil + English blend' },
                  ].map(({ id, label, desc }) => {
                    const isSelected = settings.language === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateUserSettings({ language: id as LanguageOption })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] ring-1 ring-[#7C3AED]/40'
                            : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF] hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-xs sm:text-sm">{label}</p>
                        <p className="text-[11px] opacity-75 mt-0.5">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Response Length & Style */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2337]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#06B6D4]" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                    Response Length & Tone
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'balanced', label: 'Balanced', desc: 'Default optimal mix of depth & brevity' },
                    { id: 'concise', label: 'Concise & Direct', desc: 'Short, straight to the point' },
                    { id: 'detailed', label: 'Detailed & In-Depth', desc: 'Thorough explanations & breakdowns' },
                    { id: 'creative', label: 'Creative & Engaging', desc: 'Expressive and imaginative answers' },
                  ].map(({ id, label, desc }) => {
                    const isSelected = settings.responseStyle === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateUserSettings({ responseStyle: id as ResponseStyleOption })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] ring-1 ring-[#7C3AED]/40'
                            : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF] hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-xs sm:text-sm">{label}</p>
                        <p className="text-[11px] opacity-75 mt-0.5">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2337]">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#7C3AED] dark:text-[#06B6D4]" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                    Reading Font Size
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'sm', label: 'Compact', size: '13px' },
                    { id: 'base', label: 'Default', size: '15px' },
                    { id: 'lg', label: 'Large', size: '17px' },
                  ].map(({ id, label, size }) => {
                    const isSelected = settings.fontSize === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateUserSettings({ fontSize: id as FontSizeOption })}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] ring-1 ring-[#7C3AED]/40'
                            : 'border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF] hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-xs sm:text-sm">{label}</p>
                        <p className="text-[11px] opacity-75">{size}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50/60 dark:bg-[#171A2B]/60 space-y-2">
                <div className="flex items-center gap-2 text-[#7C3AED] dark:text-[#06B6D4] font-semibold">
                  <FileText className="w-5 h-5" />
                  <h3>File Upload Guidelines</h3>
                </div>
                <ul className="text-xs text-slate-600 dark:text-[#9CA3AF] space-y-1.5 list-disc pl-4 pt-1">
                  <li>Maximum 15 files per conversation.</li>
                  <li>Maximum 10 MB per individual file.</li>
                  <li>
                    Supported formats: Images (PNG, JPG, WebP, GIF), Documents (PDF, DOC, DOCX, TXT, CSV), and source code files (JS, TS, Python, JSON, HTML, CSS).
                  </li>
                  <li>Files are stored securely server-side and never exposed publicly.</li>
                  <li>In File Analysis mode, Gemini inspects image visual details and document contents directly.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2337] space-y-1">
                <p className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                  Data Privacy & Protection
                </p>
                <p className="text-xs text-slate-500 dark:text-[#9CA3AF] leading-relaxed">
                  Your uploaded attachments are processed solely for the active session and stored in your private workspace database. Gemini API communication occurs strictly over authenticated, server-side HTTPS endpoints.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED]/15 to-[#06B6D4]/10 border border-[#7C3AED]/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101321] border border-[#7C3AED]/40 shadow-md">
                  <OpenSpaceSymbol size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F7FF]">
                    OpenSpace AI
                  </h3>
                  <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#06B6D4]">
                    "Your AI. Your Space."
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-[#9CA3AF] mt-0.5">
                    Open Geometric Architecture • Personal Workspace
                  </p>
                </div>
              </div>

              {/* Creator Attribution Section */}
              <div className="p-4 rounded-2xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 dark:bg-[#7C3AED]/15 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-[#F5F7FF]">
                  <UserCheck className="w-4 h-4 text-[#06B6D4]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#7C3AED] dark:text-[#06B6D4]">
                    Creator & Founder
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F5F7FF]">
                  OpenSpace AI was created by Pranesh.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Designed and engineered by Pranesh as a private, next-generation AI intelligence workspace with unified chat, multimodal document synthesis, interactive study cards, coding tools, canvas drafting, and web grounding.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-[#9CA3AF]">
                <p className="font-semibold text-slate-900 dark:text-[#F5F7FF]">
                  Key Capabilities:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <li className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B]/60">
                    <span className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                      ⚡ Neural Reasoning:
                    </span>{' '}
                    Next-gen ultra-fast reasoning with real-time SSE streaming.
                  </li>
                  <li className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B]/60">
                    <span className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                      🌐 Real-Time Web Grounding:
                    </span>{' '}
                    Live web search integration with clickable source citations.
                  </li>
                  <li className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B]/60">
                    <span className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                      🎓 Study Mode 2.0:
                    </span>{' '}
                    Automated flashcard generation, quizzes, and difficulty calibration.
                  </li>
                  <li className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B]/60">
                    <span className="font-semibold text-slate-800 dark:text-[#F5F7FF]">
                      🔒 Zero Key Exposure:
                    </span>{' '}
                    100% server-side API proxying with strict rate limiting and sanitization.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#0E111D] flex justify-end">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
