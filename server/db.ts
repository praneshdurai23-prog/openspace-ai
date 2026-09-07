import fs from 'fs';
import path from 'path';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  passwordSalt?: string;
  provider: 'password' | 'google';
  avatar?: string;
  createdAt: number;
  lastLoginAt: number;
  resetToken?: string;
  resetTokenExpires?: number;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface StoredFile {
  id: string;
  conversationId: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl?: string; // Small files/images data URL
  createdAt: number;
}

export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: string;
  error?: string;
  attachments?: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    dataUrl?: string;
  }[];
  webSearchUsed?: boolean;
  searchQueries?: string[];
  groundingSources?: GroundingSource[];
  feedback?: 'like' | 'dislike' | null;
}

export interface StoredConversation {
  id: string;
  title: string;
  mode: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
  pinned?: boolean;
  archived?: boolean;
  projectId?: string;
  notes?: string;
  studyCards?: any[];
}

export interface StoredProject {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  notes?: string;
  conversationIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StoredMemory {
  id: string;
  content: string;
  category?: string;
  createdAt: number;
}

export interface StoredSharedChat {
  id: string;
  userId: string;
  conversationId: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
}

export interface StoredSettings {
  theme: 'light' | 'dark' | 'system';
  defaultMode: string;
  sendOnEnter: boolean;
  streamResponses: boolean;
  codeWrap: boolean;
  language?: 'english' | 'tamil' | 'tanglish';
  responseLength?: 'concise' | 'balanced' | 'comprehensive';
  responseStyle?: 'professional' | 'casual' | 'academic' | 'creative' | 'direct';
  fontSize?: 'small' | 'medium' | 'large';
  webSearchDefault?: boolean;
  simpleExplanationDefault?: boolean;
}

export interface UserStore {
  conversations: Record<string, StoredConversation>;
  files: Record<string, StoredFile>;
  settings: StoredSettings;
  projects: Record<string, StoredProject>;
  memories: Record<string, StoredMemory>;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  sessions: Record<string, StoredSession>;
  userStores: Record<string, UserStore>;
  sharedChats: Record<string, StoredSharedChat>;
}

const DEFAULT_SETTINGS: StoredSettings = {
  theme: 'dark',
  defaultMode: 'normal',
  sendOnEnter: true,
  streamResponses: true,
  codeWrap: false,
  language: 'english',
  responseLength: 'balanced',
  responseStyle: 'professional',
  fontSize: 'medium',
  webSearchDefault: false,
  simpleExplanationDefault: false,
};

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'openspace-db.json');
const LEGACY_DB_FILE = path.join(DB_DIR, 'myai-db.json');
const GUEST_USER_ID = 'guest';

class Database {
  private data: DatabaseSchema = {
    users: {},
    sessions: {},
    userStores: {},
    sharedChats: {},
  };
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      const fileToLoad = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(LEGACY_DB_FILE) ? LEGACY_DB_FILE : null);

      if (fileToLoad) {
        const raw = fs.readFileSync(fileToLoad, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migrate legacy flat structure to multi-tenant structure if needed
        const userStores: Record<string, UserStore> = parsed.userStores || {};
        if (!userStores[GUEST_USER_ID] && (parsed.conversations || parsed.projects || parsed.memories)) {
          userStores[GUEST_USER_ID] = {
            conversations: parsed.conversations || {},
            files: parsed.files || {},
            settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
            projects: parsed.projects || {},
            memories: parsed.memories || {},
          };
        }

        this.data = {
          users: parsed.users || {},
          sessions: parsed.sessions || {},
          userStores,
          sharedChats: parsed.sharedChats || {},
        };

        // Sanitize any conversations with undefined or missing IDs
        for (const store of Object.values(this.data.userStores)) {
          if (store.conversations) {
            if (store.conversations['undefined']) {
              delete store.conversations['undefined'];
            }
            for (const [k, c] of Object.entries(store.conversations)) {
              if (!c.id || c.id === 'undefined') {
                c.id = k !== 'undefined' ? k : `conv_${c.createdAt || Date.now()}`;
              }
            }
          }
        }
      } else {
        this.saveSync();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize database, using in-memory store:', err);
      this.isLoaded = true;
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 150);
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // ----------------------------------------------------
  // User Storage Scoping
  // ----------------------------------------------------
  public getUserStore(userId: string = GUEST_USER_ID): UserStore {
    const key = userId || GUEST_USER_ID;
    if (!this.data.userStores[key]) {
      this.data.userStores[key] = {
        conversations: {},
        files: {},
        settings: { ...DEFAULT_SETTINGS },
        projects: {},
        memories: {},
      };
      this.scheduleSave();
    }
    return this.data.userStores[key];
  }

  // ----------------------------------------------------
  // Users & Sessions
  // ----------------------------------------------------
  public createUser(user: StoredUser): StoredUser {
    this.data.users[user.id] = user;
    // Pre-initialize empty isolated workspace store for the user
    this.getUserStore(user.id);
    this.scheduleSave();
    return user;
  }

  public getUserById(id: string): StoredUser | null {
    return this.data.users[id] || null;
  }

  public getUserByEmail(email: string): StoredUser | null {
    const normalized = email.trim().toLowerCase();
    return (
      Object.values(this.data.users).find(
        (u) => u.email.trim().toLowerCase() === normalized
      ) || null
    );
  }

  public updateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
    const user = this.data.users[id];
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.data.users[id] = updated;
    this.scheduleSave();
    return updated;
  }

  public deleteUser(id: string): boolean {
    if (!this.data.users[id]) return false;
    delete this.data.users[id];
    this.scheduleSave();
    return true;
  }

  public createSession(session: StoredSession): void {
    this.data.sessions[session.token] = session;
    this.scheduleSave();
  }

  public getSession(token: string): StoredSession | null {
    return this.data.sessions[token] || null;
  }

  public deleteSession(token: string): boolean {
    if (!this.data.sessions[token]) return false;
    delete this.data.sessions[token];
    this.scheduleSave();
    return true;
  }

  public deleteUserSessions(userId: string): void {
    for (const [token, s] of Object.entries(this.data.sessions)) {
      if (s.userId === userId) {
        delete this.data.sessions[token];
      }
    }
    this.scheduleSave();
  }

  public deleteUserData(userId: string): void {
    if (this.data.userStores[userId]) {
      delete this.data.userStores[userId];
    }
    // Delete any shared chats created by this user
    for (const [shareId, share] of Object.entries(this.data.sharedChats)) {
      if (share.userId === userId) {
        delete this.data.sharedChats[shareId];
      }
    }
    this.scheduleSave();
  }

  public getUserStats(userId: string): {
    conversationCount: number;
    messageCount: number;
    fileCount: number;
    memoryCount: number;
    projectCount: number;
  } {
    const store = this.getUserStore(userId);
    const conversations = Object.values(store.conversations);
    const messageCount = conversations.reduce(
      (sum, c) => sum + (c.messages?.length || 0),
      0
    );

    return {
      conversationCount: conversations.length,
      messageCount,
      fileCount: Object.keys(store.files).length,
      memoryCount: Object.keys(store.memories).length,
      projectCount: Object.keys(store.projects).length,
    };
  }

  public exportUserData(userId: string): any {
    const user = this.getUserById(userId);
    const store = this.getUserStore(userId);
    return {
      exportedAt: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } : null,
      conversations: Object.values(store.conversations),
      projects: Object.values(store.projects),
      memories: Object.values(store.memories),
      settings: store.settings,
      filesMetadata: Object.values(store.files).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        createdAt: f.createdAt,
      })),
    };
  }

  // ----------------------------------------------------
  // Conversations (User-Scoped)
  // ----------------------------------------------------
  public getConversations(userId: string = GUEST_USER_ID): StoredConversation[] {
    const store = this.getUserStore(userId);
    return Object.entries(store.conversations)
      .filter(([key]) => key && key !== 'undefined')
      .map(([key, conv]) => {
        if (!conv.id || conv.id === 'undefined') {
          conv.id = key;
        }
        return conv;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getConversation(userId: string = GUEST_USER_ID, id: string): StoredConversation | null {
    if (!id || id === 'undefined') return null;
    const store = this.getUserStore(userId);
    return store.conversations[id] || null;
  }

  public createConversation(
    userId: string = GUEST_USER_ID,
    conv: {
      id?: string;
      title: string;
      mode: string;
      messages?: StoredMessage[];
    }
  ): StoredConversation {
    const store = this.getUserStore(userId);
    const now = Date.now();
    const validId =
      conv.id && conv.id !== 'undefined'
        ? conv.id
        : `conv_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const newConv: StoredConversation = {
      id: validId,
      title: conv.title || 'New Conversation',
      mode: conv.mode || 'normal',
      createdAt: now,
      updatedAt: now,
      messages: conv.messages || [],
    };
    store.conversations[validId] = newConv;
    this.scheduleSave();
    return newConv;
  }

  public updateConversation(
    userId: string = GUEST_USER_ID,
    id: string,
    updates: Partial<StoredConversation>
  ): StoredConversation | null {
    const store = this.getUserStore(userId);
    const conv = store.conversations[id];
    if (!conv) return null;

    const updated: StoredConversation = {
      ...conv,
      ...updates,
      updatedAt: Date.now(),
    };
    store.conversations[id] = updated;
    this.scheduleSave();
    return updated;
  }

  public deleteConversation(userId: string = GUEST_USER_ID, id: string): boolean {
    const store = this.getUserStore(userId);
    if (!store.conversations[id]) return false;
    delete store.conversations[id];

    // Clean up associated files in user's store
    for (const [fileId, file] of Object.entries(store.files)) {
      if (file.conversationId === id) {
        delete store.files[fileId];
      }
    }

    this.scheduleSave();
    return true;
  }

  public clearAllConversations(userId: string = GUEST_USER_ID): void {
    const store = this.getUserStore(userId);
    store.conversations = {};
    store.files = {};
    this.scheduleSave();
  }

  // ----------------------------------------------------
  // Messages (User-Scoped)
  // ----------------------------------------------------
  public addMessage(
    userId: string = GUEST_USER_ID,
    conversationId: string,
    message: StoredMessage
  ): StoredMessage | null {
    const store = this.getUserStore(userId);
    const validConvId =
      conversationId && conversationId !== 'undefined'
        ? conversationId
        : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let conv = store.conversations[validConvId];
    if (!conv) {
      conv = this.createConversation(userId, {
        id: validConvId,
        title: message.content.slice(0, 36) || 'New Conversation',
        mode: message.mode || 'normal',
      });
    }

    const existingIndex = conv.messages.findIndex((m) => m.id === message.id);
    if (existingIndex >= 0) {
      conv.messages[existingIndex] = message;
    } else {
      conv.messages.push(message);
    }

    conv.updatedAt = Date.now();
    this.scheduleSave();
    return message;
  }

  public updateMessage(
    userId: string = GUEST_USER_ID,
    conversationId: string,
    messageId: string,
    content: string
  ): boolean {
    const store = this.getUserStore(userId);
    const conv = store.conversations[conversationId];
    if (!conv) return false;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.content = content;
    conv.updatedAt = Date.now();
    this.scheduleSave();
    return true;
  }

  public updateMessageFeedback(
    userId: string = GUEST_USER_ID,
    conversationId: string,
    messageId: string,
    feedback: 'like' | 'dislike' | null
  ): boolean {
    const store = this.getUserStore(userId);
    const conv = store.conversations[conversationId];
    if (!conv) return false;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.feedback = feedback;
    conv.updatedAt = Date.now();
    this.scheduleSave();
    return true;
  }

  public deleteMessagesAfter(
    userId: string = GUEST_USER_ID,
    conversationId: string,
    messageId: string
  ): boolean {
    const store = this.getUserStore(userId);
    const conv = store.conversations[conversationId];
    if (!conv) return false;
    const index = conv.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return false;
    conv.messages = conv.messages.slice(0, index + 1);
    conv.updatedAt = Date.now();
    this.scheduleSave();
    return true;
  }

  // ----------------------------------------------------
  // Files (User-Scoped)
  // ----------------------------------------------------
  public saveFile(userId: string = GUEST_USER_ID, file: StoredFile): StoredFile {
    const store = this.getUserStore(userId);
    store.files[file.id] = file;
    this.scheduleSave();
    return file;
  }

  public getConversationFiles(userId: string = GUEST_USER_ID, conversationId: string): StoredFile[] {
    const store = this.getUserStore(userId);
    return Object.values(store.files).filter(
      (f) => f.conversationId === conversationId
    );
  }

  public getAllFiles(userId: string = GUEST_USER_ID): StoredFile[] {
    const store = this.getUserStore(userId);
    return Object.values(store.files).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getFile(userId: string = GUEST_USER_ID, id: string): StoredFile | null {
    const store = this.getUserStore(userId);
    return store.files[id] || null;
  }

  public deleteFile(userId: string = GUEST_USER_ID, id: string): boolean {
    const store = this.getUserStore(userId);
    if (!store.files[id]) return false;
    delete store.files[id];
    this.scheduleSave();
    return true;
  }

  // ----------------------------------------------------
  // Settings (User-Scoped)
  // ----------------------------------------------------
  public getSettings(userId: string = GUEST_USER_ID): StoredSettings {
    const store = this.getUserStore(userId);
    return { ...store.settings };
  }

  public updateSettings(userId: string = GUEST_USER_ID, updates: Partial<StoredSettings>): StoredSettings {
    const store = this.getUserStore(userId);
    store.settings = {
      ...store.settings,
      ...updates,
    };
    this.scheduleSave();
    return { ...store.settings };
  }

  // ----------------------------------------------------
  // Projects (User-Scoped)
  // ----------------------------------------------------
  public getProjects(userId: string = GUEST_USER_ID): StoredProject[] {
    const store = this.getUserStore(userId);
    return Object.values(store.projects).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getProject(userId: string = GUEST_USER_ID, id: string): StoredProject | null {
    const store = this.getUserStore(userId);
    return store.projects[id] || null;
  }

  public createProject(
    userId: string = GUEST_USER_ID,
    project: {
      id?: string;
      name: string;
      description?: string;
      instructions?: string;
      notes?: string;
      conversationIds?: string[];
    }
  ): StoredProject {
    const store = this.getUserStore(userId);
    const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newProj: StoredProject = {
      id,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      instructions: project.instructions || '',
      notes: project.notes || '',
      conversationIds: project.conversationIds || [],
      createdAt: now,
      updatedAt: now,
    };
    store.projects[id] = newProj;
    this.scheduleSave();
    return newProj;
  }

  public updateProject(
    userId: string = GUEST_USER_ID,
    id: string,
    updates: Partial<StoredProject>
  ): StoredProject | null {
    const store = this.getUserStore(userId);
    const proj = store.projects[id];
    if (!proj) return null;
    const updated: StoredProject = {
      ...proj,
      ...updates,
      updatedAt: Date.now(),
    };
    store.projects[id] = updated;
    this.scheduleSave();
    return updated;
  }

  public deleteProject(userId: string = GUEST_USER_ID, id: string): boolean {
    const store = this.getUserStore(userId);
    if (!store.projects[id]) return false;
    delete store.projects[id];
    for (const conv of Object.values(store.conversations)) {
      if (conv.projectId === id) {
        conv.projectId = undefined;
      }
    }
    this.scheduleSave();
    return true;
  }

  // ----------------------------------------------------
  // Memories (User-Scoped)
  // ----------------------------------------------------
  public getMemories(userId: string = GUEST_USER_ID): StoredMemory[] {
    const store = this.getUserStore(userId);
    return Object.values(store.memories).sort((a, b) => b.createdAt - a.createdAt);
  }

  public addMemory(userId: string = GUEST_USER_ID, content: string, category?: string): StoredMemory {
    const store = this.getUserStore(userId);
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMemory: StoredMemory = {
      id,
      content: content.trim(),
      category: category || 'preference',
      createdAt: Date.now(),
    };
    store.memories[id] = newMemory;
    this.scheduleSave();
    return newMemory;
  }

  public deleteMemory(userId: string = GUEST_USER_ID, id: string): boolean {
    const store = this.getUserStore(userId);
    if (!store.memories[id]) return false;
    delete store.memories[id];
    this.scheduleSave();
    return true;
  }

  public clearAllMemories(userId: string = GUEST_USER_ID): void {
    const store = this.getUserStore(userId);
    store.memories = {};
    this.scheduleSave();
  }

  // ----------------------------------------------------
  // Shared Chats (Public link by ID, references creator)
  // ----------------------------------------------------
  public getSharedChat(id: string): StoredSharedChat | null {
    return this.data.sharedChats[id] || null;
  }

  public createSharedChat(userId: string = GUEST_USER_ID, conversationId: string): StoredSharedChat | null {
    const store = this.getUserStore(userId);
    const conv = store.conversations[conversationId];
    if (!conv) return null;
    const id = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shared: StoredSharedChat = {
      id,
      userId,
      conversationId,
      title: conv.title,
      messages: conv.messages,
      createdAt: Date.now(),
    };
    this.data.sharedChats[id] = shared;
    this.scheduleSave();
    return shared;
  }

  public deleteSharedChat(id: string): boolean {
    if (!this.data.sharedChats[id]) return false;
    delete this.data.sharedChats[id];
    this.scheduleSave();
    return true;
  }
}

export const db = new Database();
