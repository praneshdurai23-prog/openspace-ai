import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { OpenSpaceLogo } from './OpenSpaceLogo.tsx';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  GraduationCap,
  Code2,
  FileSearch,
  ArrowRight,
  Check,
} from 'lucide-react';

export const NewUserWelcomeModal: React.FC = () => {
  const { user, isNewUserWelcomeOpen, setIsNewUserWelcomeOpen } = useAuth();

  if (!isNewUserWelcomeOpen || !user) return null;

  return (
    <div
      id="new-user-welcome-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="new-user-welcome-card"
        className="relative w-full max-w-lg bg-white dark:bg-[#101321] border border-cyan-500/30 dark:border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <OpenSpaceLogo variant="full" showTagline={false} size={48} />
            <div className="absolute -top-1 -right-1 p-1 bg-[#06B6D4] text-white rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          Welcome to OpenSpace AI, {user.name}!
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
          Your personal AI workspace is ready. Every conversation, uploaded file, note, and smart memory you create is 100% private to your account.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 text-left mb-6">
          <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Private & Isolated</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Only you can access your data and projects.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Smart Memory</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Remembers your workflow preferences across chats.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">5 Specialized Modes</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Study with quizzes, Code, Write & Canvas.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Multi-File Analysis</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload PDFs, DOCX, CSVs, and images safely.</p>
            </div>
          </div>
        </div>

        <button
          id="new-user-welcome-start-btn"
          type="button"
          onClick={() => setIsNewUserWelcomeOpen(false)}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Open My Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
