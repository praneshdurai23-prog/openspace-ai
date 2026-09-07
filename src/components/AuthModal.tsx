import React, { useState } from 'react';
import { useAuth, AuthModalMode } from '../context/AuthContext.tsx';
import { OpenSpaceLogo } from './OpenSpaceLogo.tsx';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    loginWithGoogle,
    forgotPassword,
    resetPassword,
    authError,
    setAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync internal mode if parent changes
  React.useEffect(() => {
    setMode(authModalMode);
    setSuccessNotice(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signup(email, password, name);
      } else if (mode === 'forgot_password') {
        const res = await forgotPassword(email);
        setSuccessNotice(`Reset code generated: ${res.resetToken}. Enter it below to set a new password.`);
        setResetCode(res.resetToken);
        setMode('reset_password');
      } else if (mode === 'reset_password') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await resetPassword(email, resetCode, password);
        setSuccessNotice('Password reset successfully! You can now log in.');
        setMode('login');
      }
    } catch (err: any) {
      // Error handled by AuthContext or thrown here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle('praneshdurai23@gmail.com', 'Pranesh Durai');
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] p-5 sm:p-8 my-auto"
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={closeAuthModal}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <OpenSpaceLogo variant="full" showTagline={false} size={42} />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
            {mode === 'login' && 'Welcome back to OpenSpace AI'}
            {mode === 'signup' && 'Create your OpenSpace AI Account'}
            {mode === 'forgot_password' && 'Reset your password'}
            {mode === 'reset_password' && 'Set new password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {mode === 'login' && 'Sign in to access your private chats, documents, and memory'}
            {mode === 'signup' && 'Get your own isolated workspace with custom AI modes and cloud storage'}
            {mode === 'forgot_password' && 'Enter your account email to receive your password reset token'}
            {mode === 'reset_password' && 'Enter the reset code and your new secure password'}
          </p>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {authError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Google Sign In (for login and signup) */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#171A2B] hover:bg-slate-50 dark:hover:bg-[#1E2337] text-slate-800 dark:text-slate-100 font-medium text-sm border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-center gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-60 cursor-pointer"
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
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-[#101321] px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Or with email
              </span>
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  placeholder="Pranesh Durai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {mode === 'reset_password' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="auth-reset-code-input"
                  type="text"
                  required
                  placeholder="e.g. 549102"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm tracking-widest font-mono bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {mode === 'reset_password' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setMode('forgot_password');
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 min-h-[44px] text-sm bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="auth-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 min-h-[44px] bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {mode === 'login' && <span>Log In</span>}
                {mode === 'signup' && <span>Create Account</span>}
                {mode === 'forgot_password' && <span>Send Reset Code</span>}
                {mode === 'reset_password' && <span>Update Password</span>}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switch Footers */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setMode('signup');
                }}
                className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setMode('login');
                }}
                className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}

          {(mode === 'forgot_password' || mode === 'reset_password') && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setMode('login');
                }}
                className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                Back to Log In
              </button>
            </p>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
          <span>Encrypted credentials & strictly isolated workspaces</span>
        </div>
      </div>
    </div>
  );
};
