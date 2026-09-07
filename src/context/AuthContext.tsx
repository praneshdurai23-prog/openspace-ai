import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserStats } from '../types.ts';
import {
  apiGetMe,
  apiLogin,
  apiRegister,
  apiGoogleLogin,
  apiLogout,
  apiForgotPassword,
  apiResetPassword,
  apiUpdateProfile,
  apiChangePassword,
  apiDeleteAccount,
  getStoredAuthToken,
} from '../services/api.ts';

export type AuthModalMode = 'login' | 'signup' | 'forgot_password' | 'reset_password';

export interface AuthContextType {
  user: UserProfile | null;
  stats: UserStats | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  // Actions
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetToken: string; message: string }>;
  resetPassword: (email: string, token: string, newPass: string) => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Modals
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isNewUserWelcomeOpen: boolean;
  setIsNewUserWelcomeOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [token, setToken] = useState<string | null>(getStoredAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isNewUserWelcomeOpen, setIsNewUserWelcomeOpen] = useState<boolean>(false);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const existingToken = getStoredAuthToken();
    if (!existingToken) {
      setUser(null);
      setStats(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiGetMe();
      setUser(data.user);
      setStats(data.stats);
      setToken(existingToken);
    } catch {
      setUser(null);
      setStats(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const data = await apiLogin(email, pass);
      setUser(data.user);
      setToken(data.token);
      await refreshUser();
      closeAuthModal();
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const data = await apiRegister(email, pass, name);
      setUser(data.user);
      setToken(data.token);
      await refreshUser();
      closeAuthModal();
      setIsNewUserWelcomeOpen(true);
    } catch (err: any) {
      setAuthError(err.message || 'Sign up failed');
      throw err;
    }
  };

  const loginWithGoogle = async (email?: string, name?: string, avatar?: string) => {
    setAuthError(null);
    try {
      // Default to the known user email or prompted Google account
      const googleEmail = email || 'praneshdurai23@gmail.com';
      const googleName = name || 'Pranesh Durai';
      const data = await apiGoogleLogin(googleEmail, googleName, avatar);
      setUser(data.user);
      setToken(data.token);
      await refreshUser();
      closeAuthModal();
      if (data.isNewUser) {
        setIsNewUserWelcomeOpen(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setStats(null);
      setToken(null);
      setIsProfileModalOpen(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setAuthError(null);
    try {
      return await apiForgotPassword(email);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to request password reset');
      throw err;
    }
  };

  const resetPassword = async (email: string, resetToken: string, newPass: string) => {
    setAuthError(null);
    try {
      await apiResetPassword(email, resetToken, newPass);
      openAuthModal('login');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to reset password');
      throw err;
    }
  };

  const updateProfile = async (updates: { name?: string; avatar?: string }) => {
    try {
      const data = await apiUpdateProfile(updates);
      setUser(data.user);
    } catch (err: any) {
      throw err;
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      await apiChangePassword(currentPass, newPass);
    } catch (err: any) {
      throw err;
    }
  };

  const deleteAccount = async (password?: string) => {
    try {
      await apiDeleteAccount(password);
      setUser(null);
      setStats(null);
      setToken(null);
      setIsProfileModalOpen(false);
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        authError,
        setAuthError,
        login,
        signup,
        loginWithGoogle,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshUser,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isNewUserWelcomeOpen,
        setIsNewUserWelcomeOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
