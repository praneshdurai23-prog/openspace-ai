// server.ts
import express from "express";
import path2 from "path";
import dotenv from "dotenv";

// server/db.ts
import fs from "fs";
import path from "path";
var DEFAULT_SETTINGS = {
  theme: "dark",
  defaultMode: "normal",
  sendOnEnter: true,
  streamResponses: true,
  codeWrap: false,
  language: "english",
  responseLength: "balanced",
  responseStyle: "professional",
  fontSize: "medium",
  webSearchDefault: false,
  simpleExplanationDefault: false
};
var DB_DIR = process.env.VERCEL ? path.join("/tmp", "openspace-data") : path.join(process.cwd(), "data");
var DB_FILE = path.join(DB_DIR, "openspace-db.json");
var LEGACY_DB_FILE = path.join(DB_DIR, "myai-db.json");
var GUEST_USER_ID = "guest";
var Database = class {
  constructor() {
    this.data = {
      users: {},
      sessions: {},
      userStores: {},
      sharedChats: {}
    };
    this.isLoaded = false;
    this.saveTimeout = null;
    this.init();
  }
  init() {
    try {
      let fileToLoad = null;
      try {
        if (!fs.existsSync(DB_DIR)) {
          fs.mkdirSync(DB_DIR, { recursive: true });
        }
        fileToLoad = fs.existsSync(DB_FILE) ? DB_FILE : fs.existsSync(LEGACY_DB_FILE) ? LEGACY_DB_FILE : null;
      } catch (fsErr) {
        console.warn("Database directory access warning (using in-memory fallback if needed):", fsErr);
      }
      if (fileToLoad) {
        const raw = fs.readFileSync(fileToLoad, "utf-8");
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (parseErr) {
          console.warn("Database file contained invalid JSON, starting fresh in-memory:", parseErr);
        }
        if (parsed) {
          const userStores = parsed.userStores || {};
          if (!userStores[GUEST_USER_ID] && (parsed.conversations || parsed.projects || parsed.memories)) {
            userStores[GUEST_USER_ID] = {
              conversations: parsed.conversations || {},
              files: parsed.files || {},
              settings: { ...DEFAULT_SETTINGS, ...parsed.settings || {} },
              projects: parsed.projects || {},
              memories: parsed.memories || {}
            };
          }
          this.data = {
            users: parsed.users || {},
            sessions: parsed.sessions || {},
            userStores,
            sharedChats: parsed.sharedChats || {}
          };
          for (const store of Object.values(this.data.userStores)) {
            if (store.conversations) {
              if (store.conversations["undefined"]) {
                delete store.conversations["undefined"];
              }
              for (const [k, c] of Object.entries(store.conversations)) {
                if (!c.id || c.id === "undefined") {
                  c.id = k !== "undefined" ? k : `conv_${c.createdAt || Date.now()}`;
                }
              }
            }
          }
        }
      } else {
        this.saveSync();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error("Failed to initialize database, using in-memory store:", err);
      this.isLoaded = true;
    }
  }
  scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 150);
  }
  saveSync() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error("Error saving database to file:", err);
    }
  }
  // ----------------------------------------------------
  // User Storage Scoping
  // ----------------------------------------------------
  getUserStore(userId = GUEST_USER_ID) {
    const key = userId || GUEST_USER_ID;
    if (!this.data.userStores[key]) {
      this.data.userStores[key] = {
        conversations: {},
        files: {},
        settings: { ...DEFAULT_SETTINGS },
        projects: {},
        memories: {}
      };
      this.scheduleSave();
    }
    return this.data.userStores[key];
  }
  // ----------------------------------------------------
  // Users & Sessions
  // ----------------------------------------------------
  createUser(user) {
    this.data.users[user.id] = user;
    this.getUserStore(user.id);
    this.scheduleSave();
    return user;
  }
  getUserById(id) {
    return this.data.users[id] || null;
  }
  getUserByEmail(email) {
    const normalized = email.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) => u.email.trim().toLowerCase() === normalized
    ) || null;
  }
  updateUser(id, updates) {
    const user = this.data.users[id];
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.data.users[id] = updated;
    this.scheduleSave();
    return updated;
  }
  deleteUser(id) {
    if (!this.data.users[id]) return false;
    delete this.data.users[id];
    this.scheduleSave();
    return true;
  }
  createSession(session) {
    this.data.sessions[session.token] = session;
    this.scheduleSave();
  }
  getSession(token) {
    return this.data.sessions[token] || null;
  }
  deleteSession(token) {
    if (!this.data.sessions[token]) return false;
    delete this.data.sessions[token];
    this.scheduleSave();
    return true;
  }
  deleteUserSessions(userId) {
    for (const [token, s] of Object.entries(this.data.sessions)) {
      if (s.userId === userId) {
        delete this.data.sessions[token];
      }
    }
    this.scheduleSave();
  }
  deleteUserData(userId) {
    if (this.data.userStores[userId]) {
      delete this.data.userStores[userId];
    }
    for (const [shareId, share] of Object.entries(this.data.sharedChats)) {
      if (share.userId === userId) {
        delete this.data.sharedChats[shareId];
      }
    }
    this.scheduleSave();
  }
  getUserStats(userId) {
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
      projectCount: Object.keys(store.projects).length
    };
  }
  exportUserData(userId) {
    const user = this.getUserById(userId);
    const store = this.getUserStore(userId);
    return {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
        createdAt: f.createdAt
      }))
    };
  }
  // ----------------------------------------------------
  // Conversations (User-Scoped)
  // ----------------------------------------------------
  getConversations(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    return Object.entries(store.conversations).filter(([key]) => key && key !== "undefined").map(([key, conv]) => {
      if (!conv.id || conv.id === "undefined") {
        conv.id = key;
      }
      return conv;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  getConversation(userId = GUEST_USER_ID, id) {
    if (!id || id === "undefined") return null;
    const store = this.getUserStore(userId);
    return store.conversations[id] || null;
  }
  createConversation(userId = GUEST_USER_ID, conv) {
    const store = this.getUserStore(userId);
    const now = Date.now();
    const validId = conv.id && conv.id !== "undefined" ? conv.id : `conv_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const newConv = {
      id: validId,
      title: conv.title || "New Conversation",
      mode: conv.mode || "normal",
      createdAt: now,
      updatedAt: now,
      messages: conv.messages || []
    };
    store.conversations[validId] = newConv;
    this.scheduleSave();
    return newConv;
  }
  updateConversation(userId = GUEST_USER_ID, id, updates) {
    const store = this.getUserStore(userId);
    const conv = store.conversations[id];
    if (!conv) return null;
    const updated = {
      ...conv,
      ...updates,
      updatedAt: Date.now()
    };
    store.conversations[id] = updated;
    this.scheduleSave();
    return updated;
  }
  deleteConversation(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    if (!store.conversations[id]) return false;
    delete store.conversations[id];
    for (const [fileId, file] of Object.entries(store.files)) {
      if (file.conversationId === id) {
        delete store.files[fileId];
      }
    }
    this.scheduleSave();
    return true;
  }
  clearAllConversations(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    store.conversations = {};
    store.files = {};
    this.scheduleSave();
  }
  // ----------------------------------------------------
  // Messages (User-Scoped)
  // ----------------------------------------------------
  addMessage(userId = GUEST_USER_ID, conversationId, message) {
    const store = this.getUserStore(userId);
    const validConvId = conversationId && conversationId !== "undefined" ? conversationId : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let conv = store.conversations[validConvId];
    if (!conv) {
      conv = this.createConversation(userId, {
        id: validConvId,
        title: message.content.slice(0, 36) || "New Conversation",
        mode: message.mode || "normal"
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
  updateMessage(userId = GUEST_USER_ID, conversationId, messageId, content) {
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
  updateMessageFeedback(userId = GUEST_USER_ID, conversationId, messageId, feedback) {
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
  deleteMessagesAfter(userId = GUEST_USER_ID, conversationId, messageId) {
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
  saveFile(userId = GUEST_USER_ID, file) {
    const store = this.getUserStore(userId);
    store.files[file.id] = file;
    this.scheduleSave();
    return file;
  }
  getConversationFiles(userId = GUEST_USER_ID, conversationId) {
    const store = this.getUserStore(userId);
    return Object.values(store.files).filter(
      (f) => f.conversationId === conversationId
    );
  }
  getAllFiles(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    return Object.values(store.files).sort((a, b) => b.createdAt - a.createdAt);
  }
  getFile(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    return store.files[id] || null;
  }
  deleteFile(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    if (!store.files[id]) return false;
    delete store.files[id];
    this.scheduleSave();
    return true;
  }
  // ----------------------------------------------------
  // Settings (User-Scoped)
  // ----------------------------------------------------
  getSettings(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    return { ...store.settings };
  }
  updateSettings(userId = GUEST_USER_ID, updates) {
    const store = this.getUserStore(userId);
    store.settings = {
      ...store.settings,
      ...updates
    };
    this.scheduleSave();
    return { ...store.settings };
  }
  // ----------------------------------------------------
  // Projects (User-Scoped)
  // ----------------------------------------------------
  getProjects(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    return Object.values(store.projects).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  getProject(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    return store.projects[id] || null;
  }
  createProject(userId = GUEST_USER_ID, project) {
    const store = this.getUserStore(userId);
    const id = project.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newProj = {
      id,
      name: project.name || "Untitled Project",
      description: project.description || "",
      instructions: project.instructions || "",
      notes: project.notes || "",
      conversationIds: project.conversationIds || [],
      createdAt: now,
      updatedAt: now
    };
    store.projects[id] = newProj;
    this.scheduleSave();
    return newProj;
  }
  updateProject(userId = GUEST_USER_ID, id, updates) {
    const store = this.getUserStore(userId);
    const proj = store.projects[id];
    if (!proj) return null;
    const updated = {
      ...proj,
      ...updates,
      updatedAt: Date.now()
    };
    store.projects[id] = updated;
    this.scheduleSave();
    return updated;
  }
  deleteProject(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    if (!store.projects[id]) return false;
    delete store.projects[id];
    for (const conv of Object.values(store.conversations)) {
      if (conv.projectId === id) {
        conv.projectId = void 0;
      }
    }
    this.scheduleSave();
    return true;
  }
  // ----------------------------------------------------
  // Memories (User-Scoped)
  // ----------------------------------------------------
  getMemories(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    return Object.values(store.memories).sort((a, b) => b.createdAt - a.createdAt);
  }
  addMemory(userId = GUEST_USER_ID, content, category) {
    const store = this.getUserStore(userId);
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMemory = {
      id,
      content: content.trim(),
      category: category || "preference",
      createdAt: Date.now()
    };
    store.memories[id] = newMemory;
    this.scheduleSave();
    return newMemory;
  }
  deleteMemory(userId = GUEST_USER_ID, id) {
    const store = this.getUserStore(userId);
    if (!store.memories[id]) return false;
    delete store.memories[id];
    this.scheduleSave();
    return true;
  }
  clearAllMemories(userId = GUEST_USER_ID) {
    const store = this.getUserStore(userId);
    store.memories = {};
    this.scheduleSave();
  }
  // ----------------------------------------------------
  // Shared Chats (Public link by ID, references creator)
  // ----------------------------------------------------
  getSharedChat(id) {
    return this.data.sharedChats[id] || null;
  }
  createSharedChat(userId = GUEST_USER_ID, conversationId) {
    const store = this.getUserStore(userId);
    const conv = store.conversations[conversationId];
    if (!conv) return null;
    const id = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shared = {
      id,
      userId,
      conversationId,
      title: conv.title,
      messages: conv.messages,
      createdAt: Date.now()
    };
    this.data.sharedChats[id] = shared;
    this.scheduleSave();
    return shared;
  }
  deleteSharedChat(id) {
    if (!this.data.sharedChats[id]) return false;
    delete this.data.sharedChats[id];
    this.scheduleSave();
    return true;
  }
};
var db = new Database();

// server/auth.ts
import crypto from "crypto";
var SESSION_EXPIRY_DAYS = 30;
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}
function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}
function generateResetCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}
var AuthService = class {
  register(email, password, name) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Please provide a valid email address");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!name || !name.trim()) {
      throw new Error("Name is required");
    }
    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please log in.");
    }
    const { hash, salt } = hashPassword(password);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = Date.now();
    const newUser = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      provider: "password",
      createdAt: now,
      lastLoginAt: now
    };
    db.createUser(newUser);
    const token = generateSecureToken();
    const session = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1e3
    };
    db.createSession(session);
    return {
      user: sanitizeUser(newUser),
      token
    };
  }
  login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    if (user.provider === "google" && !user.passwordHash) {
      throw new Error("This account was registered with Google. Please use Google Sign-In.");
    }
    if (!user.passwordHash || !user.passwordSalt) {
      throw new Error("Invalid account credentials");
    }
    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }
    const now = Date.now();
    db.updateUser(user.id, { lastLoginAt: now });
    const token = generateSecureToken();
    const session = {
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1e3
    };
    db.createSession(session);
    return {
      user: sanitizeUser(user),
      token
    };
  }
  googleLogin(email, name, avatar) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Valid Google email is required");
    }
    let user = db.getUserByEmail(normalizedEmail);
    let isNewUser = false;
    const now = Date.now();
    if (!user) {
      isNewUser = true;
      const userId = `usr_g_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const defaultName = name?.trim() || normalizedEmail.split("@")[0];
      user = {
        id: userId,
        email: normalizedEmail,
        name: defaultName,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
        provider: "google",
        createdAt: now,
        lastLoginAt: now
      };
      db.createUser(user);
    } else {
      db.updateUser(user.id, {
        lastLoginAt: now,
        avatar: avatar || user.avatar,
        name: name?.trim() || user.name
      });
      user = db.getUserById(user.id);
    }
    const token = generateSecureToken();
    const session = {
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1e3
    };
    db.createSession(session);
    return {
      user: sanitizeUser(user),
      token,
      isNewUser
    };
  }
  validateToken(token) {
    if (!token) return null;
    const session = db.getSession(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      db.deleteSession(token);
      return null;
    }
    const user = db.getUserById(session.userId);
    if (!user) {
      db.deleteSession(token);
      return null;
    }
    return user;
  }
  logout(token) {
    return db.deleteSession(token);
  }
  requestPasswordReset(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      return {
        resetToken: generateResetCode(),
        message: "If an account exists with this email, password reset instructions have been generated."
      };
    }
    const resetToken = generateResetCode();
    const expires = Date.now() + 60 * 60 * 1e3;
    db.updateUser(user.id, {
      resetToken,
      resetTokenExpires: expires
    });
    return {
      resetToken,
      message: "Password reset code generated successfully. Use this code to reset your password."
    };
  }
  resetPassword(email, token, newPassword) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Account not found");
    }
    if (!user.resetToken || user.resetToken !== token.trim()) {
      throw new Error("Invalid or expired reset code");
    }
    if (!user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
      throw new Error("Reset code has expired. Please request a new one.");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }
    const { hash, salt } = hashPassword(newPassword);
    db.updateUser(user.id, {
      passwordHash: hash,
      passwordSalt: salt,
      resetToken: void 0,
      resetTokenExpires: void 0,
      provider: "password"
      // if was google, now has password too
    });
    db.deleteUserSessions(user.id);
    return true;
  }
  changePassword(userId, currentPass, newPass) {
    const user = db.getUserById(userId);
    if (!user) throw new Error("User not found");
    if (user.passwordHash && user.passwordSalt) {
      const isValid = verifyPassword(currentPass, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        throw new Error("Current password does not match");
      }
    }
    if (!newPass || newPass.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }
    const { hash, salt } = hashPassword(newPass);
    db.updateUser(userId, {
      passwordHash: hash,
      passwordSalt: salt
    });
    return true;
  }
  updateProfile(userId, updates) {
    const user = db.getUserById(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = db.updateUser(userId, {
      name: updates.name?.trim() || user.name,
      avatar: updates.avatar !== void 0 ? updates.avatar : user.avatar
    });
    return sanitizeUser(updatedUser);
  }
  deleteAccount(userId, password) {
    const user = db.getUserById(userId);
    if (!user) throw new Error("User not found");
    if (user.provider === "password" && user.passwordHash && user.passwordSalt && password) {
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        throw new Error("Incorrect password. Account deletion aborted.");
      }
    }
    db.deleteUserSessions(userId);
    db.deleteUserData(userId);
    db.deleteUser(userId);
    return true;
  }
};
var authService = new AuthService();

// server/geminiService.ts
import { GoogleGenAI } from "@google/genai";
var CREATOR_ATTRIBUTION_RULE = `
CRITICAL CREATOR ATTRIBUTION MANDATE:
OpenSpace AI was created by Pranesh.
If the user asks who created, founded, made, built, developed, designed, or is the creator/founder of OpenSpace AI (or OpenSpace), you MUST answer:
"OpenSpace AI was created by Pranesh."
IMPORTANT CONSTRAINT: Do NOT claim that Pranesh created or founded Gemini, Google, OpenAI, ChatGPT, Claude, Anthropic, or any other third-party technology or company. This attribution applies strictly and exclusively to OpenSpace AI.
`;
var SIMPLE_EXPLANATION_ENGINE_RULES = `
=== CORE SIMPLE STEP-BY-STEP EXPLANATION ENGINE ===
You are powered by OpenSpace AI's signature Simple Step-by-Step Explanation Engine, designed by Pranesh.
Your goal is not only to give the correct answer, but to make the user UNDERSTAND the answer easily and know exactly what to do next.

WHEN TO APPLY:
Apply these principles whenever the user asks:
- "How do I...?", "How can I...?", "How to..."
- "Explain this...", "Teach me...", "Help me..."
- For instructions, how-to guides, concepts, tutorials, or troubleshooting;
- Or whenever Simple Explanation mode is active.

CORE RULES:
1. Beginner-Friendly: Use simple, clear language. Do not assume the user is already an expert. Start from the basics.
2. Avoid Jargon: Avoid unnecessary difficult or overly academic words. If a technical term is necessary, explain it briefly and simply.
3. Numbered Small Steps: Break tasks into numbered steps:
   Step 1
   Step 2
   Step 3
   Step 4
   Keep each step short, clear, and actionable.
4. What, How, Why: Explain WHAT to do, HOW to do it, and WHY it is needed when useful.
5. Recommended Method First: Give the easiest, most reliable method first before edge-case alternatives.
6. Simple Examples: Include a simple concrete example and show the "Expected Result" so the user knows what success looks like.
7. Concise Paragraphs: Avoid walls of text. Use bullet points and clear spacing.
8. Standard Guidance Structure (when appropriate):
   - What you need
   - Step 1 ...
   - Step 2 ...
   - Step 3 ...
   - Example
   - Expected result
9. For Troubleshooting:
   - Identify the likely problem clearly.
   - Give the easiest fix first.
   - Give secondary fixes if the first does not resolve it.
   - Explain how to verify that it is fixed.
10. For Coding:
   - Explain the concept simply.
   - Explain what the code does before showing it.
   - Provide the clean, formatted code block.
   - Explain the important parts of the code step-by-step.
11. For Study / Learning:
   - Explain the concept from fundamentals.
   - Give a relatable real-world example.
   - Provide a quick practice question when useful.
   - Gradually increase difficulty.
12. Multilingual Behavior:
   - If user asks in English: Answer in simple, articulate English.
   - If user asks in Tamil: Answer in simple, natural Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD).
   - If user asks in Tanglish: Answer naturally in Tanglish (Tamil in English script).
   - Automatically detect the user's language, and respect user requests for Simple English, Tamil, Tanglish, Detailed explanation, or Short answer.
`;
var SYSTEM_INSTRUCTIONS = {
  normal: `You are OpenSpace AI, an advanced personal intelligence workspace and assistant built with precision, clarity, and intelligence.
Your primary display name is OpenSpace, and your secondary name is OpenSpace AI.
Your tagline is "Your AI. Your Space."
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Provide direct, thoughtful, accurate, and comprehensive responses.
Use clean formatting: use Markdown headings, bold emphasis, tables, and organized lists where helpful.`,
  study: `You are OpenSpace AI in "Study" mode (Study Mode 2.0) - an exceptional, patient pedagogical tutor and interactive study mentor.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Break complex concepts down step-by-step from fundamental first principles.
2. Explain simply with relatable everyday analogies and intuitive mental models.
3. When requested for MCQs: generate high-yield multiple choice questions with options A, B, C, D and hidden/clear explanations.
4. When requested for Flashcards: generate clear study cards with front concept/question and back definition/answer.
5. When in Quiz Mode: provide interactive questions with hints, scoring, and instant self-check.
6. When in Revision Mode: provide high-yield cheat sheets, key formulas, bullet takeaways, and common pitfalls to avoid.
7. When asked to "Ask me questions": act as a supportive Socratic tutor, asking one thought-provoking question at a time and evaluating the user's answers.
8. Adapt explanations to the user's chosen difficulty level (Easy, Medium, or Hard).`,
  coding: `You are OpenSpace AI in "Coding" mode - an elite software engineer and systems architect.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Write production-ready, clean, idiomatic code with appropriate error handling and types.
2. Always wrap code in Markdown code blocks specifying the exact language identifier (e.g. \`\`\`typescript, \`\`\`python, \`\`\`json, \`\`\`html, \`\`\`bash).
3. Explain design choices, time/space complexity (Big-O), and architectural trade-offs.
4. For debugging, identify the root cause clearly first, then provide the corrected snippet.
5. Emphasize security, performance, clean code architecture, and best practices.`,
  writing: `You are OpenSpace AI in "Writing" mode - an articulate master editor, copywriter, and wordsmith.
${CREATOR_ATTRIBUTION_RULE}
Your approach:
1. Craft compelling, rhythmically varied prose tailored to the requested tone (executive, creative, academic, or persuasive).
2. Help users draft essays, professional emails, articles, speeches, scripts, and creative stories.
3. Offer concrete suggestions for pacing, vocabulary enhancement, and structural clarity.
4. Avoid fluff, passive voice clich\xE9s, and corporate filler phrases.`,
  file_analysis: `You are OpenSpace AI in "File Analysis" mode - a forensic multimodal document, data, and image analyst.
${CREATOR_ATTRIBUTION_RULE}
${SIMPLE_EXPLANATION_ENGINE_RULES}
Your approach:
1. Thoroughly inspect all provided attachments, images, diagrams, charts, tables, PDFs, and document contents.
2. Extract exact data points, code, architectural details, and textual quotes with high precision.
3. When analyzing diagrams, screenshots, or charts, break down the visual hierarchy, data trends, and key components systematically.
4. Synthesize findings into structured summaries with key takeaways and actionable insights.
5. Support comparisons across multiple files, table analysis, OCR text extraction, and specific detail lookups.`
};
var genAIClient = null;
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
function isDirectCreatorQuestion(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim().replace(/[?!.,]/g, "");
  const exactPatterns = [
    /who\s+(created|founded|made|built|developed|designed|is the creator of|is the founder of)\s+(openspace\s*ai|openspace|myai|my\s*ai|this\s*ai|this\s*app|you)/i,
    /who\s+is\s+(the\s+creator\s+of|the\s+founder\s+of|your\s+creator|your\s+founder)\s*(openspace\s*ai|openspace|myai|my\s*ai)?/i,
    /who\s+are\s+you\s+created\s+by/i,
    /who\s+started\s+(openspace\s*ai|openspace|myai|my\s*ai)/i,
    /who\s+owns\s+(openspace\s*ai|openspace|myai|my\s*ai)/i
  ];
  return exactPatterns.some((pattern) => pattern.test(clean));
}
function extractFriendlyErrorMessage(err) {
  if (!err) return "An unexpected error occurred while communicating with Gemini.";
  const raw = typeof err === "string" ? err : err?.message || JSON.stringify(err);
  if (raw.includes("GEMINI_API_KEY")) {
    return "Gemini API key is not configured on the server. Please set it in Settings > Secrets.";
  }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed?.error === "string") {
        try {
          parsed.error = JSON.parse(parsed.error);
        } catch {
        }
      }
      const deepMessage = parsed?.error?.message || parsed?.message || parsed?.error;
      if (typeof deepMessage === "string" && deepMessage.trim()) {
        if (deepMessage.includes("experiencing high demand") || deepMessage.includes("UNAVAILABLE")) {
          return "The AI model is temporarily experiencing high demand. Please try again in a few moments.";
        }
        if (deepMessage.includes("RESOURCE_EXHAUSTED") || deepMessage.includes("quota")) {
          return "The AI service quota is temporarily exceeded. Please wait a moment and try again.";
        }
        return deepMessage;
      }
    }
  } catch {
  }
  if (raw.includes("503") || raw.includes("UNAVAILABLE") || raw.includes("high demand") || raw.includes("Service Unavailable")) {
    return "The AI model is temporarily experiencing high demand. Please try again in a few moments.";
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "Request rate limit reached. Please wait a few seconds before trying again.";
  }
  return raw;
}
function isTransientError(err) {
  const str = ((err?.message || "") + " " + (typeof err === "string" ? err : JSON.stringify(err))).toLowerCase();
  return str.includes("503") || str.includes("unavailable") || str.includes("experiencing high demand") || str.includes("spikes in demand") || str.includes("service unavailable") || str.includes("429") || str.includes("resource_exhausted") || str.includes("quota") || str.includes("500") || str.includes("internal") || str.includes("overloaded") || str.includes("econnreset") || str.includes("etimedout");
}
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var GeminiProvider = class {
  constructor() {
    // Primary model: gemini-3.1-flash-lite provides sub-second TTFT (600-800ms) with zero thinking lag.
    // Fallbacks: gemini-3.8-flash (with thinkingBudget: 0 to eliminate 20s+ delay) and gemini-flash-latest.
    this.candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  }
  async streamResponse(options) {
    if (isDirectCreatorQuestion(options.message)) {
      let creatorAnswer = "OpenSpace AI was created by Pranesh.";
      if (options.personalization?.language === "tamil") {
        creatorAnswer = "OpenSpace AI-\u0B90 \u0B89\u0BB0\u0BC1\u0BB5\u0BBE\u0B95\u0BCD\u0B95\u0BBF\u0BAF\u0BB5\u0BB0\u0BCD \u0BAA\u0BBF\u0BB0\u0BA9\u0BC7\u0BB7\u0BCD (Pranesh).";
      }
      options.onChunk(creatorAnswer);
      return {
        text: creatorAnswer,
        webSearchUsed: false,
        searchQueries: [],
        groundingSources: []
      };
    }
    const ai = getGenAIClient();
    let baseInstruction = SYSTEM_INSTRUCTIONS[options.mode] || SYSTEM_INSTRUCTIONS.normal;
    const personalizationRules = [];
    if (options.personalization?.language === "tamil") {
      personalizationRules.push("LANGUAGE: Respond in natural, fluent Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD). Translate concepts clearly with English technical terms in parentheses where appropriate.");
    } else if (options.personalization?.language === "tanglish") {
      personalizationRules.push("LANGUAGE: Respond in natural, conversational Tanglish (Tamil words written in English Latin script, as commonly spoken in Tamil Nadu chat) with an approachable, friendly tone.");
    } else if (options.personalization?.language === "english") {
      personalizationRules.push("LANGUAGE: Respond in clear, articulate English.");
    }
    if (options.personalization?.responseLength === "concise") {
      personalizationRules.push("LENGTH: Keep responses concise, direct, and compact without conversational fluff.");
    } else if (options.personalization?.responseLength === "comprehensive") {
      personalizationRules.push("LENGTH: Provide deep, exhaustive, comprehensive explanations with extensive context, examples, and breakdown.");
    }
    if (options.personalization?.responseStyle === "casual") {
      personalizationRules.push("STYLE: Adopt a warm, casual, approachable, and friendly conversational tone.");
    } else if (options.personalization?.responseStyle === "academic") {
      personalizationRules.push("STYLE: Adopt an academic, rigorous, scholarly, and analytical tone.");
    } else if (options.personalization?.responseStyle === "creative") {
      personalizationRules.push("STYLE: Adopt an imaginative, vivid, expressive, and engaging creative voice.");
    } else if (options.personalization?.responseStyle === "direct") {
      personalizationRules.push("STYLE: Adopt a direct, no-nonsense factual tone that answers questions immediately.");
    }
    if (options.difficulty || options.personalization?.studyDifficulty) {
      const diff = options.difficulty || options.personalization?.studyDifficulty;
      personalizationRules.push(`DIFFICULTY LEVEL: ${diff.toUpperCase()}. Calibrate explanations, vocabulary, and quizzes to this target difficulty.`);
    }
    if (options.webSearch) {
      personalizationRules.push(
        "WEB SEARCH ACTIVE: You have live Google Web Search enabled. Search the web whenever up-to-date, current, real-time, or verifying information is required. Always cite the facts accurately."
      );
    }
    if (options.simpleExplanationMode) {
      personalizationRules.push(
        'SIMPLE EXPLANATION MODE PRIORITY: The user has explicitly enabled Simple Step-by-Step Explanation Mode. Ensure your response is broken down into numbered steps (Step 1, Step 2, Step 3), clear "What you need", practical examples, and expected results. Keep language simple and beginner-friendly.'
      );
    }
    const contextAdditions = [];
    if (options.projectContext && options.projectContext.name) {
      contextAdditions.push(`
--- ACTIVE PROJECT CONTEXT ---
Project: ${options.projectContext.name}
${options.projectContext.description ? `Description: ${options.projectContext.description}` : ""}
${options.projectContext.instructions ? `Project Custom Instructions: ${options.projectContext.instructions}` : ""}
${options.projectContext.notes ? `Project Reference Notes: ${options.projectContext.notes}` : ""}`);
    }
    if (options.memories && options.memories.length > 0) {
      contextAdditions.push(`
--- USER SMART MEMORY (Personal Preferences & Context) ---
Remember these non-sensitive facts/preferences specified by the user:
${options.memories.map((m) => `- ${m}`).join("\n")}`);
    }
    const effectiveSystemInstruction = [
      baseInstruction,
      personalizationRules.length > 0 ? `
--- PERSONALIZATION INSTRUCTIONS ---
${personalizationRules.join("\n")}` : "",
      contextAdditions.join("\n")
    ].filter(Boolean).join("\n");
    const contents = [];
    const trimmedHistory = (options.history || []).slice(-10);
    for (let i = 0; i < trimmedHistory.length; i++) {
      const item = trimmedHistory[i];
      const isImmediatePrevious = i === trimmedHistory.length - 1;
      const parts = [];
      if (item.attachments && item.attachments.length > 0) {
        for (const att of item.attachments) {
          if (att.base64Data && isImmediatePrevious) {
            const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, "");
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64
              }
            });
          } else if (att.name) {
            parts.push({ text: `[Previously referenced file: ${att.name}]` });
          }
        }
      }
      if (item.content) {
        parts.push({ text: item.content });
      }
      if (parts.length > 0) {
        contents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts
        });
      }
    }
    const currentParts = [];
    if (options.attachments && options.attachments.length > 0) {
      for (const att of options.attachments) {
        if (att.base64Data) {
          const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, "");
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64
            }
          });
        }
      }
    }
    if (options.message) {
      currentParts.push({ text: options.message });
    } else if (currentParts.length > 0) {
      currentParts.push({ text: "Please analyze the attached file(s)." });
    }
    contents.push({
      role: "user",
      parts: currentParts
    });
    let lastError = null;
    let chunksEmitted = 0;
    const searchQueries = [];
    const groundingSources = [];
    for (let mIdx = 0; mIdx < this.candidateModels.length; mIdx++) {
      const currentModel = this.candidateModels[mIdx];
      const maxRetriesForModel = 2;
      for (let attempt = 1; attempt <= maxRetriesForModel; attempt++) {
        if (options.signal?.aborted) {
          return {
            text: "",
            webSearchUsed: false,
            searchQueries: [],
            groundingSources: []
          };
        }
        try {
          const config = {
            systemInstruction: effectiveSystemInstruction,
            // Eliminate thinking latency on models that support thinking (e.g. gemini-3.8-flash)
            thinkingConfig: { thinkingBudget: 0 }
          };
          if (options.webSearch) {
            config.tools = [{ googleSearch: {} }];
          }
          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents,
            config
          });
          let fullText = "";
          for await (const chunk of responseStream) {
            if (options.signal?.aborted) {
              break;
            }
            const candidate = chunk.candidates?.[0];
            const grounding = candidate?.groundingMetadata;
            if (grounding) {
              if (grounding.webSearchQueries && Array.isArray(grounding.webSearchQueries)) {
                for (const q of grounding.webSearchQueries) {
                  if (q && !searchQueries.includes(q)) {
                    searchQueries.push(q);
                  }
                }
              }
              if (grounding.groundingChunks && Array.isArray(grounding.groundingChunks)) {
                for (const gc of grounding.groundingChunks) {
                  const uri = gc.web?.uri;
                  if (uri && !groundingSources.some((s) => s.url === uri)) {
                    let domain = "";
                    try {
                      domain = new URL(uri).hostname.replace(/^www\./, "");
                    } catch {
                    }
                    groundingSources.push({
                      title: gc.web?.title || domain || "Web Source",
                      url: uri,
                      domain
                    });
                  }
                }
              }
              if (options.onGrounding && (searchQueries.length > 0 || groundingSources.length > 0)) {
                options.onGrounding({
                  queries: searchQueries,
                  sources: groundingSources
                });
              }
            }
            const text = chunk.text || "";
            if (text) {
              chunksEmitted++;
              fullText += text;
              options.onChunk(text);
            }
          }
          const webSearchUsed = Boolean(options.webSearch && (searchQueries.length > 0 || groundingSources.length > 0));
          return {
            text: fullText,
            webSearchUsed,
            searchQueries,
            groundingSources
          };
        } catch (err) {
          lastError = err;
          const friendly = extractFriendlyErrorMessage(err);
          console.log(
            `[GeminiProvider] Notice: ${currentModel} attempt ${attempt}/${maxRetriesForModel} reported: ${friendly}`
          );
          if (chunksEmitted > 0) {
            throw new Error(friendly);
          }
          if (isTransientError(err) && attempt < maxRetriesForModel) {
            const backoffMs = attempt * 500;
            console.log(`[GeminiProvider] Retrying ${currentModel} after ${backoffMs}ms...`);
            await sleep(backoffMs);
            continue;
          }
          if (isTransientError(err) && mIdx < this.candidateModels.length - 1) {
            console.log(`[GeminiProvider] Trying alternative model ${this.candidateModels[mIdx + 1]}...`);
            break;
          }
          throw new Error(friendly);
        }
      }
    }
    throw new Error(extractFriendlyErrorMessage(lastError));
  }
  async executeCanvasAction(options) {
    const ai = getGenAIClient();
    let prompt = "";
    switch (options.action) {
      case "rewrite":
        prompt = `Rewrite the following text to improve clarity, flow, and impact while maintaining its original core message:

${options.text}`;
        break;
      case "summarize":
        prompt = `Provide a clear, high-yield summary of the following text with bullet points and key takeaways:

${options.text}`;
        break;
      case "expand":
        prompt = `Expand the following text with more depth, relevant examples, supporting arguments, and practical details:

${options.text}`;
        break;
      case "simplify":
        prompt = `Simplify the following text using simple, easy-to-understand language so a beginner can grasp it immediately:

${options.text}`;
        break;
      case "improve_grammar":
        prompt = `Fix all grammar, punctuation, spelling, and phrasing errors in the following text while keeping its tone intact:

${options.text}`;
        break;
      case "change_tone":
        prompt = `Rewrite the following text in a ${options.tone || "professional"} tone:

${options.text}`;
        break;
      case "generate_content":
        prompt = `Write a well-structured document section based on this instruction: ${options.customPrompt || options.text}
Context:
${options.text}`;
        break;
      default:
        prompt = `${options.customPrompt || "Improve this document"}:

${options.text}`;
    }
    const res = await ai.models.generateContent({
      model: this.candidateModels[0],
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the OpenSpace AI Document Canvas Engine. Provide clean, well-formatted document text. Do NOT include conversational filler like "Here is the rewritten text:". Return only the edited or generated text directly.`
      }
    });
    return res.text || "";
  }
};
var geminiProvider = new GeminiProvider();

// server/rateLimiter.ts
var windowMs = 60 * 1e3;
var maxRequests = 60;
var ipMap = /* @__PURE__ */ new Map();
var cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    if (now > record.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 6e4);
if (typeof cleanupInterval?.unref === "function") {
  cleanupInterval.unref();
}
function rateLimiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-client";
  const now = Date.now();
  const record = ipMap.get(ip);
  if (!record || now > record.resetTime) {
    ipMap.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return next();
  }
  if (record.count >= maxRequests) {
    res.status(429).json({
      error: "Too many requests. Please wait a moment before sending more messages.",
      retryAfter: Math.ceil((record.resetTime - now) / 1e3)
    });
    return;
  }
  record.count += 1;
  next();
}

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use((req, _res, next) => {
  const original = req.originalUrl || req.headers["x-matched-path"];
  if (original && original.startsWith("/api") && (req.url === "/api/index" || req.url === "/api/index.js" || req.url === "/index.js" || req.url === "/index")) {
    req.url = original;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});
app.get("/api", (_req, res) => {
  res.json({
    status: "ok",
    name: "OpenSpace AI API",
    version: "1.0.0",
    timestamp: Date.now()
  });
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use("/api", rateLimiter);
var getAuthUserFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return authService.validateToken(token);
};
app.use("/api", (req, _res, next) => {
  const user = getAuthUserFromRequest(req);
  req.user = user;
  req.userId = user ? user.id : "guest";
  next();
});
var requireAuth = (req, res, next) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }
  next();
};
var handleRegister = (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    const { user, token } = authService.register(email, password, name);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
};
app.post("/api/auth/register", handleRegister);
app.post("/api/auth/signup", handleRegister);
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const { user, token } = authService.login(email, password);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ error: err.message || "Invalid email or password" });
  }
});
app.post("/api/auth/google", (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      res.status(400).json({ error: "Google email is required" });
      return;
    }
    const { user, token, isNewUser } = authService.googleLogin(email, name, avatar);
    res.json({ user, token, isNewUser });
  } catch (err) {
    res.status(400).json({ error: err.message || "Google sign-in failed" });
  }
});
app.post("/api/auth/logout", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      authService.logout(token);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout error" });
  }
});
app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = req.user;
  const stats = db.getUserStats(user.id);
  res.json({
    user: sanitizeUser(user),
    stats
  });
});
app.patch("/api/auth/profile", requireAuth, (req, res) => {
  try {
    const userId = req.userId;
    const { name, avatar } = req.body;
    const updated = authService.updateProfile(userId, { name, avatar });
    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to update profile" });
  }
});
app.post("/api/auth/change-password", requireAuth, (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    authService.changePassword(userId, currentPassword || "", newPassword);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to change password" });
  }
});
app.post("/api/auth/forgot-password", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const result = authService.requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to process request" });
  }
});
app.post("/api/auth/reset-password", (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      res.status(400).json({ error: "Email, reset code, and new password are required" });
      return;
    }
    authService.resetPassword(email, token, newPassword);
    res.json({ success: true, message: "Password has been reset successfully. Please log in." });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to reset password" });
  }
});
app.get("/api/auth/export-data", requireAuth, (req, res) => {
  try {
    const userId = req.userId;
    const exportData = db.exportUserData(userId);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=openspace-data-export-${userId}.json`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: "Failed to export user data" });
  }
});
app.delete("/api/auth/account", requireAuth, (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;
    authService.deleteAccount(userId, password);
    res.json({ success: true, message: "Account and all associated data permanently deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete account" });
  }
});
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    name: "OpenSpace AI",
    displayName: "OpenSpace",
    tagline: "Your AI. Your Space.",
    creator: "Pranesh",
    geminiConfigured: hasKey
  });
});
app.get("/api/conversations", (req, res) => {
  try {
    const userId = req.userId;
    const list = db.getConversations(userId);
    res.json({ conversations: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve conversations" });
  }
});
app.post("/api/conversations", (req, res) => {
  try {
    const userId = req.userId;
    const { title, mode, messages } = req.body;
    const id = req.body.id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const conv = db.createConversation(userId, { id, title, mode, messages });
    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});
app.get("/api/conversations/:id", (req, res) => {
  try {
    const userId = req.userId;
    const conv = db.getConversation(userId, req.params.id);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve conversation" });
  }
});
app.patch("/api/conversations/:id", (req, res) => {
  try {
    const userId = req.userId;
    const updated = db.updateConversation(userId, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json({ conversation: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update conversation" });
  }
});
app.delete("/api/conversations/:id", (req, res) => {
  try {
    const userId = req.userId;
    const success = db.deleteConversation(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});
app.delete("/api/conversations", (req, res) => {
  try {
    const userId = req.userId;
    db.clearAllConversations(userId);
    res.json({ success: true, message: "All conversations cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear conversations" });
  }
});
app.get("/api/settings", (req, res) => {
  try {
    const userId = req.userId;
    const settings = db.getSettings(userId);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve settings" });
  }
});
app.post("/api/settings", (req, res) => {
  try {
    const userId = req.userId;
    const updated = db.updateSettings(userId, req.body);
    res.json({ settings: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});
app.post("/api/upload", (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, file } = req.body;
    if (!conversationId || !file) {
      res.status(400).json({ error: "Missing conversationId or file" });
      return;
    }
    const existingFiles = db.getConversationFiles(userId, conversationId);
    if (existingFiles.length >= 15) {
      res.status(400).json({ error: "Maximum 15 files per conversation allowed." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      res.status(400).json({ error: "File size exceeds maximum 10MB limit." });
      return;
    }
    const allowedPrefixes = [
      "image/",
      "text/",
      "application/pdf",
      "application/json",
      "application/javascript",
      "application/typescript",
      "application/xml",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv"
    ];
    const isAllowed = allowedPrefixes.some((p) => file.mimeType.startsWith(p)) || file.name.match(/\.(md|ts|tsx|js|jsx|json|py|html|css|txt|csv|pdf|docx|doc)$/i);
    if (!isAllowed) {
      res.status(400).json({
        error: "Unsupported file type. Supported types include PDF, DOCX, CSV, TXT, code files, and images (PNG, JPG, WebP)."
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
      createdAt: Date.now()
    });
    res.json({ file: savedFile });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload file" });
  }
});
app.get("/api/conversations/:id/files", (req, res) => {
  try {
    const userId = req.userId;
    const files = db.getConversationFiles(userId, req.params.id);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve conversation files" });
  }
});
app.get("/api/files", (req, res) => {
  try {
    const userId = req.userId;
    const files = db.getAllFiles(userId);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});
app.delete("/api/files/:id", (req, res) => {
  try {
    const userId = req.userId;
    const success = db.deleteFile(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});
app.post("/api/messages/:id/feedback", (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, feedback } = req.body;
    const messageId = req.params.id;
    if (!conversationId || !messageId) {
      res.status(400).json({ error: "conversationId and messageId are required" });
      return;
    }
    const success = db.updateMessageFeedback(userId, conversationId, messageId, feedback);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});
app.get("/api/projects", (req, res) => {
  try {
    const userId = req.userId;
    const projects = db.getProjects(userId);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
});
app.post("/api/projects", (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, instructions, notes, conversationIds } = req.body;
    if (!name) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }
    const project = db.createProject(userId, { name, description, instructions, notes, conversationIds });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Failed to create project" });
  }
});
app.get("/api/projects/:id", (req, res) => {
  try {
    const userId = req.userId;
    const project = db.getProject(userId, req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve project" });
  }
});
app.patch("/api/projects/:id", (req, res) => {
  try {
    const userId = req.userId;
    const updated = db.updateProject(userId, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ project: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});
app.delete("/api/projects/:id", (req, res) => {
  try {
    const userId = req.userId;
    const success = db.deleteProject(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});
app.get("/api/memories", (req, res) => {
  try {
    const userId = req.userId;
    const memories = db.getMemories(userId);
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve memories" });
  }
});
app.post("/api/memories", (req, res) => {
  try {
    const userId = req.userId;
    const { content, category } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Memory content is required" });
      return;
    }
    const memory = db.addMemory(userId, content, category);
    res.json({ memory });
  } catch (err) {
    res.status(500).json({ error: "Failed to save memory" });
  }
});
app.delete("/api/memories/:id", (req, res) => {
  try {
    const userId = req.userId;
    const success = db.deleteMemory(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete memory" });
  }
});
app.post("/api/memories/clear", (req, res) => {
  try {
    const userId = req.userId;
    db.clearAllMemories(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear memories" });
  }
});
app.post("/api/share", (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.body;
    if (!conversationId) {
      res.status(400).json({ error: "conversationId is required" });
      return;
    }
    const shared = db.createSharedChat(userId, conversationId);
    if (!shared) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json({ sharedChat: shared });
  } catch (err) {
    res.status(500).json({ error: "Failed to share chat" });
  }
});
app.get("/api/share/:id", (req, res) => {
  try {
    const shared = db.getSharedChat(req.params.id);
    if (!shared) {
      res.status(404).json({ error: "Shared conversation not found" });
      return;
    }
    res.json({ sharedChat: shared });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve shared chat" });
  }
});
app.delete("/api/share/:id", (_req, res) => {
  try {
    const success = db.deleteSharedChat(_req.params.id);
    if (!success) {
      res.status(404).json({ error: "Shared conversation not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete shared chat" });
  }
});
app.post("/api/ai/canvas", async (req, res) => {
  try {
    const { action, text, customPrompt, tone } = req.body;
    if (!text && !customPrompt) {
      res.status(400).json({ error: "Text or custom prompt is required" });
      return;
    }
    const result = await geminiProvider.executeCanvasAction({
      action: action || "rewrite",
      text: text || "",
      customPrompt,
      tone
    });
    res.json({ result });
  } catch (err) {
    const friendly = extractFriendlyErrorMessage(err);
    res.status(500).json({ error: friendly });
  }
});
app.post("/api/chat/stream", async (req, res) => {
  const userId = req.userId;
  const {
    conversationId,
    messageId,
    assistantMessageId,
    mode = "normal",
    message,
    history = [],
    attachments = [],
    webSearch = false,
    personalization,
    difficulty,
    projectId,
    simpleExplanationMode = false
  } = req.body;
  if (!message && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: "Message or attachment is required." });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Content-Encoding": "none"
  });
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  const sendEvent = (event, data) => {
    res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
  };
  const asstMsgId = assistantMessageId || `asst_${Date.now()}`;
  res.write(": ping\n\n");
  sendEvent("start", { id: asstMsgId });
  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });
  let projectContext;
  if (projectId) {
    const proj = db.getProject(userId, projectId);
    if (proj) {
      projectContext = {
        name: proj.name,
        description: proj.description,
        instructions: proj.instructions,
        notes: proj.notes
      };
    }
  }
  const storedMemories = db.getMemories(userId).map((m) => m.content);
  const targetConvId = conversationId && conversationId !== "undefined" ? conversationId : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userMsgId = messageId || `user_${Date.now()}`;
  db.addMessage(userId, targetConvId, {
    id: userMsgId,
    role: "user",
    content: message || "",
    timestamp: Date.now(),
    mode,
    attachments: attachments.map((a) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      mimeType: a.mimeType,
      dataUrl: a.dataUrl
    }))
  });
  const conv = db.getConversation(userId, conversationId);
  if (conv && (!conv.title || conv.title === "New Conversation" || conv.messages.length <= 1)) {
    const rawTitle = message || attachments?.[0]?.name || "Chat";
    const cleanTitle = rawTitle.slice(0, 40).trim() + (rawTitle.length > 40 ? "..." : "");
    db.updateConversation(userId, conversationId, { title: cleanTitle, mode, projectId });
    sendEvent("title", { title: cleanTitle });
  }
  let fullAssistantText = "";
  try {
    const result = await geminiProvider.streamResponse({
      mode,
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
      onChunk: (chunk) => {
        fullAssistantText += chunk;
        sendEvent("chunk", { text: chunk });
      },
      onGrounding: (groundingData) => {
        sendEvent("grounding", groundingData);
      }
    });
    db.addMessage(userId, targetConvId, {
      id: asstMsgId,
      role: "assistant",
      content: fullAssistantText || result.text,
      timestamp: Date.now(),
      mode,
      webSearchUsed: result.webSearchUsed,
      searchQueries: result.searchQueries,
      groundingSources: result.groundingSources
    });
    sendEvent("done", {
      id: asstMsgId,
      content: fullAssistantText || result.text,
      webSearchUsed: result.webSearchUsed,
      searchQueries: result.searchQueries,
      groundingSources: result.groundingSources
    });
    res.end();
  } catch (err) {
    const friendlyError = extractFriendlyErrorMessage(err);
    console.error("Streaming handler error:", friendlyError);
    db.addMessage(userId, targetConvId, {
      id: asstMsgId,
      role: "assistant",
      content: fullAssistantText,
      timestamp: Date.now(),
      mode,
      error: friendlyError
    });
    sendEvent("error", { error: friendlyError, id: asstMsgId });
    res.end();
  }
});
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenSpace AI server running on http://0.0.0.0:${PORT}`);
  });
}
var isServerless = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME
);
if (!isServerless) {
  startServer();
}
var server_default = app;

// api/index.ts
function handler(req, res) {
  return server_default(req, res);
}
export {
  handler as default
};
