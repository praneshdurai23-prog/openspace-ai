import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { db, StoredUser } from './server/db.ts';
import { authService, sanitizeUser } from './server/auth.ts';
import { geminiProvider, extractFriendlyErrorMessage, AIMode } from './server/geminiService.ts';
import { rateLimiter } from './server/rateLimiter.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Normalize URL paths if routed to serverless function without /api prefix
if (process.env.VERCEL) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });
}

// Body parsers with generous limits for inline file attachments (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Apply rate limiter to API routes
app.use('/api', rateLimiter);

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------

export interface AuthenticatedRequest extends Request {
  user?: StoredUser | null;
  userId: string;
}

const getAuthUserFromRequest = (req: Request): StoredUser | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return authService.validateToken(token);
};

// Global context middleware for /api routes: attaches req.userId (authenticated user or 'guest')
app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
  const user = getAuthUserFromRequest(req);
  (req as AuthenticatedRequest).user = user;
  (req as AuthenticatedRequest).userId = user ? user.id : 'guest';
  next();
});

// Middleware for routes that strictly require authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
};

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Register new user (Email + Password) - supports both /register and /signup
const handleRegister = (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    const { user, token } = authService.register(email, password, name);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
};

app.post('/api/auth/register', handleRegister);
app.post('/api/auth/signup', handleRegister);

// Login (Email + Password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const { user, token } = authService.login(email, password);
    res.json({ user, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid email or password' });
  }
});

// Google Sign-In
app.post('/api/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Google email is required' });
      return;
    }
    const { user, token, isNewUser } = authService.googleLogin(email, name, avatar);
    res.json({ user, token, isNewUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Google sign-in failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      authService.logout(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout error' });
  }
});

// Get Current User Profile & Workspace Stats
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user!;
  const stats = db.getUserStats(user.id);
  res.json({
    user: sanitizeUser(user),
    stats,
  });
});

// Update Profile (Name / Avatar)
app.patch('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, avatar } = req.body;
    const updated = authService.updateProfile(userId, { name, avatar });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile' });
  }
});

// Change Password
app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    authService.changePassword(userId, currentPassword || '', newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password' });
  }
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = authService.requestPasswordReset(email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process request' });
  }
});

// Reset Password with code/token
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required' });
      return;
    }
    authService.resetPassword(email, token, newPassword);
    res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
});

// Export all user data as JSON
app.get('/api/auth/export-data', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const exportData = db.exportUserData(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=openspace-data-export-${userId}.json`);
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// Delete Account permanently
app.delete('/api/auth/account', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { password } = req.body;
    authService.deleteAccount(userId, password);
    res.json({ success: true, message: 'Account and all associated data permanently deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete account' });
  }
});

// ----------------------------------------------------
// WORKSPACE DATA ROUTES (USER-SCOPED)
// ----------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    name: 'OpenSpace AI',
    displayName: 'OpenSpace',
    tagline: 'Your AI. Your Space.',
    creator: 'Pranesh',
    geminiConfigured: hasKey,
  });
});

// Conversations CRUD
app.get('/api/conversations', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const list = db.getConversations(userId);
    res.json({ conversations: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

app.post('/api/conversations', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { title, mode, messages } = req.body;
    const id = req.body.id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const conv = db.createConversation(userId, { id, title, mode, messages });
    res.json({ conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const conv = db.getConversation(userId, req.params.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const updated = db.updateConversation(userId, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const success = db.deleteConversation(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

app.delete('/api/conversations', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    db.clearAllConversations(userId);
    res.json({ success: true, message: 'All conversations cleared' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear conversations' });
  }
});

// Settings API
app.get('/api/settings', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const settings = db.getSettings(userId);
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.post('/api/settings', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const updated = db.updateSettings(userId, req.body);
    res.json({ settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// File upload / validation API
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { conversationId, file } = req.body;
    if (!conversationId || !file) {
      res.status(400).json({ error: 'Missing conversationId or file' });
      return;
    }

    // Check maximum 15 files per conversation constraint
    const existingFiles = db.getConversationFiles(userId, conversationId);
    if (existingFiles.length >= 15) {
      res.status(400).json({ error: 'Maximum 15 files per conversation allowed.' });
      return;
    }

    // Size limit check (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds maximum 10MB limit.' });
      return;
    }

    // Validate mime type
    const allowedPrefixes = [
      'image/',
      'text/',
      'application/pdf',
      'application/json',
      'application/javascript',
      'application/typescript',
      'application/xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
    ];
    const isAllowed =
      allowedPrefixes.some((p) => file.mimeType.startsWith(p)) ||
      file.name.match(/\.(md|ts|tsx|js|jsx|json|py|html|css|txt|csv|pdf|docx|doc)$/i);

    if (!isAllowed) {
      res.status(400).json({
        error: 'Unsupported file type. Supported types include PDF, DOCX, CSV, TXT, code files, and images (PNG, JPG, WebP).',
      });
      return;
    }

    const savedFile = db.saveFile(userId, {
      id: file.id || `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      dataUrl: file.dataUrl,
      createdAt: Date.now(),
    });

    res.json({ file: savedFile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get files for a conversation (User-Scoped)
app.get('/api/conversations/:id/files', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const files = db.getConversationFiles(userId, req.params.id);
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversation files' });
  }
});

// Get all files for the user (User-Scoped)
app.get('/api/files', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const files = db.getAllFiles(userId);
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Delete file (User-Scoped)
app.delete('/api/files/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const success = db.deleteFile(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Message feedback API (Like / Dislike)
app.post('/api/messages/:id/feedback', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { conversationId, feedback } = req.body;
    const messageId = req.params.id;
    if (!conversationId || !messageId) {
      res.status(400).json({ error: 'conversationId and messageId are required' });
      return;
    }
    const success = db.updateMessageFeedback(userId, conversationId, messageId, feedback);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Projects API
app.get('/api/projects', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const projects = db.getProjects(userId);
    res.json({ projects });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

app.post('/api/projects', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, description, instructions, notes, conversationIds } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }
    const project = db.createProject(userId, { name, description, instructions, notes, conversationIds });
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const project = db.getProject(userId, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve project' });
  }
});

app.patch('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const updated = db.updateProject(userId, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ project: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const success = db.deleteProject(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Smart Memory API
app.get('/api/memories', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const memories = db.getMemories(userId);
    res.json({ memories });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

app.post('/api/memories', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { content, category } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Memory content is required' });
      return;
    }
    const memory = db.addMemory(userId, content, category);
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save memory' });
  }
});

app.delete('/api/memories/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const success = db.deleteMemory(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

app.post('/api/memories/clear', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    db.clearAllMemories(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear memories' });
  }
});

// Share Chat API
app.post('/api/share', (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { conversationId } = req.body;
    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }
    const shared = db.createSharedChat(userId, conversationId);
    if (!shared) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ sharedChat: shared });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to share chat' });
  }
});

app.get('/api/share/:id', (req: Request, res: Response) => {
  try {
    const shared = db.getSharedChat(req.params.id);
    if (!shared) {
      res.status(404).json({ error: 'Shared conversation not found' });
      return;
    }
    res.json({ sharedChat: shared });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve shared chat' });
  }
});

app.delete('/api/share/:id', (_req: Request, res: Response) => {
  try {
    const success = db.deleteSharedChat(_req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Shared conversation not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete shared chat' });
  }
});

// AI Canvas Action API
app.post('/api/ai/canvas', async (req: Request, res: Response) => {
  try {
    const { action, text, customPrompt, tone } = req.body;
    if (!text && !customPrompt) {
      res.status(400).json({ error: 'Text or custom prompt is required' });
      return;
    }
    const result = await geminiProvider.executeCanvasAction({
      action: action || 'rewrite',
      text: text || '',
      customPrompt,
      tone,
    });
    res.json({ result });
  } catch (err: any) {
    const friendly = extractFriendlyErrorMessage(err);
    res.status(500).json({ error: friendly });
  }
});

// Streaming Chat API via Server-Sent Events (SSE)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;
  const {
    conversationId,
    messageId,
    assistantMessageId,
    mode = 'normal',
    message,
    history = [],
    attachments = [],
    webSearch = false,
    personalization,
    difficulty,
    projectId,
    simpleExplanationMode = false,
  } = req.body;

  if (!message && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'Message or attachment is required.' });
    return;
  }

  // Set up SSE headers with immediate flushing and anti-buffering
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'none',
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const asstMsgId = assistantMessageId || `asst_${Date.now()}`;
  // Send immediate stream handshake so the client UI shows typing state in 0ms
  res.write(': ping\n\n');
  sendEvent('start', { id: asstMsgId });

  const abortController = new AbortController();

  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  // Fetch project context if conversation belongs to a project
  let projectContext: { name: string; description?: string; instructions?: string; notes?: string } | undefined;
  if (projectId) {
    const proj = db.getProject(userId, projectId);
    if (proj) {
      projectContext = {
        name: proj.name,
        description: proj.description,
        instructions: proj.instructions,
        notes: proj.notes,
      };
    }
  }

  // Fetch stored user memories for personalization
  const storedMemories = db.getMemories(userId).map((m) => m.content);

  // Ensure a valid conversation ID exists
  const targetConvId =
    conversationId && conversationId !== 'undefined'
      ? conversationId
      : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Store user message in DB
  const userMsgId = messageId || `user_${Date.now()}`;
  db.addMessage(userId, targetConvId, {
    id: userMsgId,
    role: 'user',
    content: message || '',
    timestamp: Date.now(),
    mode: mode as AIMode,
    attachments: attachments.map((a: any) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      mimeType: a.mimeType,
      dataUrl: a.dataUrl,
    })),
  });

  // Automatically update conversation title if it is the first user message
  const conv = db.getConversation(userId, conversationId);
  if (conv && (!conv.title || conv.title === 'New Conversation' || conv.messages.length <= 1)) {
    const rawTitle = message || attachments?.[0]?.name || 'Chat';
    const cleanTitle = rawTitle.slice(0, 40).trim() + (rawTitle.length > 40 ? '...' : '');
    db.updateConversation(userId, conversationId, { title: cleanTitle, mode: mode as AIMode, projectId });
    sendEvent('title', { title: cleanTitle });
  }

  let fullAssistantText = '';

  try {
    const result = await geminiProvider.streamResponse({
      mode: mode as AIMode,
      history,
      message,
      attachments,
      webSearch,
      personalization,
      difficulty,
      memories: storedMemories,
      projectContext,
      simpleExplanationMode,
      signal: abortController.signal,
      onChunk: (chunk: string) => {
        fullAssistantText += chunk;
        sendEvent('chunk', { text: chunk });
      },
      onGrounding: (groundingData) => {
        sendEvent('grounding', groundingData);
      },
    });

    // Save assistant message in DB with grounding sources and webSearch indicator
    db.addMessage(userId, targetConvId, {
      id: asstMsgId,
      role: 'assistant',
      content: fullAssistantText || result.text,
      timestamp: Date.now(),
      mode: mode as AIMode,
      webSearchUsed: result.webSearchUsed,
      searchQueries: result.searchQueries,
      groundingSources: result.groundingSources,
    });

    sendEvent('done', {
      id: asstMsgId,
      content: fullAssistantText || result.text,
      webSearchUsed: result.webSearchUsed,
      searchQueries: result.searchQueries,
      groundingSources: result.groundingSources,
    });
    res.end();
  } catch (err: any) {
    const friendlyError = extractFriendlyErrorMessage(err);
    console.error('Streaming handler error:', friendlyError);

    // Save error message to DB so conversation remains consistent
    db.addMessage(userId, targetConvId, {
      id: asstMsgId,
      role: 'assistant',
      content: fullAssistantText,
      timestamp: Date.now(),
      mode: mode as AIMode,
      error: friendlyError,
    });

    sendEvent('error', { error: friendlyError, id: asstMsgId });
    res.end();
  }
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------

// Ensure unhandled /api/* routes always return JSON 404, NEVER HTML
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpenSpace AI server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
