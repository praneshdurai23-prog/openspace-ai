/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ChatProvider, useChat } from './context/ChatContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { WorkspaceTabs } from './components/WorkspaceTabs.tsx';
import { ChatArea } from './components/ChatArea.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { WorkspaceFiles } from './components/WorkspaceFiles.tsx';
import { WorkspaceStudy } from './components/WorkspaceStudy.tsx';
import { WorkspaceNotes } from './components/WorkspaceNotes.tsx';
import { WorkspaceCode } from './components/WorkspaceCode.tsx';
import { CanvasView } from './components/CanvasView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { DataAnalysisView } from './components/DataAnalysisView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { PromptLibraryModal } from './components/PromptLibraryModal.tsx';
import { VoiceModeModal } from './components/VoiceModeModal.tsx';
import { MemoryManager } from './components/MemoryManager.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { NewUserWelcomeModal } from './components/NewUserWelcomeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { OpenSpaceLogo } from './components/OpenSpaceLogo.tsx';

function MainLayout() {
  const {
    workspaceTab,
    newChat,
    setIsSettingsOpen,
    setIsSidebarOpen,
    isPromptLibraryOpen,
    setIsPromptLibraryOpen,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    shareModalState,
    closeShareModal,
  } = useChat();

  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N: New Chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newChat();
      }
      // Escape: close modals/drawers
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsSidebarOpen(false);
        setIsPromptLibraryOpen(false);
        setIsVoiceModalOpen(false);
        setIsMemoryOpen(false);
        closeShareModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newChat, setIsSettingsOpen, setIsSidebarOpen, setIsPromptLibraryOpen, setIsVoiceModalOpen, closeShareModal]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#080A12] text-slate-900 dark:text-[#F5F7FF] antialiased font-sans">
      {/* Responsive Collapsible Sidebar */}
      <Sidebar onOpenMemory={() => setIsMemoryOpen(true)} />

      {/* Main Unified Workspace */}
      <main className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        <Header onOpenMemory={() => setIsMemoryOpen(true)} />
        <WorkspaceTabs />

        {/* Tab Views */}
        {workspaceTab === 'chat' && (
          <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
            <ChatArea />
            <ChatInput />
          </div>
        )}
        {workspaceTab === 'canvas' && <CanvasView />}
        {workspaceTab === 'projects' && <ProjectsView />}
        {workspaceTab === 'data' && <DataAnalysisView />}
        {workspaceTab === 'files' && <WorkspaceFiles />}
        {workspaceTab === 'study' && <WorkspaceStudy />}
        {workspaceTab === 'notes' && <WorkspaceNotes />}
        {workspaceTab === 'code' && <WorkspaceCode />}
      </main>

      {/* Modals */}
      <SettingsModal onOpenMemory={() => setIsMemoryOpen(true)} />
      {shareModalState.isOpen && <ShareModal />}
      {isPromptLibraryOpen && <PromptLibraryModal />}
      {isVoiceModalOpen && <VoiceModeModal />}
      {isMemoryOpen && <MemoryManager isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />}
      <AuthModal />
      <ProfileModal />
      <NewUserWelcomeModal />
    </div>
  );
}

function WorkspaceContainer() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { reloadWorkspaceData } = useChat();
  const [guestMode, setGuestMode] = useState(false);

  // Sync workspace data whenever user logs in or logs out
  useEffect(() => {
    reloadWorkspaceData();
  }, [user?.id, reloadWorkspaceData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#080A12] text-slate-900 dark:text-[#F5F7FF]">
        <OpenSpaceLogo variant="loading" animated />
      </div>
    );
  }

  // If not authenticated and user hasn't explicitly entered guest mode, show the Landing Page
  if (!isAuthenticated && !guestMode) {
    return (
      <>
        <LandingPage onContinueAsGuest={() => setGuestMode(true)} />
        <AuthModal />
      </>
    );
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <WorkspaceContainer />
      </ChatProvider>
    </AuthProvider>
  );
}
