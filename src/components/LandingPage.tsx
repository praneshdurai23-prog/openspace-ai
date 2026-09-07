import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { OpenSpaceLogo } from './OpenSpaceLogo.tsx';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  GraduationCap,
  Code2,
  FileText,
  FileSearch,
  CheckCircle2,
  Globe,
  Mic,
  Palette,
  FolderKanban,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onContinueAsGuest?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onContinueAsGuest }) => {
  const { openAuthModal, loginWithGoogle } = useAuth();

  const handleGoogleQuickSignIn = () => {
    loginWithGoogle('praneshdurai23@gmail.com', 'Pranesh Durai');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#080A12] text-slate-900 dark:text-[#F5F7FF] flex flex-col selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#080A12]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenSpaceLogo variant="sidebar" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#06B6D4] rounded-full border border-[#7C3AED]/20">
              Created by Pranesh
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-login-btn"
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              id="landing-signup-btn"
              onClick={() => openAuthModal('signup')}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white rounded-xl shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-12 pb-16 max-w-5xl mx-auto text-center">
        {/* Privacy & Engine Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-6 shadow-xs animate-in fade-in duration-300">
          <ShieldCheck className="w-4 h-4 text-cyan-500" />
          <span>Complete User Privacy & Isolated Workspaces</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15] mb-6">
          Your AI. Your Space.{' '}
          <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
            Private to You.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Experience a unified workspace with specialized modes for studying, coding, writing, document editing, and multimodal data analysis — where every chat, note, and memory belongs exclusively to your account.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mb-8">
          <button
            id="hero-create-account-btn"
            onClick={() => openAuthModal('signup')}
            className="w-full sm:w-auto flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-google-btn"
            onClick={handleGoogleQuickSignIn}
            className="w-full sm:w-auto py-3 px-5 bg-white dark:bg-[#171A2B] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Sign-In</span>
          </button>
        </div>

        {onContinueAsGuest && (
          <div className="mb-8">
            <button
              id="continue-as-guest-btn"
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Or preview workspace without an account
            </button>
          </div>
        )}

        {/* Workspace Mode Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-4xl text-left mt-4 mb-16">
          <div className="p-4 bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Study Mode</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Active flashcards, revision quizzes, and topic drills.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2.5">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Coding Mode</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Syntax-aware code generation, debugging, and live playground.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-2.5">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Document Canvas</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Interactive document writing with instant AI transforms.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5">
              <FileSearch className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">File Analysis</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Upload PDFs, DOCX, CSVs, and code files up to 10MB.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2.5">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Smart Memory</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Context and preferences that stick across chats securely.
            </p>
          </div>
        </div>

        {/* Security & Multi-Tenant Callout */}
        <div className="w-full max-w-3xl p-6 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-violet-950/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Strict Multi-Tenant Separation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Passwords are cryptographically salted and hashed. User A can never inspect or access User B's chats, documents, or memory.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="shrink-0 px-4 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 OpenSpace AI. Created by Pranesh. All rights reserved.</p>
      </footer>
    </div>
  );
};
