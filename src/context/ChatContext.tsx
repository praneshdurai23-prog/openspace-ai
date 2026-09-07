import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Conversation,
  ChatMessage,
  FileAttachment,
  UserSettings,
  AIMode,
  ThemeMode,
  WorkspaceTab,
  StudyDifficulty,
  StudyCard,
  Project,
  SmartMemory,
} from '../types.ts';
import * as api from '../services/api.ts';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  currentMode: AIMode;
  setCurrentMode: (mode: AIMode) => void;
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | null;
  error: string | null;
  clearError: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settings: UserSettings;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  pendingFiles: FileAttachment[];
  addPendingFiles: (files: FileAttachment[]) => void;
  removePendingFile: (id: string) => void;
  clearPendingFiles: () => void;
  newChat: (mode?: AIMode) => void;
  selectConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  clearCurrentChat: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateResponse: (messageId?: string) => Promise<void>;
  continueGeneration: () => Promise<void>;
  editUserMessage: (messageId: string, newText: string) => Promise<void>;
  setMessageFeedback: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>;
  pinConversation: (id: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  exportConversation: (id: string, format: 'markdown' | 'txt' | 'json' | 'md') => void;
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  serverHealth: { status: string; geminiConfigured: boolean } | null;
  // Upgraded workspace features
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  webSearchActive: boolean;
  setWebSearchActive: (active: boolean) => void;
  toggleWebSearch: () => void;
  studyDifficulty: StudyDifficulty;
  setStudyDifficulty: (diff: StudyDifficulty) => void;
  updateConversationNotes: (notes: string) => Promise<void>;
  addStudyCard: (card: StudyCard) => Promise<void>;
  removeStudyCard: (cardId: string) => Promise<void>;
  streamingGrounding: { queries: string[]; sources: any[] } | null;
  // Projects Engine
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  // Smart Memory
  memories: SmartMemory[];
  addMemory: (content: string, category?: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  clearAllMemories: () => Promise<void>;
  // Simple Explanation Mode
  simpleExplanationMode: boolean;
  setSimpleExplanationMode: (enabled: boolean) => void;
  toggleSimpleExplanationMode: () => void;
  // Share Modal
  shareModalData: { isOpen: boolean; shareUrl: string; title: string; conversationId: string } | null;
  shareModalState: { isOpen: boolean; conversationId?: string };
  openShareModal: (conversationId: string) => Promise<void>;
  closeShareModal: () => void;
  // Voice Modal
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  // Prompt Library
  isPromptLibraryOpen: boolean;
  setIsPromptLibraryOpen: (open: boolean) => void;
  // Canvas Document
  canvasDocument: { title: string; content: string };
  setCanvasDocument: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  reloadWorkspaceData: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultMode: 'normal',
  sendOnEnter: true,
  streamResponses: true,
  codeWrap: false,
  language: 'english',
  responseLength: 'balanced',
  responseStyle: 'professional',
  personality: 'friendly',
  fontSize: 'medium',
  webSearchDefault: false,
  simpleExplanationDefault: false,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMode>('normal');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingGrounding, setStreamingGrounding] = useState<{ queries: string[]; sources: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const [serverHealth, setServerHealth] = useState<{ status: string; geminiConfigured: boolean } | null>(null);

  // Upgraded Workspace & Personalization States
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('chat');
  const [webSearchActive, setWebSearchActive] = useState<boolean>(false);
  const [studyDifficulty, setStudyDifficulty] = useState<StudyDifficulty>('medium');
  const [simpleExplanationMode, setSimpleExplanationMode] = useState<boolean>(false);

  // Projects Engine
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Smart Memories
  const [memories, setMemories] = useState<SmartMemory[]>([]);

  // Share Modal
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    shareUrl: string;
    title: string;
    conversationId: string;
  } | null>(null);

  // Prompt Library Modal
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState<boolean>(false);

  // Voice Mode Modal
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Document Canvas
  const [canvasDocument, setCanvasDocument] = useState<{ title: string; content: string }>({
    title: 'Untitled Document',
    content: '# Welcome to OpenSpace Canvas\n\nStart writing, drafting notes, or generating structured sections using AI...',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Apply Font Size
  const applyFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${size || 'medium'}`);
  }, []);

  // Apply Theme to documentElement
  const applyTheme = useCallback((selectedTheme: ThemeMode) => {
    let resolved: 'light' | 'dark' = 'dark';
    if (selectedTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = selectedTheme;
    }

    setEffectiveTheme(resolved);
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('openspace_theme', newTheme);
    applyTheme(newTheme);
    updateUserSettings({ theme: newTheme });
  };

  const toggleWebSearch = () => {
    setWebSearchActive((prev) => !prev);
  };

  // Initial load
  useEffect(() => {
    // Check saved theme
    const savedTheme = (localStorage.getItem('openspace_theme') as ThemeMode) || (localStorage.getItem('myai_theme') as ThemeMode) || 'dark';
    setThemeState(savedTheme);
    applyTheme(savedTheme);

    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentStored = (localStorage.getItem('openspace_theme') as ThemeMode) || (localStorage.getItem('myai_theme') as ThemeMode) || 'system';
      if (currentStored === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    // Initial server health and data fetch
    api.checkServerHealth()
      .then((h) => setServerHealth({ status: h.status, geminiConfigured: h.geminiConfigured }))
      .catch((err) => console.warn('Backend health check failed:', err));

    api.fetchUserSettings()
      .then((s) => {
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.theme) {
          setThemeState(s.theme);
          applyTheme(s.theme);
        }
        if (s.fontSize) {
          applyFontSize(s.fontSize);
        }
        if (s.defaultMode) {
          setCurrentMode(s.defaultMode);
        }
        if (s.webSearchDefault !== undefined) {
          setWebSearchActive(s.webSearchDefault);
        }
      })
      .catch(() => {});

    api.fetchConversations()
      .then((convs) => {
        const seen = new Set<string>();
        const sanitized = (convs || [])
          .filter(Boolean)
          .map((c, i) => {
            let id = c.id && c.id !== 'undefined' ? c.id : `conv_${c.createdAt || Date.now()}_${i}`;
            if (seen.has(id)) id = `${id}_${i}`;
            seen.add(id);
            return { ...c, id };
          });
        setConversations(sanitized);
        if (sanitized.length > 0) {
          setActiveConversationId(sanitized[0].id);
          setCurrentMode(sanitized[0].mode || 'normal');
        }
      })
      .catch((err) => {
        console.error('Failed to load conversations from server:', err);
      });

    // Fetch initial projects & memories
    api.fetchProjects()
      .then(setProjects)
      .catch((err) => console.warn('Failed to load projects:', err));

    api.fetchMemories()
      .then(setMemories)
      .catch((err) => console.warn('Failed to load memories:', err));

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [applyTheme, applyFontSize]);

  const reloadWorkspaceData = useCallback(async () => {
    try {
      const convs = await api.fetchConversations();
      const seen = new Set<string>();
      const sanitized = (convs || [])
        .filter(Boolean)
        .map((c, i) => {
          let id = c.id && c.id !== 'undefined' ? c.id : `conv_${c.createdAt || Date.now()}_${i}`;
          if (seen.has(id)) id = `${id}_${i}`;
          seen.add(id);
          return { ...c, id };
        });
      setConversations(sanitized);
      if (sanitized.length > 0) {
        setActiveConversationId(sanitized[0].id);
        setCurrentMode(sanitized[0].mode || 'normal');
      } else {
        setActiveConversationId(null);
      }
    } catch {
      setConversations([]);
      setActiveConversationId(null);
    }

    try {
      const projs = await api.fetchProjects();
      setProjects(projs);
    } catch {
      setProjects([]);
    }

    try {
      const mems = await api.fetchMemories();
      setMemories(mems);
    } catch {
      setMemories([]);
    }

    try {
      const s = await api.fetchUserSettings();
      setSettings((prev) => ({ ...prev, ...s }));
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const clearError = () => {
    setError(null);
  };

  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    if (updates.fontSize) {
      applyFontSize(updates.fontSize);
    }
    try {
      await api.saveUserSettings(updates);
    } catch (err) {
      console.warn('Failed to save settings to server:', err);
    }
  };

  const addPendingFiles = (newFiles: FileAttachment[]) => {
    setPendingFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 15) {
        setError('Maximum 15 files allowed per conversation.');
        return combined.slice(0, 15);
      }
      return combined;
    });
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearPendingFiles = () => {
    setPendingFiles([]);
  };

  // Start a new chat
  const newChat = (mode?: AIMode) => {
    const targetMode = mode || settings.defaultMode || 'normal';
    const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      mode: targetMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setCurrentMode(targetMode);
    setPendingFiles([]);
    setError(null);

    // Close mobile sidebar
    setIsSidebarOpen(false);

    // Optimistically save to server
    api.createConversation(newConv).catch((err) => {
      console.warn('Failed to create conversation on server:', err);
    });
  };

  // Select conversation
  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    setPendingFiles([]);
    setError(null);
    setIsSidebarOpen(false);

    const existing = conversations.find((c) => c.id === id);
    if (existing) {
      setCurrentMode(existing.mode || 'normal');
    }

    try {
      const full = await api.fetchConversation(id);
      if (full) {
        setConversations((prev) => prev.map((c) => (c.id === id ? full : c)));
        setCurrentMode(full.mode || 'normal');
      }
    } catch (err) {
      console.warn('Failed to fetch conversation details:', err);
    }
  };

  // Rename conversation
  const renameConversation = async (id: string, newTitle: string) => {
    const cleanTitle = newTitle.trim() || 'Untitled Chat';
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: cleanTitle, updatedAt: Date.now() } : c))
    );

    try {
      await api.updateConversation(id, { title: cleanTitle });
    } catch (err) {
      console.error('Failed to rename conversation on server:', err);
    }
  };

  // Delete conversation
  const deleteConversation = async (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);

    if (activeConversationId === id) {
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
        setCurrentMode(remaining[0].mode || 'normal');
      } else {
        newChat();
      }
    }

    try {
      await api.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation on server:', err);
    }
  };

  // Clear all conversations
  const clearAllConversations = async () => {
    setConversations([]);
    setActiveConversationId(null);
    newChat();

    try {
      await api.clearAllConversations();
    } catch (err) {
      console.error('Failed to clear all conversations on server:', err);
    }
  };

  // Clear current chat
  const clearCurrentChat = async () => {
    if (!activeConversationId) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [], updatedAt: Date.now() }
          : c
      )
    );
    setPendingFiles([]);
    setError(null);

    try {
      await api.updateConversation(activeConversationId, { messages: [] });
    } catch (err) {
      console.error('Failed to clear current chat on server:', err);
    }
  };

  // Pin Conversation
  const pinConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const newPinned = !conv.pinned;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: newPinned } : c))
    );
    try {
      await api.updateConversation(id, { pinned: newPinned });
    } catch (err) {
      console.warn('Failed to update pin state:', err);
    }
  };

  // Archive Conversation
  const archiveConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const newArchived = !conv.archived;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: newArchived } : c))
    );
    try {
      await api.updateConversation(id, { archived: newArchived });
    } catch (err) {
      console.warn('Failed to update archive state:', err);
    }
  };

  // Export Conversation (Markdown, TXT, JSON)
  const exportConversation = (id: string, format: 'markdown' | 'txt' | 'json' | 'md') => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    const normalizedFormat = format === 'md' ? 'markdown' : format;
    let content = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';

    if (normalizedFormat === 'json') {
      content = JSON.stringify(conv, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else if (normalizedFormat === 'markdown') {
      fileExtension = 'md';
      mimeType = 'text/markdown';
      content = `# ${conv.title || 'OpenSpace Conversation'}\n\n*Exported from OpenSpace AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
      for (const m of conv.messages) {
        const roleName = m.role === 'user' ? 'User' : 'OpenSpace AI';
        content += `### **${roleName}** (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`;
        if (m.groundingSources && m.groundingSources.length > 0) {
          content += `*Sources:*\n` + m.groundingSources.map((s) => `- [${s.title}](${s.url})`).join('\n') + '\n\n';
        }
        content += '---\n\n';
      }
    } else {
      fileExtension = 'txt';
      mimeType = 'text/plain';
      content = `${conv.title || 'OpenSpace Conversation'}\nExported from OpenSpace AI: ${new Date().toLocaleString()}\n\n`;
      for (const m of conv.messages) {
        const roleName = m.role === 'user' ? 'User' : 'OpenSpace AI';
        content += `[${roleName}] ${new Date(m.timestamp).toLocaleTimeString()}:\n${m.content}\n\n`;
      }
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (conv.title || 'chat').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.download = `openspace_${sanitizedTitle}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Projects CRUD
  const createProject = async (data: Partial<Project>): Promise<Project> => {
    const created = await api.createProject(data);
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    return created;
  };

  const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
    const updated = await api.updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProject = async (id: string): Promise<void> => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  // Smart Memories CRUD
  const addMemory = async (content: string, category?: string): Promise<void> => {
    const created = await api.addMemory(content, category);
    setMemories((prev) => [created, ...prev]);
  };

  const deleteMemory = async (id: string): Promise<void> => {
    await api.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const clearAllMemories = async (): Promise<void> => {
    await api.clearAllMemories();
    setMemories([]);
  };

  // Toggle Simple Explanation Mode
  const toggleSimpleExplanationMode = () => {
    setSimpleExplanationMode((prev) => !prev);
  };

  // Share Modal
  const openShareModal = async (conversationId: string) => {
    try {
      const shared = await api.createSharedChat(conversationId);
      const url = `${window.location.origin}/#share=${shared.id}`;
      setShareModalData({
        isOpen: true,
        shareUrl: url,
        title: shared.title,
        conversationId,
      });
    } catch (err) {
      setError('Failed to generate share link. Please try again.');
    }
  };

  const closeShareModal = () => {
    setShareModalData(null);
  };

  // Update notes for the conversation
  const updateConversationNotes = async (notes: string) => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, notes } : c))
    );
    try {
      await api.updateConversation(activeConversationId, { notes });
    } catch (err) {
      console.warn('Failed to save notes:', err);
    }
  };

  // Add study card
  const addStudyCard = async (card: StudyCard) => {
    if (!activeConversationId) return;
    const currentCards = activeConversation?.studyCards || [];
    const updatedCards = [...currentCards, card];
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, studyCards: updatedCards } : c))
    );
    try {
      await api.updateConversation(activeConversationId, { studyCards: updatedCards });
    } catch (err) {
      console.warn('Failed to save study card:', err);
    }
  };

  // Remove study card
  const removeStudyCard = async (cardId: string) => {
    if (!activeConversationId) return;
    const currentCards = activeConversation?.studyCards || [];
    const updatedCards = currentCards.filter((c) => c.id !== cardId);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, studyCards: updatedCards } : c))
    );
    try {
      await api.updateConversation(activeConversationId, { studyCards: updatedCards });
    } catch (err) {
      console.warn('Failed to delete study card:', err);
    }
  };

  // Message feedback (Like / Dislike)
  const setMessageFeedback = async (messageId: string, feedback: 'like' | 'dislike' | null) => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
        };
      })
    );
    try {
      await api.saveMessageFeedback(activeConversationId, messageId, feedback);
    } catch (err) {
      console.warn('Failed to persist message feedback:', err);
    }
  };

  // Stop Generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // If there is accumulated streaming content, commit it as final assistant message
    if (activeConversationId && streamingMessageId && streamingContent) {
      const finalMsg: ChatMessage = {
        id: streamingMessageId,
        role: 'assistant',
        content: streamingContent + ' *(Stopped by user)*',
        timestamp: Date.now(),
        mode: currentMode,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          const filtered = c.messages.filter((m) => m.id !== streamingMessageId);
          return {
            ...c,
            messages: [...filtered, finalMsg],
            updatedAt: Date.now(),
          };
        })
      );
    }

    setStreamingContent('');
    setStreamingMessageId(null);
    setStreamingGrounding(null);
  };

  // Send Message
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (isStreaming) return;

    let convId = activeConversationId;
    let targetConv = activeConversation;

    // If no active conversation, create one
    if (!convId || !targetConv) {
      const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      targetConv = {
        id: newId,
        title: trimmed ? trimmed.slice(0, 36) : pendingFiles[0]?.name || 'Chat',
        mode: currentMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations((prev) => [targetConv!, ...prev]);
      setActiveConversationId(newId);
      convId = newId;

      api.createConversation(targetConv).catch(console.warn);
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now() + 1}`;
    const attachedFiles = [...pendingFiles];
    setPendingFiles([]); // clear input attachments

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      mode: currentMode,
      attachments: attachedFiles,
    };

    // Optimistically update conversation
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const newTitle =
          c.messages.length === 0 && trimmed
            ? trimmed.slice(0, 36).trim()
            : c.title;
        return {
          ...c,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...c.messages, userMessage],
        };
      })
    );

    // Prepare streaming state
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingMessageId(assistantMessageId);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare history payload for Gemini (limit to last 10 messages and prune heavy past base64)
    const existingMessages = (targetConv.messages || []).slice(-10);
    const historyPayload = existingMessages.map((m, idx) => {
      const isImmediatePrevious = idx === existingMessages.length - 1;
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          mimeType: a.mimeType,
          base64Data: isImmediatePrevious ? a.base64Data : undefined,
          name: a.name,
        })),
      };
    });

    let accumulatedText = '';
    let isFirstChunk = true;
    let pendingRaf: number | null = null;

    const flushStreamContent = () => {
      setStreamingContent(accumulatedText);
      pendingRaf = null;
    };

    try {
      await api.streamChat({
        conversationId: convId,
        messageId: userMessageId,
        assistantMessageId,
        mode: currentMode,
        message: trimmed,
        history: historyPayload,
        attachments: attachedFiles,
        webSearch: webSearchActive,
        personalization: {
          language: settings.language,
          responseLength: settings.responseLength,
          responseStyle: settings.responseStyle,
          studyDifficulty,
        },
        difficulty: studyDifficulty,
        projectId: activeProjectId || targetConv.projectId,
        simpleExplanationMode: simpleExplanationMode || settings.simpleExplanationDefault,
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            setStreamingContent(accumulatedText); // Immediate 0ms first token to screen!
          } else if (pendingRaf === null) {
            pendingRaf = requestAnimationFrame(flushStreamContent);
          }
        },
        onGrounding: (gData) => {
          setStreamingGrounding(gData);
        },
        onTitle: (newTitle) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
          );
        },
        onDone: (data) => {
          if (pendingRaf !== null) {
            cancelAnimationFrame(pendingRaf);
            pendingRaf = null;
          }
          const finalMsg: ChatMessage = {
            id: data.id || assistantMessageId,
            role: 'assistant',
            content: data.content || accumulatedText,
            timestamp: Date.now(),
            mode: currentMode,
            webSearchUsed: data.webSearchUsed,
            searchQueries: data.searchQueries,
            groundingSources: data.groundingSources,
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
              return {
                ...c,
                messages: [...filtered, finalMsg],
                updatedAt: Date.now(),
              };
            })
          );

          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setError(errMsg);
          const errorMsg: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedText || '',
            timestamp: Date.now(),
            mode: currentMode,
            error: errMsg,
          };
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
              return {
                ...c,
                messages: [...filtered, errorMsg],
                updatedAt: Date.now(),
              };
            })
          );
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
      });
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        const errMsg = err?.message || 'Error communicating with assistant.';
        setError(errMsg);
        const errorMsg: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedText || '',
          timestamp: Date.now(),
          mode: currentMode,
          error: errMsg,
        };
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
            return {
              ...c,
              messages: [...filtered, errorMsg],
              updatedAt: Date.now(),
            };
          })
        );
      }
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingMessageId(null);
      setStreamingGrounding(null);
      abortControllerRef.current = null;
    }
  };

  // Continue generation seamlessly
  const continueGeneration = async () => {
    if (isStreaming) return;
    await sendMessage('Please continue seamlessly from where you left off.');
  };

  // Edit user message and re-stream
  const editUserMessage = async (messageId: string, newText: string) => {
    if (!activeConversation || isStreaming) return;
    const trimmed = newText.trim();
    if (!trimmed) return;

    const messages = activeConversation.messages;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const priorHistory = messages.slice(0, msgIndex);
    const existingAttachments = messages[msgIndex].attachments || [];

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now() + 1}`;

    const updatedUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      mode: currentMode,
      attachments: existingAttachments,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [...priorHistory, updatedUserMsg] }
          : c
      )
    );

    setIsStreaming(true);
    setStreamingContent('');
    setStreamingMessageId(assistantMessageId);
    setStreamingGrounding(null);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const trimmedPrior = priorHistory.slice(-10);
    const historyPayload = trimmedPrior.map((m, idx) => {
      const isImmediatePrevious = idx === trimmedPrior.length - 1;
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          mimeType: a.mimeType,
          base64Data: isImmediatePrevious ? a.base64Data : undefined,
          name: a.name,
        })),
      };
    });

    let accumulatedText = '';
    let isFirstChunk = true;
    let pendingRaf: number | null = null;

    const flushStreamContent = () => {
      setStreamingContent(accumulatedText);
      pendingRaf = null;
    };

    try {
      await api.streamChat({
        conversationId: activeConversation.id,
        messageId: userMessageId,
        assistantMessageId,
        mode: currentMode,
        message: trimmed,
        history: historyPayload,
        attachments: existingAttachments,
        webSearch: webSearchActive,
        personalization: {
          language: settings.language,
          responseLength: settings.responseLength,
          responseStyle: settings.responseStyle,
          studyDifficulty,
        },
        difficulty: studyDifficulty,
        projectId: activeProjectId || activeConversation.projectId,
        simpleExplanationMode: simpleExplanationMode || settings.simpleExplanationDefault,
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            setStreamingContent(accumulatedText);
          } else if (pendingRaf === null) {
            pendingRaf = requestAnimationFrame(flushStreamContent);
          }
        },
        onGrounding: (gData) => {
          setStreamingGrounding(gData);
        },
        onDone: (data) => {
          if (pendingRaf !== null) {
            cancelAnimationFrame(pendingRaf);
            pendingRaf = null;
          }
          const finalMsg: ChatMessage = {
            id: data.id || assistantMessageId,
            role: 'assistant',
            content: data.content || accumulatedText,
            timestamp: Date.now(),
            mode: currentMode,
            webSearchUsed: data.webSearchUsed,
            searchQueries: data.searchQueries,
            groundingSources: data.groundingSources,
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversation.id) return c;
              const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
              return {
                ...c,
                messages: [...filtered, finalMsg],
                updatedAt: Date.now(),
              };
            })
          );

          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setError(errMsg);
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
      });
    } catch (err: any) {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingMessageId(null);
      setStreamingGrounding(null);
      abortControllerRef.current = null;
    }
  };

  // Regenerate response
  const regenerateResponse = async (messageId?: string) => {
    if (!activeConversation || isStreaming) return;

    let history = [...activeConversation.messages];
    let lastUserIndex = -1;

    if (messageId) {
      const idx = history.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        if (history[idx].role === 'assistant') {
          // Find preceding user message
          lastUserIndex = idx - 1;
        } else {
          lastUserIndex = idx;
        }
      }
    } else {
      // Find the last user message
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }
    }

    if (lastUserIndex === -1) return;

    const userMessage = history[lastUserIndex];
    // Truncate history to before this user message
    const priorHistory = history.slice(0, lastUserIndex);

    // Update conversation messages to include up to user message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: history.slice(0, lastUserIndex + 1) }
          : c
      )
    );

    // Set streaming
    const assistantMessageId = `asst_${Date.now()}`;
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingMessageId(assistantMessageId);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const trimmedPrior = priorHistory.slice(-10);
    const historyPayload = trimmedPrior.map((m, idx) => {
      const isImmediatePrevious = idx === trimmedPrior.length - 1;
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          mimeType: a.mimeType,
          base64Data: isImmediatePrevious ? a.base64Data : undefined,
          name: a.name,
        })),
      };
    });

    let accumulatedText = '';
    let isFirstChunk = true;
    let pendingRaf: number | null = null;

    const flushStreamContent = () => {
      setStreamingContent(accumulatedText);
      pendingRaf = null;
    };

    try {
      await api.streamChat({
        conversationId: activeConversation.id,
        messageId: userMessage.id,
        assistantMessageId,
        mode: currentMode,
        message: userMessage.content,
        history: historyPayload,
        attachments: userMessage.attachments,
        webSearch: webSearchActive,
        personalization: {
          language: settings.language,
          responseLength: settings.responseLength,
          responseStyle: settings.responseStyle,
          studyDifficulty,
        },
        difficulty: studyDifficulty,
        projectId: activeProjectId || activeConversation.projectId,
        simpleExplanationMode: simpleExplanationMode || settings.simpleExplanationDefault,
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            setStreamingContent(accumulatedText);
          } else if (pendingRaf === null) {
            pendingRaf = requestAnimationFrame(flushStreamContent);
          }
        },
        onGrounding: (gData) => {
          setStreamingGrounding(gData);
        },
        onDone: (data) => {
          if (pendingRaf !== null) {
            cancelAnimationFrame(pendingRaf);
            pendingRaf = null;
          }
          const finalMsg: ChatMessage = {
            id: data.id || assistantMessageId,
            role: 'assistant',
            content: data.content || accumulatedText,
            timestamp: Date.now(),
            mode: currentMode,
            webSearchUsed: data.webSearchUsed,
            searchQueries: data.searchQueries,
            groundingSources: data.groundingSources,
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversation.id) return c;
              const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
              return {
                ...c,
                messages: [...filtered, finalMsg],
                updatedAt: Date.now(),
              };
            })
          );

          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setError(errMsg);
          const errorMsg: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedText || '',
            timestamp: Date.now(),
            mode: currentMode,
            error: errMsg,
          };
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversation.id) return c;
              const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
              return {
                ...c,
                messages: [...filtered, errorMsg],
                updatedAt: Date.now(),
              };
            })
          );
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(null);
          setStreamingGrounding(null);
          abortControllerRef.current = null;
        },
      });
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        const errMsg = err?.message || 'Error regenerating response.';
        setError(errMsg);
        const errorMsg: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedText || '',
          timestamp: Date.now(),
          mode: currentMode,
          error: errMsg,
        };
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversation.id) return c;
            const filtered = c.messages.filter((m) => m.id !== assistantMessageId);
            return {
              ...c,
              messages: [...filtered, errorMsg],
              updatedAt: Date.now(),
            };
          })
        );
      }
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingMessageId(null);
      setStreamingGrounding(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeConversationId,
        currentMode,
        setCurrentMode,
        isStreaming,
        streamingContent,
        streamingMessageId,
        error,
        clearError,
        searchQuery,
        setSearchQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isSettingsOpen,
        setIsSettingsOpen,
        settings,
        updateUserSettings,
        pendingFiles,
        addPendingFiles,
        removePendingFile,
        clearPendingFiles,
        newChat,
        selectConversation,
        renameConversation,
        deleteConversation,
        clearAllConversations,
        clearCurrentChat,
        sendMessage,
        stopGeneration,
        regenerateResponse,
        continueGeneration,
        editUserMessage,
        setMessageFeedback,
        theme,
        effectiveTheme,
        setTheme,
        serverHealth,
        workspaceTab,
        setWorkspaceTab,
        webSearchActive,
        setWebSearchActive,
        toggleWebSearch,
        studyDifficulty,
        setStudyDifficulty,
        updateConversationNotes,
        addStudyCard,
        removeStudyCard,
        streamingGrounding,
        pinConversation,
        togglePinConversation: pinConversation,
        archiveConversation,
        exportConversation,
        projects,
        activeProjectId,
        activeProject,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        memories,
        addMemory,
        deleteMemory,
        clearAllMemories,
        simpleExplanationMode,
        setSimpleExplanationMode,
        toggleSimpleExplanationMode,
        shareModalData,
        shareModalState: {
          isOpen: !!shareModalData?.isOpen,
          conversationId: shareModalData?.conversationId,
        },
        openShareModal,
        closeShareModal,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        isPromptLibraryOpen,
        setIsPromptLibraryOpen,
        canvasDocument,
        setCanvasDocument,
        reloadWorkspaceData,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
