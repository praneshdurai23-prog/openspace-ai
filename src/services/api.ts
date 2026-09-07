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
// SAFE RESPONSE PARSING & RESILIENT FETCH HELPERS
// ----------------------------------------------------

/**
 * Robust JSON parser for HTTP fetch responses.
 * Prevents "Unexpected token T, the page content is not valid JSON" or HTML syntax errors.
 * Safely handles:
 * 1. Plain text responses (e.g., "The page could not be found", "Too many requests")
 * 2. HTML error pages (e.g. <!DOCTYPE html> 404/500/502/504 pages from Vercel or proxies)
 * 3. Empty or non-JSON payloads
 * 4. Structured JSON error bodies
 */
export async function safeParseResponse<T = any>(
  res: Response,
  fallbackErrorMessage = 'Request failed'
): Promise<T> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    if (!res.ok) {
      throw new Error(`${fallbackErrorMessage} (HTTP ${res.status})`);
    }
    return {} as T;
  }

  const trimmed = rawText.trim();

  // Determine if content is valid JSON without throwing unhandled syntax errors
  let parsed: any = null;
  let isJsonValid = false;

  if (trimmed) {
    const looksLikeJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      contentType.includes('application/json') ||
      contentType.includes('+json');

    if (looksLikeJson) {
      try {
        parsed = JSON.parse(trimmed);
        isJsonValid = true;
      } catch {
        parsed = null;
        isJsonValid = false;
      }
    }
  }

  // Handle non-2xx HTTP status codes
  if (!res.ok) {
    if (isJsonValid && parsed && typeof parsed === 'object') {
      const errMsg = parsed.error || parsed.message || parsed.detail;
      if (typeof errMsg === 'string' && errMsg.trim()) {
        throw new Error(errMsg.trim());
      }
    }

    // Response is HTML or plain text error page (e.g., Vercel 404 or proxy error)
    if (
      trimmed.startsWith('<') ||
      trimmed.toLowerCase().includes('<!doctype') ||
      trimmed.toLowerCase().includes('<html')
    ) {
      if (res.status === 404) {
        throw new Error('API endpoint not found (HTTP 404). Please ensure the backend is running.');
      }
      if (res.status === 502 || res.status === 504) {
        throw new Error('Backend service is temporarily unavailable. Please try again in a moment.');
      }
      throw new Error(`Server returned an error page (HTTP ${res.status}).`);
    }

    // Plain text single-line error message (like "The page could not be found" or rate limiter)
    if (trimmed && trimmed.length < 150 && !trimmed.includes('\n')) {
      throw new Error(`${trimmed} (HTTP ${res.status})`);
    }

    throw new Error(`${fallbackErrorMessage} (HTTP ${res.status})`);
  }

  // 2xx Success response
  if (!trimmed) {
    return {} as T;
  }

  if (!isJsonValid) {
    // If server returned 200 OK with HTML (e.g., SPA rewrite matched an API route instead of an API handler)
    if (
      trimmed.startsWith('<') ||
      trimmed.toLowerCase().includes('<!doctype') ||
      trimmed.toLowerCase().includes('<html')
    ) {
      throw new Error('Received HTML response instead of JSON. The backend server or serverless route may not be responding.');
    }
    throw new Error(`Invalid response format from server: expected JSON but received "${trimmed.slice(0, 50)}..."`);
  }

  return parsed as T;
}

/**
 * Resilient fetch wrapper with network error guarding and safe response parsing.
 */
export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackErrorMessage = 'Request failed'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  return safeParseResponse<T>(res, fallbackErrorMessage);
}

// ----------------------------------------------------
// AUTHENTICATION APIS
// ----------------------------------------------------

export async function apiRegister(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserProfile; token: string }> {
  const data = await safeFetch<{ user: UserProfile; token: string }>(
    '/api/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    },
    'Registration failed'
  );
  setStoredAuthToken(data.token);
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: UserProfile; token: string }> {
  const data = await safeFetch<{ user: UserProfile; token: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    'Login failed'
  );
  setStoredAuthToken(data.token);
  return data;
}

export async function apiGoogleLogin(
  email: string,
  name?: string,
  avatar?: string
): Promise<{ user: UserProfile; token: string; isNewUser: boolean }> {
  const data = await safeFetch<{ user: UserProfile; token: string; isNewUser: boolean }>(
    '/api/auth/google',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatar }),
    },
    'Google login failed'
  );
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

  try {
    const data = await safeFetch<{ user: UserProfile; stats: UserStats }>(
      '/api/auth/me',
      {
        headers: { ...getAuthHeaders() },
      },
      'Session expired. Please log in again.'
    );
    return data;
  } catch (err: any) {
    if (
      err?.message?.includes('401') ||
      err?.message?.includes('expired') ||
      err?.message?.includes('Authentication required')
    ) {
      setStoredAuthToken(null);
    }
    throw err;
  }
}

export async function apiUpdateProfile(updates: {
  name?: string;
  avatar?: string;
}): Promise<{ user: UserProfile }> {
  return safeFetch<{ user: UserProfile }>(
    '/api/auth/profile',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    },
    'Failed to update profile'
  );
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return safeFetch<{ success: boolean; message: string }>(
    '/api/auth/change-password',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    'Failed to change password'
  );
}

export async function apiForgotPassword(
  email: string
): Promise<{ resetToken: string; message: string }> {
  return safeFetch<{ resetToken: string; message: string }>(
    '/api/auth/forgot-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
    'Failed to process password reset request'
  );
}

export async function apiResetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return safeFetch<{ success: boolean; message: string }>(
    '/api/auth/reset-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    },
    'Failed to reset password'
  );
}

export async function apiExportUserData(): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch('/api/auth/export-data', {
      headers: { ...getAuthHeaders() },
    });
  } catch {
    throw new Error('Unable to connect to server to export user data.');
  }

  if (!res.ok) {
    let errMsg = 'Failed to export user data';
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.error) errMsg = parsed.error;
    } catch {}
    throw new Error(errMsg);
  }
  return res.blob();
}

export async function apiDeleteAccount(password?: string): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    '/api/auth/account',
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ password }),
    },
    'Failed to delete account'
  );
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
  return safeFetch<{
    status: string;
    name: string;
    geminiConfigured: boolean;
  }>('/api/health', { method: 'GET' }, 'Failed to connect to backend server');
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const data = await safeFetch<{ conversations: Conversation[] }>(
      '/api/conversations',
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to load conversations'
    );
    return Array.isArray(data?.conversations) ? data.conversations : [];
  } catch (err) {
    console.warn('Could not load conversations from server:', err);
    return [];
  }
}

export async function createConversation(conv: {
  id: string;
  title: string;
  mode: AIMode;
  messages?: ChatMessage[];
}): Promise<Conversation> {
  const data = await safeFetch<{ conversation: Conversation }>(
    '/api/conversations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(conv),
    },
    'Failed to create conversation'
  );
  return data.conversation;
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
      headers: { ...getAuthHeaders() },
    });
    if (res.status === 404) return null;
    const data = await safeParseResponse<{ conversation: Conversation }>(
      res,
      'Failed to load conversation'
    );
    return data?.conversation || null;
  } catch {
    return null;
  }
}

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  const data = await safeFetch<{ conversation: Conversation }>(
    `/api/conversations/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    },
    'Failed to update conversation'
  );
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    `/api/conversations/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    },
    'Failed to delete conversation'
  );
  return true;
}

export async function clearAllConversations(): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    '/api/conversations',
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    },
    'Failed to clear conversations'
  );
  return true;
}

// Projects API
export async function fetchProjects(): Promise<Project[]> {
  try {
    const data = await safeFetch<{ projects: Project[] }>(
      '/api/projects',
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to load projects'
    );
    return Array.isArray(data?.projects) ? data.projects : [];
  } catch (err) {
    console.warn('Could not load projects from server:', err);
    return [];
  }
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const data = await safeFetch<{ project: Project }>(
    '/api/projects',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(project),
    },
    'Failed to create project'
  );
  return data.project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const data = await safeFetch<{ project: Project }>(
    `/api/projects/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    },
    'Failed to update project'
  );
  return data.project;
}

export async function deleteProject(id: string): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    `/api/projects/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    },
    'Failed to delete project'
  );
  return true;
}

// Settings API
export async function fetchSettings(): Promise<Partial<UserSettings>> {
  try {
    const data = await safeFetch<{ settings: Partial<UserSettings> }>(
      '/api/settings',
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to load settings'
    );
    return data?.settings || {};
  } catch {
    return {};
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const data = await safeFetch<{ settings: UserSettings }>(
    '/api/settings',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    },
    'Failed to save settings'
  );
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
  const data = await safeFetch<{ file: FileAttachment }>(
    '/api/upload',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ conversationId, file }),
    },
    'Upload failed'
  );
  return data.file;
}

export async function fetchConversationFiles(conversationId: string): Promise<FileAttachment[]> {
  try {
    const data = await safeFetch<{ files: FileAttachment[] }>(
      `/api/conversations/${encodeURIComponent(conversationId)}/files`,
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to fetch conversation files'
    );
    return Array.isArray(data?.files) ? data.files : [];
  } catch {
    return [];
  }
}

export async function fetchAllFiles(): Promise<FileAttachment[]> {
  try {
    const data = await safeFetch<{ files: FileAttachment[] }>(
      '/api/files',
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to fetch files'
    );
    return Array.isArray(data?.files) ? data.files : [];
  } catch {
    return [];
  }
}

export async function deleteStoredFile(fileId: string): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    `/api/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    },
    'Failed to delete file'
  );
  return true;
}

// Message feedback
export async function submitMessageFeedback(
  conversationId: string,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): Promise<boolean> {
  try {
    const data = await safeFetch<{ success: boolean }>(
      `/api/messages/${encodeURIComponent(messageId)}/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ conversationId, feedback }),
      },
      'Failed to submit feedback'
    );
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

export const saveMessageFeedback = submitMessageFeedback;

// Smart Memory API
export async function fetchMemories(): Promise<SmartMemory[]> {
  try {
    const data = await safeFetch<{ memories: SmartMemory[] }>(
      '/api/memories',
      {
        headers: { ...getAuthHeaders() },
      },
      'Failed to load memories'
    );
    return Array.isArray(data?.memories) ? data.memories : [];
  } catch {
    return [];
  }
}

export async function addMemory(content: string, category?: string): Promise<SmartMemory> {
  const data = await safeFetch<{ memory: SmartMemory }>(
    '/api/memories',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content, category }),
    },
    'Failed to save memory'
  );
  return data.memory;
}

export async function deleteMemory(id: string): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    `/api/memories/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    },
    'Failed to delete memory'
  );
  return true;
}

export async function clearAllMemories(): Promise<boolean> {
  await safeFetch<{ success: boolean }>(
    '/api/memories/clear',
    {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    },
    'Failed to clear memories'
  );
  return true;
}

// Share Chat API
export async function shareConversation(conversationId: string): Promise<{
  id: string;
  title: string;
  shareUrl: string;
}> {
  const data = await safeFetch<{
    sharedChat: { id: string; title: string };
  }>(
    '/api/share',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ conversationId }),
    },
    'Failed to generate share link'
  );
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    id: data.sharedChat.id,
    title: data.sharedChat.title,
    shareUrl: `${origin}/?shared=${encodeURIComponent(data.sharedChat.id)}`,
  };
}

export const createSharedChat = shareConversation;

export async function fetchSharedChat(id: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await safeParseResponse<{ sharedChat: Conversation }>(
      res,
      'Failed to load shared chat'
    );
    return data?.sharedChat || null;
  } catch {
    return null;
  }
}

// AI Canvas Action
export async function executeCanvasAction(params: {
  action: 'rewrite' | 'summarize' | 'expand' | 'simplify' | 'improve_grammar' | 'change_tone' | 'generate_content';
  text: string;
  customPrompt?: string;
  tone?: string;
}): Promise<string> {
  const data = await safeFetch<{ result: string }>(
    '/api/ai/canvas',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(params),
    },
    'Failed to process canvas action'
  );
  return data?.result || '';
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
  let response: Response;
  try {
    response = await fetch('/api/chat/stream', {
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
  } catch (err: any) {
    if (params.signal?.aborted) return;
    params.onError(err?.message || 'Unable to connect to AI streaming service.');
    return;
  }

  // Guard against non-2xx responses (e.g. 400, 404, 500, 502)
  if (!response.ok) {
    let errMsg = `Server error: ${response.status}`;
    try {
      const raw = await response.text();
      const trimmed = raw.trim();
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          if (!trimmed.startsWith('<') && trimmed.length < 150) {
            errMsg = trimmed;
          }
        }
      }
    } catch {}
    params.onError(errMsg);
    return;
  }

  // Verify that the server returned an SSE stream
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('text/event-stream')) {
    try {
      const rawText = await response.text();
      let errMsg = 'The server did not return a valid stream.';
      try {
        const parsed = JSON.parse(rawText.trim());
        if (parsed?.error) errMsg = parsed.error;
      } catch {}
      params.onError(errMsg);
    } catch {
      params.onError('Unexpected response format from streaming endpoint.');
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    params.onError('Streaming response body is not readable.');
    return;
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
          if (!rawData) continue;

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
            console.warn('Skipping unparseable SSE chunk:', rawData, parseErr);
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
