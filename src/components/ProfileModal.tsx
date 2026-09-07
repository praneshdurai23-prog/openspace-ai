import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiExportUserData } from '../services/api.ts';
import {
  X,
  User,
  Mail,
  Calendar,
  Lock,
  Download,
  Trash2,
  LogOut,
  Shield,
  MessageSquare,
  FileText,
  Brain,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    user,
    stats,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateProfile,
    changePassword,
    deleteAccount,
    logout,
  } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passNotice, setPassNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);

  if (!isProfileModalOpen || !user) return null;

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setIsUpdatingName(true);
    try {
      await updateProfile({ name: name.trim() });
      setIsEditingName(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassNotice(null);

    if (newPassword.length < 6) {
      setPassNotice({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassNotice({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassNotice({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassNotice({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await apiExportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openspace-data-${user.name.toLowerCase().replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const memberSinceFormatted = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      id="profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsProfileModalOpen(false);
      }}
    >
      <div
        id="profile-modal-card"
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#101321] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Banner */}
        <div className="relative h-28 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-700 p-6 flex items-end justify-between">
          <button
            id="profile-modal-close-btn"
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Bar */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-[#101321] bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-lg font-bold px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isUpdatingName}
                        className="px-2.5 py-1 text-xs font-semibold bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                      >
                        {isUpdatingName ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {user.name}
                      </h3>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                  <span className="mx-1.5">•</span>
                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {user.provider === 'google' ? 'Google Account' : 'Password Account'}
                  </span>
                </p>
              </div>
            </div>

            <button
              id="profile-logout-btn"
              onClick={logout}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Workspace Data Metrics */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Your Personal Workspace Stats</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MessageSquare className="w-4 h-4 text-cyan-500" />
                  <span className="text-[11px] font-medium">Chats</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.conversationCount ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <FolderKanban className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] font-medium">Projects</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.projectCount ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Brain className="w-4 h-4 text-violet-500" />
                  <span className="text-[11px] font-medium">Memories</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.memoryCount ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-medium">Files</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.fileCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details & Security Section */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {memberSinceFormatted}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-500" />
                  Privacy Mode
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Private Workspace Active
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Export All Workspace Data
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Download a full JSON backup of your private chats, notes, and memories
                  </p>
                </div>
                <button
                  id="export-user-data-btn"
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Change Password (if email+password user) */}
          {user.provider === 'password' && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-[#171A2B] border border-slate-200 dark:border-slate-800/80 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Security & Password</span>
              </h4>

              {passNotice && (
                <div
                  className={`mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    passNotice.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {passNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isChangingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isChangingPass ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Danger Zone: Delete Account */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </h5>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                  Permanently delete your account and all associated conversations, files, and memories. This cannot be undone.
                </p>
              </div>
              <button
                id="delete-account-open-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Delete Account
              </button>
            </div>

            {/* Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-150">
                <p className="text-xs font-semibold text-rose-900 dark:text-rose-200 mb-2">
                  Are you absolutely sure? All your data will be permanently wiped immediately.
                </p>
                {user.provider === 'password' && (
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enter your password to confirm
                    </label>
                    <input
                      id="delete-account-password-confirm"
                      type="password"
                      placeholder="Your current password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full sm:w-72 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
                {deleteError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-2 font-medium">
                    {deleteError}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    id="delete-account-confirm-btn"
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError(null);
                      setDeletePassword('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
