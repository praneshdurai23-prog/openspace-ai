import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Conversation } from '../types.ts';
import { OpenSpaceLogo } from './OpenSpaceLogo.tsx';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  X,
  Settings,
  Sun,
  Moon,
  Monitor,
  Pin,
  PinOff,
  Share2,
  Brain,
  BookOpen,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';

interface GroupedConversations {
  pinned: Conversation[];
  today: Conversation[];
  yesterday: Conversation[];
  lastWeek: Conversation[];
  older: Conversation[];
}

interface SidebarProps {
  onOpenMemory?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenMemory }) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    newChat,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    setIsSettingsOpen,
    setIsPromptLibraryOpen,
    theme,
    setTheme,
    togglePinConversation,
    openShareModal,
    memories,
  } = useChat();

  const {
    user,
    isAuthenticated,
    openAuthModal,
    setIsProfileModalOpen,
    logout,
  } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Filter conversations by search query with guaranteed unique IDs
  const filteredConversations = useMemo(() => {
    const seen = new Set<string>();
    const valid = conversations.filter((c, idx) => {
      if (!c) return false;
      const id = c.id && c.id !== 'undefined' ? c.id : `conv_${c.createdAt || Date.now()}_${idx}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    if (!searchQuery.trim()) return valid;
    const q = searchQuery.toLowerCase().trim();
    return valid.filter((c) => {
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchMessage = (c.messages || []).some((m) => (m.content || '').toLowerCase().includes(q));
      return matchTitle || matchMessage;
    });
  }, [conversations, searchQuery]);

  // Group conversations by time
  const grouped = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfLastWeek = startOfToday - 86400000 * 7;

    const res: GroupedConversations = {
      pinned: [],
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    };

    for (const conv of filteredConversations) {
      if (conv.pinned) {
        res.pinned.push(conv);
        continue;
      }
      const time = conv.updatedAt || conv.createdAt;
      if (time >= startOfToday) {
        res.today.push(conv);
      } else if (time >= startOfYesterday) {
        res.yesterday.push(conv);
      } else if (time >= startOfLastWeek) {
        res.lastWeek.push(conv);
      } else {
        res.older.push(conv);
      }
    }

    return res;
  }, [filteredConversations]);

  const startEditing = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEditing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingId && editTitle.trim()) {
      await renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const renderConversationItem = (conv: Conversation, group: string, idx: number) => {
    const itemKey = `conv-${group}-${conv.id || idx}-${conv.createdAt || idx}`;
    const isActive = conv.id === activeConversationId;
    const isEditing = conv.id === editingId;

    if (isEditing) {
      return (
        <form
          key={itemKey}
          onSubmit={saveEditing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-indigo-500"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden px-1"
          />
          <button
            type="submit"
            className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={itemKey}
        id={`conv-item-${itemKey}`}
        onClick={() => selectConversation(conv.id)}
        className={`group relative flex items-center justify-between rounded-xl p-2.5 text-xs sm:text-sm transition-all cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-[#7C3AED]/20 via-[#7C3AED]/10 to-transparent text-slate-900 dark:text-[#F5F7FF] font-medium border-l-2 border-[#7C3AED] shadow-xs'
            : 'text-slate-600 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#171A2B]/70 hover:text-slate-900 dark:hover:text-[#F5F7FF]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-[#06B6D4]' : 'text-slate-400 dark:text-[#9CA3AF] group-hover:text-slate-600 dark:group-hover:text-[#F5F7FF]'
          }`} />
          <span className="truncate">{conv.title || 'New Chat'}</span>
        </div>

        {/* Action icons on hover or active */}
        <div
          className={`flex items-center gap-0.5 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* Pin / Unpin button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePinConversation(conv.id);
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              conv.pinned
                ? 'text-[#06B6D4] hover:bg-[#06B6D4]/15'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#1E2337]'
            }`}
            title={conv.pinned ? 'Unpin chat' : 'Pin chat to top'}
          >
            {conv.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openShareModal(conv.id);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#1E2337] cursor-pointer"
            title="Share chat snapshot"
          >
            <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" />
          </button>

          {/* Rename button */}
          <button
            type="button"
            onClick={(e) => startEditing(conv, e)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#1E2337] cursor-pointer"
            title="Rename"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => handleDelete(conv.id, e)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header: Logo & New Chat */}
        <div className="p-4 space-y-3.5 border-b border-slate-100 dark:border-[#1E2337]">
          <div className="flex items-center justify-between">
            <OpenSpaceLogo variant="sidebar" animated={false} />

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B]"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            id="new-chat-btn"
            type="button"
            onClick={() => newChat()}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] hover:bg-slate-100 dark:hover:bg-[#1F243A] text-slate-800 dark:text-[#F5F7FF] font-medium px-3.5 py-2.5 text-xs sm:text-sm shadow-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#7C3AED] group-hover:text-[#06B6D4] transition-colors" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-[#101321] text-slate-600 dark:text-[#9CA3AF] font-mono border border-transparent dark:border-[#1E2337]">
              Ctrl+N
            </span>
          </button>

          {/* Search Conversations */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="search-conversations-input"
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1E2337] bg-slate-50 dark:bg-[#171A2B] text-slate-800 dark:text-[#F5F7FF] placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F7FF]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Quick Shortcuts: Smart Memory & Prompt Library */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={onOpenMemory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#15192C] hover:bg-slate-100 dark:hover:bg-[#1E2442] border border-slate-200 dark:border-[#202742] text-[11px] font-semibold text-slate-700 dark:text-[#F5F7FF] transition-colors cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="truncate">Memory</span>
              {memories.length > 0 && (
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] font-bold">
                  {memories.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPromptLibraryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#15192C] hover:bg-slate-100 dark:hover:bg-[#1E2442] border border-slate-200 dark:border-[#202742] text-[11px] font-semibold text-slate-700 dark:text-[#F5F7FF] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span className="truncate">Prompts</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 select-none scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs text-slate-400 dark:text-zinc-400">No conversations yet.</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1">
                Click New Chat to begin.
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs text-slate-400 dark:text-zinc-400">No matching chats found.</p>
            </div>
          ) : (
            <>
              {/* Pinned Conversations */}
              {grouped.pinned.length > 0 && (
                <div>
                  <h3 className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[#06B6D4] flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </h3>
                  <div className="space-y-0.5">
                    {grouped.pinned.map((conv, idx) => renderConversationItem(conv, 'pinned', idx))}
                  </div>
                </div>
              )}

              {grouped.today.length > 0 && (
                <div>
                  <h3 className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400">
                    Today
                  </h3>
                  <div className="space-y-0.5">
                    {grouped.today.map((conv, idx) => renderConversationItem(conv, 'today', idx))}
                  </div>
                </div>
              )}

              {grouped.yesterday.length > 0 && (
                <div>
                  <h3 className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400">
                    Yesterday
                  </h3>
                  <div className="space-y-0.5">
                    {grouped.yesterday.map((conv, idx) => renderConversationItem(conv, 'yesterday', idx))}
                  </div>
                </div>
              )}

              {grouped.lastWeek.length > 0 && (
                <div>
                  <h3 className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400">
                    Previous 7 Days
                  </h3>
                  <div className="space-y-0.5">
                    {grouped.lastWeek.map((conv, idx) => renderConversationItem(conv, 'lastWeek', idx))}
                  </div>
                </div>
              )}

              {grouped.older.length > 0 && (
                <div>
                  <h3 className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400">
                    Older
                  </h3>
                  <div className="space-y-0.5">
                    {grouped.older.map((conv, idx) => renderConversationItem(conv, 'older', idx))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Clear all confirmation or trigger */}
        {conversations.length > 0 && (
          <div className="px-3 pt-1">
            {confirmClearAll ? (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                  Delete all chat history?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllConversations();
                      setConfirmClearAll(false);
                    }}
                    className="flex-1 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all conversations</span>
              </button>
            )}
          </div>
        )}

        {/* Footer Controls: Profile Card, Settings, Theme, Status */}
        <div className="border-t border-slate-100 dark:border-[#1E2337] bg-slate-50/50 dark:bg-[#101321]">
          {/* Creator Tagline */}
          <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-[#9CA3AF]">
            <span>Created by <strong className="text-[#7C3AED] dark:text-[#06B6D4] font-semibold">Pranesh</strong></span>
            <span className="opacity-70">Your AI. Your Space.</span>
          </div>

          <div className="p-2.5 pt-1.5 flex items-center justify-between gap-1.5">
            {isAuthenticated && user ? (
              <div
                id="sidebar-user-profile-card"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-[#171A2B] cursor-pointer text-slate-700 dark:text-[#F5F7FF] transition-colors flex-1 min-w-0"
                title="Open Account Profile & Stats"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-[#9CA3AF] truncate leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <div
                id="sidebar-guest-signin-prompt"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 cursor-pointer text-cyan-700 dark:text-cyan-300 transition-colors flex-1 min-w-0"
                title="Sign in to save private chats"
              >
                <LogIn className="w-4 h-4 shrink-0 text-cyan-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate leading-tight">
                    Sign In / Sign Up
                  </p>
                  <p className="text-[10px] text-cyan-600/80 dark:text-cyan-400/80 truncate leading-tight">
                    Save private chats
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-0.5 shrink-0">
              {isAuthenticated && (
                <button
                  id="sidebar-logout-quick-btn"
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              <button
                id="settings-trigger-btn"
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                id="theme-toggle-btn"
                type="button"
                onClick={cycleTheme}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F5F7FF] hover:bg-slate-200/60 dark:hover:bg-[#171A2B] transition-colors cursor-pointer"
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
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
