import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ModeSelector } from './ModeSelector.tsx';
import { OpenSpaceSymbol } from './OpenSpaceLogo.tsx';
import {
  Menu,
  Plus,
  Settings,
  Sun,
  Moon,
  Monitor,
  Edit2,
  Check,
  X,
  Share2,
  Download,
  Brain,
  User,
  LogIn,
} from 'lucide-react';

interface HeaderProps {
  onOpenMemory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMemory }) => {
  const {
    activeConversation,
    toggleSidebar,
    newChat,
    setIsSettingsOpen,
    theme,
    setTheme,
    renameConversation,
    isStreaming,
    openShareModal,
    exportConversation,
    memories,
  } = useChat();

  const { user, isAuthenticated, openAuthModal, setIsProfileModalOpen } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const startEdit = () => {
    if (!activeConversation) return;
    setTitleInput(activeConversation.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeConversation && titleInput.trim()) {
      renameConversation(activeConversation.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const handleExport = (format: 'md' | 'txt' | 'json') => {
    if (activeConversation) {
      exportConversation(activeConversation.id, format);
      setShowExportMenu(false);
    }
  };

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-[#1E2337] bg-white/90 dark:bg-[#101321]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 z-20">
      {/* Left section: Hamburger, Brand Icon & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          id="menu-toggle-btn"
          type="button"
          onClick={toggleSidebar}
          className="p-2 -ml-1 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small OpenSpace Symbol in Header */}
        <div className="hidden sm:flex items-center">
          <OpenSpaceSymbol size={22} animated={isStreaming} />
        </div>

        {isEditingTitle ? (
          <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              autoFocus
              className="px-2.5 py-1 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-[#171A2B] text-slate-900 dark:text-[#F5F7FF] border border-[#7C3AED] focus:outline-hidden max-w-xs"
            />
            <button
              type="submit"
              className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingTitle(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div
            onClick={startEdit}
            className="group flex items-center gap-1.5 cursor-pointer max-w-[200px] sm:max-w-md truncate"
            title="Click to rename chat"
          >
            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#F5F7FF] truncate">
              {activeConversation?.title || 'OpenSpace Workspace'}
            </span>
            <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>

      {/* Center/Right section: Mode Selector & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ModeSelector />

        {/* Smart Memory Quick Access */}
        {onOpenMemory && (
          <button
            type="button"
            onClick={onOpenMemory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-[#171A2B] hover:bg-slate-200 dark:hover:bg-[#1E2337] text-xs rounded-xl border border-slate-200 dark:border-[#1E2337] font-medium text-slate-700 dark:text-[#9CA3AF] transition-colors cursor-pointer"
            title="Smart Memory Manager"
          >
            <Brain className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="hidden md:inline">Memory</span>
            {memories.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] font-bold">
                {memories.length}
              </span>
            )}
          </button>
        )}

        {/* Share Button (if conversation exists) */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <button
            type="button"
            onClick={() => openShareModal(activeConversation.id)}
            className="p-2 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
            title="Share Conversation"
          >
            <Share2 className="w-4 h-4 text-[#7C3AED]" />
          </button>
        )}

        {/* Export Button & Menu */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#101321] border border-slate-200 dark:border-[#1E2337] shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Export As
                </p>
                <button
                  type="button"
                  onClick={() => handleExport('md')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-[#171A2B] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-[#171A2B] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Plain Text (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-[#171A2B] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  JSON (.json)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Neural Core Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#171A2B] text-xs rounded-xl border border-slate-200 dark:border-[#1E2337] font-medium text-slate-700 dark:text-[#9CA3AF]">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? 'bg-[#06B6D4] animate-ping'
                : 'bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.7)]'
            }`}
          />
          <span className="text-slate-800 dark:text-[#F5F7FF]">Neural Core</span>
        </div>

        {/* Quick New Chat button */}
        <button
          id="header-new-chat-btn"
          type="button"
          onClick={() => newChat()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] text-xs font-medium text-slate-700 dark:text-[#F5F7FF] hover:bg-slate-50 dark:hover:bg-[#1E2337] transition-colors cursor-pointer shadow-xs group"
        >
          <Plus className="w-3.5 h-3.5 text-[#7C3AED] group-hover:text-[#06B6D4] transition-colors" />
          <span>New</span>
        </button>

        {/* Theme button */}
        <button
          id="header-theme-btn"
          type="button"
          onClick={cycleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors"
          title={`Theme: ${theme}`}
        >
          {theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Settings button */}
        <button
          id="header-settings-btn"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl text-slate-500 dark:text-[#9CA3AF] hover:text-slate-800 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account / Login Button */}
        {isAuthenticated && user ? (
          <button
            id="header-profile-btn"
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#171A2B] hover:bg-slate-200 dark:hover:bg-[#1E2337] border border-slate-200 dark:border-[#1E2337] transition-all cursor-pointer group"
            title="Account Profile & Settings"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
              {user.name.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            id="header-login-btn"
            type="button"
            onClick={() => openAuthModal('login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-xs hover:shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        )}
      </div>
    </header>
  );
};
