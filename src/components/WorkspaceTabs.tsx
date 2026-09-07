import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { WorkspaceTab } from '../types.ts';
import {
  MessageSquare,
  FileText,
  GraduationCap,
  BookOpen,
  Code2,
  FileEdit,
  FolderKanban,
  BarChart2,
} from 'lucide-react';

export const WorkspaceTabs: React.FC = () => {
  const {
    workspaceTab,
    setWorkspaceTab,
    activeConversation,
    projects,
  } = useChat();

  // Calculate badge counts
  const messagesCount = activeConversation?.messages?.length || 0;

  // Total files in conversation
  const filesCount =
    activeConversation?.messages?.reduce((acc, msg) => acc + (msg.attachments?.length || 0), 0) || 0;

  // Total study items
  const studyCount = activeConversation?.studyCards?.length || 0;

  // Code snippets count
  const codeCount =
    activeConversation?.messages?.reduce((acc, msg) => {
      if (msg.role !== 'assistant') return acc;
      const matches = msg.content.match(/```[\s\S]*?```/g);
      return acc + (matches ? matches.length : 0);
    }, 0) || 0;

  const tabs: { id: WorkspaceTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, count: messagesCount },
    { id: 'canvas', label: 'Canvas', icon: FileEdit },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
    { id: 'data', label: 'Data', icon: BarChart2 },
    { id: 'study', label: 'Study 2.0', icon: GraduationCap, count: studyCount },
    { id: 'code', label: 'Code Lab', icon: Code2, count: codeCount },
    { id: 'files', label: 'Files', icon: FileText, count: filesCount },
    { id: 'notes', label: 'Notes', icon: BookOpen },
  ];

  return (
    <div className="bg-white/80 dark:bg-[#0B0E19]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#1E2337] px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none z-10">
      <div className="flex items-center gap-1 sm:gap-2">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const isActive = workspaceTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setWorkspaceTab(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4] border border-[#7C3AED]/40 shadow-xs'
                  : 'text-slate-600 dark:text-[#9CA3AF] hover:text-slate-900 dark:hover:text-[#F5F7FF] hover:bg-slate-100 dark:hover:bg-[#171A2B] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED] dark:text-[#06B6D4]' : 'opacity-70'}`} />
              <span>{label}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#7C3AED]/30 text-[#7C3AED] dark:text-[#06B6D4]'
                      : 'bg-slate-200 dark:bg-[#1E2337] text-slate-600 dark:text-[#9CA3AF]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#9CA3AF]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
        <span>Unified Workspace</span>
      </div>
    </div>
  );
};
