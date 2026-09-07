import crypto from 'crypto';
import { db, StoredUser, StoredSession } from './db.ts';

const SESSION_EXPIRY_DAYS = 30;

// Secure password hashing using Node crypto.scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateResetCode(): string {
  // 6-digit verification code or hex token
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface UserSanitized {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'password' | 'google';
  createdAt: number;
  lastLoginAt: number;
}

export function sanitizeUser(user: StoredUser): UserSanitized {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export class AuthService {
  public register(email: string, password: string, name: string): { user: UserSanitized; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please provide a valid email address');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }

    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      provider: 'password',
      createdAt: now,
      lastLoginAt: now,
    };

    db.createUser(newUser);

    // Create session
    const token = generateSecureToken();
    const session: StoredSession = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    db.createSession(session);

    return {
      user: sanitizeUser(newUser),
      token,
    };
  }

  public login(email: string, password: string): { user: UserSanitized; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.provider === 'google' && !user.passwordHash) {
      throw new Error('This account was registered with Google. Please use Google Sign-In.');
    }

    if (!user.passwordHash || !user.passwordSalt) {
      throw new Error('Invalid account credentials');
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const now = Date.now();
    db.updateUser(user.id, { lastLoginAt: now });

    const token = generateSecureToken();
    const session: StoredSession = {
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    db.createSession(session);

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  public googleLogin(email: string, name?: string, avatar?: string): { user: UserSanitized; token: string; isNewUser: boolean } {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Valid Google email is required');
    }

    let user = db.getUserByEmail(normalizedEmail);
    let isNewUser = false;
    const now = Date.now();

    if (!user) {
      isNewUser = true;
      const userId = `usr_g_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const defaultName = name?.trim() || normalizedEmail.split('@')[0];

      user = {
        id: userId,
        email: normalizedEmail,
        name: defaultName,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
        provider: 'google',
        createdAt: now,
        lastLoginAt: now,
      };
      db.createUser(user);
    } else {
      db.updateUser(user.id, {
        lastLoginAt: now,
        avatar: avatar || user.avatar,
        name: name?.trim() || user.name,
      });
      user = db.getUserById(user.id)!;
    }

    const token = generateSecureToken();
    const session: StoredSession = {
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    db.createSession(session);

    return {
      user: sanitizeUser(user),
      token,
      isNewUser,
    };
  }

  public validateToken(token: string): StoredUser | null {
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

  public logout(token: string): boolean {
    return db.deleteSession(token);
  }

  public requestPasswordReset(email: string): { resetToken: string; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      // Return ambiguous message for privacy, but also provide dummy code
      return {
        resetToken: generateResetCode(),
        message: 'If an account exists with this email, password reset instructions have been generated.',
      };
    }

    const resetToken = generateResetCode();
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    db.updateUser(user.id, {
      resetToken,
      resetTokenExpires: expires,
    });

    return {
      resetToken,
      message: 'Password reset code generated successfully. Use this code to reset your password.',
    };
  }

  public resetPassword(email: string, token: string, newPassword: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Account not found');
    }

    if (!user.resetToken || user.resetToken !== token.trim()) {
      throw new Error('Invalid or expired reset code');
    }

    if (!user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
      throw new Error('Reset code has expired. Please request a new one.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const { hash, salt } = hashPassword(newPassword);
    db.updateUser(user.id, {
      passwordHash: hash,
      passwordSalt: salt,
      resetToken: undefined,
      resetTokenExpires: undefined,
      provider: 'password', // if was google, now has password too
    });

    // Invalidate all existing sessions for this user
    db.deleteUserSessions(user.id);
    return true;
  }

  public changePassword(userId: string, currentPass: string, newPass: string): boolean {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (user.passwordHash && user.passwordSalt) {
      const isValid = verifyPassword(currentPass, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        throw new Error('Current password does not match');
      }
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const { hash, salt } = hashPassword(newPass);
    db.updateUser(userId, {
      passwordHash: hash,
      passwordSalt: salt,
    });

    return true;
  }

  public updateProfile(userId: string, updates: { name?: string; avatar?: string }): UserSanitized {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    const updatedUser = db.updateUser(userId, {
      name: updates.name?.trim() || user.name,
      avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
    });

    return sanitizeUser(updatedUser!);
  }

  public deleteAccount(userId: string, password?: string): boolean {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    // If account has password, verify it before deletion
    if (user.provider === 'password' && user.passwordHash && user.passwordSalt && password) {
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        throw new Error('Incorrect password. Account deletion aborted.');
      }
    }

    // Delete all sessions
    db.deleteUserSessions(userId);

    // Delete all private user data (chats, files, projects, memories, settings)
    db.deleteUserData(userId);

    // Delete user record
    db.deleteUser(userId);

    return true;
  }
}

export const authService = new AuthService();
