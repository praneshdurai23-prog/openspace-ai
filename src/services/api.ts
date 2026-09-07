import {
  Conversation,
  ChatMessage,
  FileAttachment,
  UserSettings,
  AIMode,
  Project,
  SmartMemory,
  UserProfile,
  UserStats,
} from '../types.ts';

const AUTH_TOKEN_KEY = 'openspace_auth_token';
const LEGACY_AUTH_TOKEN_KEY = 'myai_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// ----------------------------------------------------
// AUTHENTICATION APIS
// ----------------------------------------------------

export async function apiRegister(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setStoredAuthToken(data.token);
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setStoredAuthToken(data.token);
  return data;
}

export async function apiGoogleLogin(
  email: string,
  name?: string,
  avatar?: string
): Promise<{ user: UserProfile; token: string; isNewUser: boolean }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, avatar }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google login failed');
  setStoredAuthToken(data.token);
  return data;
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
  } catch {
    // Continue cleanup even if server is unreachable
  } finally {
    setStoredAuthToken(null);
  }
}

export async function apiGetMe(): Promise<{ user: UserProfile; stats: UserStats }> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('No authentication token found');

  const res = await fetch('/api/auth/me', {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) {
    setStoredAuthToken(null);
    throw new Error(data.error || 'Session expired. Please log in again.');
  }
  return data;
}

export async function apiUpdateProfile(updates: {
  name?: string;
  avatar?: string;
}): Promise<{ user: UserProfile }> {
  const res = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password');
  return data;
}

export async function apiForgotPassword(
  email: string
): Promise<{ resetToken: string; message: string }> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process request');
  return data;
}

export async function apiResetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
}

export async function apiExportUserData(): Promise<Blob> {
  const res = await fetch('/api/auth/export-data', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to export user data');
  return res.blob();
}

export async function apiDeleteAccount(password?: string): Promise<boolean> {
  const res = await fetch('/api/auth/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete account');
  setStoredAuthToken(null);
  return true;
}

// ----------------------------------------------------
// WORKSPACE DATA APIS
// ----------------------------------------------------

export async function checkServerHealth(): Promise<{
  status: string;
  name: string;
  geminiConfigured: boolean;
}> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Failed to connect to backend server');
  return res.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load conversations');
  const data = await res.json();
  return data.conversations || [];
}

export async function createConversation(conv: {
  id: string;
  title: string;
  mode: AIMode;
  messages?: ChatMessage[];
}): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(conv),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const data = await res.json();
  return data.conversation;
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeaders() },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load conversation');
  const data = await res.json();
  return data.conversation;
}

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  const data = await res.json();
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return true;
}

export async function clearAllConversations(): Promise<boolean> {
  const res = await fetch('/api/conversations', {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to clear conversations');
  return true;
}

// Projects API
export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load projects');
  const data = await res.json();
  return data.projects || [];
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to create project');
  const data = await res.json();
  return data.project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  const data = await res.json();
  return data.project;
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return true;
}

// Settings API
export async function fetchSettings(): Promise<Partial<UserSettings>> {
  const res = await fetch('/api/settings', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load settings');
  const data = await res.json();
  return data.settings || {};
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  const data = await res.json();
  return data.settings;
}

export const fetchUserSettings = fetchSettings;
export const saveUserSettings = saveSettings;

// File upload API
export async function uploadFile(
  conversationId: string,
  file: {
    id?: string;
    name: string;
    size: number;
    mimeType: string;
    dataUrl?: string;
  }
): Promise<FileAttachment> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ conversationId, file }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  const data = await res.json();
  return data.file;
}

export async function fetchConversationFiles(conversationId: string): Promise<FileAttachment[]> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/files`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch conversation files');
  const data = await res.json();
  return data.files || [];
}

export async function fetchAllFiles(): Promise<FileAttachment[]> {
  const res = await fetch('/api/files', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch files');
  const data = await res.json();
  return data.files || [];
}

export async function deleteStoredFile(fileId: string): Promise<boolean> {
  const res = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete file');
  return true;
}

// Message feedback
export async function submitMessageFeedback(
  conversationId: string,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): Promise<boolean> {
  const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ conversationId, feedback }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}

export const saveMessageFeedback = submitMessageFeedback;

// Smart Memory API
export async function fetchMemories(): Promise<SmartMemory[]> {
  const res = await fetch('/api/memories', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load memories');
  const data = await res.json();
  return data.memories || [];
}

export async function addMemory(content: string, category?: string): Promise<SmartMemory> {
  const res = await fetch('/api/memories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content, category }),
  });
  if (!res.ok) throw new Error('Failed to save memory');
  const data = await res.json();
  return data.memory;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const res = await fetch(`/api/memories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete memory');
  return true;
}

export async function clearAllMemories(): Promise<boolean> {
  const res = await fetch('/api/memories/clear', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to clear memories');
  return true;
}

// Share Chat API
export async function shareConversation(conversationId: string): Promise<{
  id: string;
  title: string;
  shareUrl: string;
}> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) throw new Error('Failed to generate share link');
  const data = await res.json();
  const origin = window.location.origin;
  return {
    id: data.sharedChat.id,
    title: data.sharedChat.title,
    shareUrl: `${origin}/?shared=${encodeURIComponent(data.sharedChat.id)}`,
  };
}

export const createSharedChat = shareConversation;

export async function fetchSharedChat(id: string): Promise<Conversation | null> {
  const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.sharedChat;
}

// AI Canvas Action
export async function executeCanvasAction(params: {
  action: 'rewrite' | 'summarize' | 'expand' | 'simplify' | 'improve_grammar' | 'change_tone' | 'generate_content';
  text: string;
  customPrompt?: string;
  tone?: string;
}): Promise<string> {
  const res = await fetch('/api/ai/canvas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to process canvas action');
  }
  const data = await res.json();
  return data.result;
}

// Streaming Chat API via SSE
export interface StreamChatParams {
  conversationId: string;
  messageId: string;
  assistantMessageId: string;
  mode: AIMode;
  message: string;
  history: Array<{ role: string; content: string; attachments?: any[] } | ChatMessage>;
  attachments?: FileAttachment[];
  webSearch?: boolean;
  personalization?: {
    language?: string;
    responseLength?: string;
    responseStyle?: string;
    studyDifficulty?: string;
  };
  difficulty?: string;
  projectId?: string;
  simpleExplanationMode?: boolean;
  signal?: AbortSignal;
  onStart?: (data: { id: string }) => void;
  onChunk: (text: string) => void;
  onGrounding?: (data: { queries: string[]; sources: any[] }) => void;
  onDone: (data: {
    id: string;
    content: string;
    webSearchUsed?: boolean;
    searchQueries?: string[];
    groundingSources?: any[];
  }) => void;
  onError: (error: string) => void;
  onTitle?: (title: string) => void;
}

export async function streamChat(params: StreamChatParams): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      conversationId: params.conversationId,
      messageId: params.messageId,
      assistantMessageId: params.assistantMessageId,
      mode: params.mode,
      message: params.message,
      history: params.history,
      attachments: params.attachments,
      webSearch: params.webSearch,
      personalization: params.personalization,
      difficulty: params.difficulty,
      projectId: params.projectId,
      simpleExplanationMode: params.simpleExplanationMode,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          try {
            const data = JSON.parse(rawData);
            if (currentEvent === 'start') {
              params.onStart?.(data);
            } else if (currentEvent === 'chunk') {
              params.onChunk(data.text);
            } else if (currentEvent === 'grounding') {
              params.onGrounding?.(data);
            } else if (currentEvent === 'done') {
              params.onDone(data);
            } else if (currentEvent === 'title') {
              params.onTitle?.(data.title);
            } else if (currentEvent === 'error') {
              params.onError(data.error);
            }
          } catch (parseErr) {
            console.error('Failed to parse SSE data:', rawData, parseErr);
          }
        }
      }
    }
  } catch (err: any) {
    if (params.signal?.aborted) {
      return;
    }
    params.onError(err?.message || 'Connection lost during streaming.');
  }
}
