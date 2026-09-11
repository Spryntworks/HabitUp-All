import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  HabitCompletion,
  UserProfile,
  UserSession,
  SyncMutation,
} from '../types';
import { getDetectedTimezone } from '../constants/timezones';

export const BACKEND_BASE_URL = 'https://habitup-backend-v2-production.up.railway.app';

export const getUserIdFromEmail = (email: string): string => {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return 'usr_default';
  return `usr_${normalized.replace(/[^a-z0-9]/g, '_')}`;
};

export const isUuid = (str?: string): boolean => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

export const createDefaultUserProfile = (name?: string, email?: string, timezone?: string, username?: string): UserProfile => {
  const cleanEmail = (email || '').trim();
  const cleanName = (name || '').trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  const cleanUsername = (username || '').trim().replace(/^@/, '').toLowerCase() || (cleanEmail ? cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') : cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return {
    id: getUserIdFromEmail(cleanEmail),
    name: cleanName,
    email: cleanEmail,
    username: cleanUsername,
    timezone: timezone || getDetectedTimezone(),
    avatar: '',
    created_at: new Date().toISOString(),
  };
};

export interface BackendHabit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency_type: 'daily' | 'scheduled';
  schedule?: number[];
  streak?: number;
  paused_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BackendStats {
  overall_completion_rate: number;
  total_completions: number;
  habits: Array<{
    id: string;
    name: string;
    current_streak: number;
    best_streak: number;
    completion_rate: number;
  }>;
}

// In-Memory Synchronous Cache layer backing AsyncStorage
const memoryStore: Record<string, string> = {};

if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('habitup') || key.startsWith('@habitup'))) {
        const val = window.localStorage.getItem(key);
        if (val !== null) memoryStore[key] = val;
      }
    }
  } catch {}
}

class ApiClient {
  private currentUserId: string = 'usr_default';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  public readonly baseUrl: string = BACKEND_BASE_URL;

  constructor() {
    this.currentUserId = this.getStorage<string>('habitup_current_user_id', 'usr_default');
    this.accessToken =
      this.getStorage<string | null>(`habitup_access_token_${this.currentUserId}`, null) ||
      this.getStorage<string | null>('habitup_access_token', null);
    this.refreshToken =
      this.getStorage<string | null>(`habitup_refresh_token_${this.currentUserId}`, null) ||
      this.getStorage<string | null>('habitup_refresh_token', null);
    this.initStorage().catch(() => {});
  }

  public async initStorage(targetUserId?: string): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      // 1. Load all keys into memoryStore
      const keys = await AsyncStorage.getAllKeys();
      if (keys && keys.length > 0) {
        for (const k of keys) {
          const val = await AsyncStorage.getItem(k);
          if (val !== null) memoryStore[k] = val;
        }
      }

      // 2. Resolve User ID
      let uid = targetUserId;
      if (!uid || uid === 'usr_default') {
        const savedUidRaw = await AsyncStorage.getItem('habitup_current_user_id');
        if (savedUidRaw) {
          try {
            uid = JSON.parse(savedUidRaw);
          } catch {
            uid = savedUidRaw;
          }
        }
      }
      this.currentUserId = uid || 'usr_default';

      // 3. Load tokens for this user or global fallback
      let access: string | null = null;
      let refresh: string | null = null;

      if (this.currentUserId && this.currentUserId !== 'usr_default') {
        access = await AsyncStorage.getItem(`habitup_access_token_${this.currentUserId}`);
        refresh = await AsyncStorage.getItem(`habitup_refresh_token_${this.currentUserId}`);
      }

      if (!access) access = await AsyncStorage.getItem('habitup_access_token');
      if (!refresh) refresh = await AsyncStorage.getItem('habitup_refresh_token');

      // Unwrap JSON if needed
      if (access) {
        try {
          const parsed = JSON.parse(access);
          if (typeof parsed === 'string') access = parsed;
        } catch {}
      }
      if (refresh) {
        try {
          const parsed = JSON.parse(refresh);
          if (typeof parsed === 'string') refresh = parsed;
        } catch {}
      }

      this.accessToken = access || null;
      this.refreshToken = refresh || null;

      if (this.accessToken) {
        memoryStore['habitup_access_token'] = JSON.stringify(this.accessToken);
        if (this.currentUserId && this.currentUserId !== 'usr_default') {
          memoryStore[`habitup_access_token_${this.currentUserId}`] = JSON.stringify(this.accessToken);
        }
      }
      if (this.refreshToken) {
        memoryStore['habitup_refresh_token'] = JSON.stringify(this.refreshToken);
        if (this.currentUserId && this.currentUserId !== 'usr_default') {
          memoryStore[`habitup_refresh_token_${this.currentUserId}`] = JSON.stringify(this.refreshToken);
        }
      }

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
      };
    } catch (e) {
      console.warn('ApiClient initStorage warning:', e);
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
      };
    }
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    this.setStorage('habitup_current_user_id', userId);
    
    // Automatically load this user's specific access and refresh tokens
    let userAccess = this.getStorage<string | null>(`habitup_access_token_${userId}`, null);
    let userRefresh = this.getStorage<string | null>(`habitup_refresh_token_${userId}`, null);
    if (!userAccess && userId !== 'usr_default') {
      userAccess = this.getStorage<string | null>('habitup_access_token', null);
      userRefresh = this.getStorage<string | null>('habitup_refresh_token', null);
    }
    if (userAccess) {
      this.accessToken = userAccess;
      this.refreshToken = userRefresh;
      this.setStorage('habitup_access_token', userAccess);
      if (userRefresh) this.setStorage('habitup_refresh_token', userRefresh);
    } else if (userId === 'usr_default') {
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  hasAuthToken(): boolean {
    if (this.accessToken || this.refreshToken) return true;
    const stored =
      this.getStorage<string | null>('habitup_access_token', null) ||
      (this.currentUserId ? this.getStorage<string | null>(`habitup_access_token_${this.currentUserId}`, null) : null);
    if (stored) {
      this.accessToken = stored;
      return true;
    }
    const storedRefresh =
      this.getStorage<string | null>('habitup_refresh_token', null) ||
      (this.currentUserId ? this.getStorage<string | null>(`habitup_refresh_token_${this.currentUserId}`, null) : null);
    if (storedRefresh) {
      this.refreshToken = storedRefresh;
      return true;
    }
    return false;
  }

  setTokens(accessToken: string | null, refreshToken?: string | null, targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.accessToken = accessToken;
    this.setStorage('habitup_access_token', accessToken);
    if (uid && uid !== 'usr_default') {
      this.setStorage(`habitup_access_token_${uid}`, accessToken);
    }
    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
      this.setStorage('habitup_refresh_token', refreshToken);
      if (uid && uid !== 'usr_default') {
        this.setStorage(`habitup_refresh_token_${uid}`, refreshToken);
      }
    }
  }

  clearTokens(targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    if (uid && uid !== 'usr_default') {
      delete memoryStore[`habitup_access_token_${uid}`];
      delete memoryStore[`habitup_refresh_token_${uid}`];
      AsyncStorage.removeItem(`habitup_access_token_${uid}`).catch(() => {});
      AsyncStorage.removeItem(`habitup_refresh_token_${uid}`).catch(() => {});
    }
    this.accessToken = null;
    this.refreshToken = null;
    delete memoryStore['habitup_access_token'];
    delete memoryStore['habitup_refresh_token'];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('habitup_access_token');
        window.localStorage.removeItem('habitup_refresh_token');
        if (uid && uid !== 'usr_default') {
          window.localStorage.removeItem(`habitup_access_token_${uid}`);
          window.localStorage.removeItem(`habitup_refresh_token_${uid}`);
        }
      } catch {}
    }
    AsyncStorage.removeItem('habitup_access_token').catch(() => {});
    AsyncStorage.removeItem('habitup_refresh_token').catch(() => {});
  }

  private getStorage<T>(key: string, fallback: T): T {
    try {
      let data = memoryStore[key];
      if (!data && typeof window !== 'undefined' && window.localStorage) {
        const localVal = window.localStorage.getItem(key);
        if (localVal) {
          data = localVal;
          memoryStore[key] = localVal;
        }
      }
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      const str = JSON.stringify(value);
      memoryStore[key] = str;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(key, str);
        } catch {}
      }
      AsyncStorage.setItem(key, str).catch(() => {});
    } catch (e) {
      console.warn('Storage write warning:', e);
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const isPublicEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/reset-password') ||
      endpoint.includes('/auth/forgot-password') ||
      endpoint.includes('/users/');

    if (!this.accessToken) {
      const stored =
        this.getStorage<string | null>('habitup_access_token', null) ||
        (this.currentUserId ? this.getStorage<string | null>(`habitup_access_token_${this.currentUserId}`, null) : null);
      if (stored) this.accessToken = stored;
    }

    if (!this.refreshToken) {
      const storedRefresh =
        this.getStorage<string | null>('habitup_refresh_token', null) ||
        (this.currentUserId ? this.getStorage<string | null>(`habitup_refresh_token_${this.currentUserId}`, null) : null);
      if (storedRefresh) this.refreshToken = storedRefresh;
    }

    // Guard: Prevent unauthenticated calls to protected endpoints
    if (!isPublicEndpoint && !this.accessToken && !this.refreshToken) {
      return {
        ok: false,
        status: 401,
        error: 'Not authenticated',
      };
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-variant': 'B',
      'x-experiment-variant': 'B',
      'x-feature-friends': 'true',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;

    try {
      let res = await fetch(url, {
        ...options,
        headers,
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (
        res.status === 401 &&
        !endpoint.includes('/auth/refresh') &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register')
      ) {
        if (!this.refreshToken) {
          this.refreshToken =
            this.getStorage<string | null>('habitup_refresh_token', null) ||
            (this.currentUserId ? this.getStorage<string | null>(`habitup_refresh_token_${this.currentUserId}`, null) : null);
        }
        if (this.refreshToken) {
          const refreshed = await this.refreshAuthTokens();
          if (refreshed && this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
            res = await fetch(url, { ...options, headers });
          }
        }
      }

      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const json = isJson ? await res.json() : null;

      if (!res.ok) {
        let extractedError = json?.error || json?.message || json?.detail;
        if (!extractedError && Array.isArray(json?.errors)) {
          extractedError = json.errors.map((e: any) => e?.msg || e?.message || String(e)).join(', ');
        }
        if (!extractedError && typeof json === 'string') {
          extractedError = json;
        }
        return {
          ok: false,
          status: res.status,
          error: extractedError || (res.status === 401 ? 'Incorrect email or password.' : `Request failed with status ${res.status}`),
        };
      }

      return { ok: true, status: res.status, data: json };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      return { ok: false, status: 0, error: err?.message || 'Network connection error' };
    }
  }

  async refreshAuthTokens(): Promise<boolean> {
    if (!this.refreshToken) {
      this.refreshToken =
        this.getStorage<string | null>('habitup_refresh_token', null) ||
        (this.currentUserId ? this.getStorage<string | null>(`habitup_refresh_token_${this.currentUserId}`, null) : null);
    }
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-variant': 'B',
          'x-experiment-variant': 'B',
          'x-feature-friends': 'true',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          this.setTokens(data.accessToken, data.refreshToken || this.refreshToken);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  // --- AUTH METHODS ---

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    const clean = (username || '').trim().replace(/^@/, '').toLowerCase();
    if (!clean || clean.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters.' };
    }
    if (!/^[a-z0-9_.]+$/.test(clean)) {
      return { available: false, error: 'Only letters, numbers, underscores, and dots are allowed.' };
    }

    try {
      const url = `${this.baseUrl}/users/@${encodeURIComponent(clean)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-variant': 'B',
          'x-experiment-variant': 'B',
          'x-feature-friends': 'true',
        },
      });
      if (res.status === 404) {
        // User not found -> username is available!
        return { available: true };
      }
      if (res.status === 200) {
        // User found -> username is already taken!
        return { available: false, error: `@${clean} is already taken.` };
      }
      return { available: true };
    } catch {
      return { available: true };
    }
  }

  async registerUser(
    name: string,
    email: string,
    password: string,
    username?: string,
    timezone?: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'User';
    const cleanUsername =
      (username || '').trim().replace(/^@/, '').toLowerCase() ||
      cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const tz = timezone || getDetectedTimezone();

    const res = await this.request<{ accessToken: string; refreshToken?: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password,
        timezone: tz,
      }),
    });

    if (res.ok && res.data?.user) {
      const user = {
        ...res.data.user,
        username: res.data.user.username || cleanUsername,
      };
      const token = (res.data as any).access_token || (res.data as any).accessToken || null;
      const refToken = (res.data as any).refresh_token || (res.data as any).refreshToken || null;
      this.setCurrentUserId(user.id);
      this.setTokens(token, refToken, user.id);
      this.saveUser(user, user.id);
      return { success: true, user, accessToken: token };
    }

    // Check for duplicate account or bad request
    if (!res.ok) {
      const err = res.error || '';
      if (
        res.status === 409 ||
        res.status === 400 ||
        res.status === 422 ||
        /exist|already|duplicate|username/i.test(err)
      ) {
        if (/username/i.test(err)) {
          return {
            success: false,
            error: err.includes('status') ? 'This username is already taken. Please choose a different username.' : err,
          };
        }
        return {
          success: false,
          error: /exist|already|duplicate/i.test(err)
            ? err
            : 'An account with this email or username already exists. Please choose a different username or sign in.',
        };
      }

      if (res.status === 0 || res.status >= 500) {
        return {
          success: false,
          error: 'Cannot connect to authentication server. Please check your internet connection.',
        };
      }

      return {
        success: false,
        error: err || 'Registration failed. Please check your details.',
      };
    }

    const uid = getUserIdFromEmail(cleanEmail);
    const offlineUser: UserProfile = {
      id: uid,
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      timezone: tz,
      avatar: '',
      created_at: new Date().toISOString(),
    };
    this.setCurrentUserId(uid);
    this.saveUser(offlineUser, uid);
    return { success: true, user: offlineUser };
  }

  async loginUser(
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanIdentifier = (identifier || '').trim().replace(/^@/, '');
    if (!cleanIdentifier) {
      return { success: false, error: 'Email or username is required.' };
    }

    if (password) {
      const isEmail = cleanIdentifier.includes('@');
      const payload = isEmail
        ? { email: cleanIdentifier.toLowerCase(), password }
        : { username: cleanIdentifier.toLowerCase(), password };

      const res = await this.request<{ accessToken: string; refreshToken?: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data?.user) {
        const user = res.data.user;
        const token = (res.data as any).access_token || (res.data as any).accessToken || null;
        const refToken = (res.data as any).refresh_token || (res.data as any).refreshToken || null;
        this.setCurrentUserId(user.id);
        this.setTokens(token, refToken, user.id);
        this.saveUser(user, user.id);
        return { success: true, user, accessToken: token };
      }

      // Explicit authentication failure (Wrong password or email/username not found)
      if (
        !res.ok &&
        (res.status === 401 ||
          res.status === 400 ||
          res.status === 403 ||
          res.status === 404 ||
          (res.error && /invalid|wrong|password|credential|not found/i.test(res.error)))
      ) {
        return {
          success: false,
          error: res.error && !res.error.includes('status') ? res.error : 'Incorrect credentials or password. Please try again.',
        };
      }

      if (res.status === 0 || res.status >= 500) {
        return {
          success: false,
          error: 'Cannot connect to authentication server. Please check your internet connection.',
        };
      }
    }

    const isEmail = cleanIdentifier.includes('@');
    const uid = isEmail ? getUserIdFromEmail(cleanIdentifier) : `usr_${cleanIdentifier.toLowerCase()}`;
    const existing = this.getUser(uid);
    const userToUse: UserProfile = existing && existing.id
      ? existing
      : createDefaultUserProfile(
          cleanIdentifier.split('@')[0],
          isEmail ? cleanIdentifier : `${cleanIdentifier}@example.com`,
          undefined,
          cleanIdentifier
        );
    this.setCurrentUserId(uid);
    this.saveUser(userToUse, uid);
    return { success: true, user: userToUse };
  }

  async fetchMe(): Promise<UserProfile | null> {
    const res = await this.request<{ user: UserProfile }>('/auth/me');
    if (res.ok && res.data?.user) {
      this.saveUser(res.data.user, res.data.user.id);
      return res.data.user;
    }
    return null;
  }

  async logoutUser(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch {
      // ignore
    } finally {
      this.clearTokens();
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      // 1. Try exact Swagger endpoint /auth/reset-password/request
      let res = await this.request<{ message?: string; success?: boolean }>('/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      // 2. Fallback to /auth/forgot-password if needed
      if (!res.ok && res.status === 404) {
        res = await this.request<{ message?: string; success?: boolean }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail }),
        });
      }

      if (res.ok) {
        return {
          success: true,
          message: res.data?.message || 'Password reset token has been sent to your email.',
        };
      }

      return {
        success: false,
        error: res.error || 'Unable to process reset request. Please check your email or try again.',
      };
    } catch {
      return {
        success: false,
        error: 'Network connection error. Please check your internet connection.',
      };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanToken = (token || '').trim();
    const cleanPassword = (newPassword || '').trim();
    if (!cleanToken || !cleanPassword) {
      return { success: false, error: 'Reset token and new password are required.' };
    }

    try {
      // 1. Try exact Swagger endpoint /auth/reset-password/confirm
      let res = await this.request<{ message?: string; success?: boolean }>('/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({
          token: cleanToken,
          newPassword: cleanPassword,
        }),
      });

      // 2. Fallback to /auth/reset-password if needed
      if (!res.ok && res.status === 404) {
        res = await this.request<{ message?: string; success?: boolean }>('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: cleanToken,
            password: cleanPassword,
            newPassword: cleanPassword,
            email: email ? email.trim().toLowerCase() : undefined,
          }),
        });
      }

      if (res.ok) {
        return {
          success: true,
          message: res.data?.message || 'Password has been reset successfully. Please sign in.',
        };
      }

      return {
        success: false,
        error: res.error || 'Invalid, expired, or already used reset token.',
      };
    } catch {
      return {
        success: false,
        error: 'Network connection error. Please check your internet connection.',
      };
    }
  }

  async deleteAccount(password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanPassword = (password || '').trim();
    if (!cleanPassword) {
      return { success: false, error: 'Password is required to delete your account.' };
    }

    try {
      const res = await this.request<{ message?: string }>('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: cleanPassword }),
      });

      if (res.ok) {
        this.clearTokens();
        return {
          success: true,
          message: res.data?.message || 'Account deleted successfully.',
        };
      }

      return {
        success: false,
        error: res.error || (res.status === 401 ? 'Incorrect password. Please verify and try again.' : 'Failed to delete account. Please try again.'),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network connection error. Please check your internet connection.',
      };
    }
  }

  // --- HABITS SERVER INTEGRATION ---

  mapBackendHabitToLocal(h: BackendHabit, fallbackTime?: string, fallbackEnabled?: boolean, fallbackDays?: number[]): Habit {
    const existing = this.getHabits().find((localH) => localH.id === h.id || (localH.name && localH.name.toLowerCase() === h.name.toLowerCase()));
    const reminder_time = fallbackTime || existing?.reminder_time || '08:00';
    const reminder_enabled = fallbackEnabled !== undefined ? fallbackEnabled : (existing?.reminder_enabled !== undefined ? existing.reminder_enabled : true);

    let scheduled_days = [0, 1, 2, 3, 4, 5, 6];
    if (Array.isArray(h.schedule) && h.schedule.length > 0) {
      scheduled_days = h.schedule;
    } else if (Array.isArray((h as any).days) && (h as any).days.length > 0) {
      scheduled_days = (h as any).days;
    } else if (Array.isArray(fallbackDays) && fallbackDays.length > 0) {
      scheduled_days = fallbackDays;
    } else if (existing && Array.isArray(existing.scheduled_days) && existing.scheduled_days.length > 0) {
      scheduled_days = existing.scheduled_days;
    }

    const freq = h.frequency_type === 'daily' || !h.frequency_type ? 'daily' : 'custom_days';

    return {
      id: h.id,
      user_id: h.user_id,
      name: h.name,
      description: h.description || undefined,
      icon: h.icon || 'Sparkles',
      color: h.color || '#7C5CFF',
      frequency_type: freq,
      scheduled_days: freq === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : scheduled_days,
      reminder_enabled,
      reminder_time,
      buddy_id: existing?.buddy_id,
      buddy_name: existing?.buddy_name,
      buddy_avatar: existing?.buddy_avatar,
      is_shared: existing?.is_shared,
      paused_at: h.paused_at,
      archived_at: h.archived_at,
      deleted_at: h.deleted_at,
      created_at: h.created_at,
      updated_at: h.updated_at || h.created_at,
    };
  }

  async fetchHabitsFromServer(): Promise<Habit[]> {
    try {
      const activeRes = await this.request<{ habits: BackendHabit[] }>('/habits');
      const archivedRes = await this.request<{ habits: BackendHabit[] }>('/habits/archived');

      if (activeRes.ok) {
        const allBackendHabits: BackendHabit[] = [
          ...(Array.isArray(activeRes.data?.habits) ? activeRes.data.habits : []),
          ...(archivedRes.ok && Array.isArray(archivedRes.data?.habits) ? archivedRes.data.habits : []),
        ];

        const localHabits = allBackendHabits.map((h) => this.mapBackendHabitToLocal(h));
        this.saveHabits(localHabits);
        return localHabits;
      }
    } catch (err) {
      console.warn('Failed to fetch habits from server:', err);
    }
    return this.getHabits();
  }

  async createHabitOnServer(habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Habit | null> {
    try {
      const res = await this.request<{ habit: BackendHabit }>('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: habitData.name,
          description: habitData.description || null,
          icon: habitData.icon || 'Sparkles',
          color: habitData.color || '#7C5CFF',
          frequency_type: habitData.frequency_type === 'daily' ? 'daily' : 'scheduled',
          days: habitData.frequency_type === 'custom_days' ? habitData.scheduled_days : undefined,
        }),
      });

      if (res.ok && res.data?.habit) {
        const local = this.mapBackendHabitToLocal(
          res.data.habit,
          habitData.reminder_time,
          habitData.reminder_enabled,
          habitData.scheduled_days
        );
        return {
          ...local,
          buddy_id: habitData.buddy_id,
          buddy_name: habitData.buddy_name,
          buddy_avatar: habitData.buddy_avatar,
          is_shared: habitData.is_shared,
        };
      }
    } catch (err) {
      console.warn('Server habit creation error:', err);
    }
    return null;
  }

  async updateHabitOnServer(habitId: string, updates: Partial<Habit>): Promise<boolean> {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.frequency_type !== undefined) {
        payload.frequency_type = updates.frequency_type === 'daily' ? 'daily' : 'scheduled';
      }
      if (updates.scheduled_days !== undefined) {
        payload.days = updates.scheduled_days;
      }

      const res = await this.request(`/habits/${habitId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async pauseHabitOnServer(habitId: string): Promise<boolean> {
    const res = await this.request(`/habits/${habitId}/pause`, { method: 'PATCH' });
    return res.ok;
  }

  async unpauseHabitOnServer(habitId: string): Promise<boolean> {
    const res = await this.request(`/habits/${habitId}/unpause`, { method: 'PATCH' });
    return res.ok;
  }

  async archiveHabitOnServer(habitId: string): Promise<boolean> {
    const res = await this.request(`/habits/${habitId}/archive`, { method: 'PATCH' });
    return res.ok;
  }

  async unarchiveHabitOnServer(habitId: string): Promise<boolean> {
    const res = await this.request(`/habits/${habitId}/unarchive`, { method: 'PATCH' });
    return res.ok;
  }

  async deleteHabitOnServer(habitId: string): Promise<boolean> {
    const res = await this.request(`/habits/${habitId}`, { method: 'DELETE' });
    return res.ok;
  }

  // --- COMPLETIONS SERVER INTEGRATION ---

  async addCompletion(habitId: string, dateStr?: string): Promise<{ completion?: HabitCompletion; streak?: number }> {
    const targetDate = (dateStr || new Date().toISOString().split('T')[0]).split('T')[0];
    const payload = { completion_date: targetDate };
    const res = await this.request<{ completion: any; streak: number }>(`/habits/${habitId}/completions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok && res.data?.completion) {
      return {
        completion: {
          id: res.data.completion.id,
          habit_id: res.data.completion.habit_id || habitId,
          user_id: res.data.completion.user_id || this.currentUserId,
          completion_date: targetDate,
          completed_at: res.data.completion.completed_at || new Date().toISOString(),
        },
        streak: res.data.streak,
      };
    }
    return {};
  }

  async removeCompletion(habitId: string, dateStr: string): Promise<{ streak?: number }> {
    const res = await this.request<{ message: string; streak: number }>(`/habits/${habitId}/completions/${dateStr}`, {
      method: 'DELETE',
    });
    return { streak: res.data?.streak };
  }

  async fetchCompletionsFromServer(habits: Habit[]): Promise<HabitCompletion[]> {
    const allCompletions: HabitCompletion[] = [];
    if (!habits || habits.length === 0) return allCompletions;

    try {
      await Promise.all(
        habits.map(async (habit) => {
          let hasFetchedDirect = false;
          try {
            const res = await this.request<{ completions?: any[]; data?: any[] }>(`/habits/${habit.id}/completions`);
            if (res.ok && res.data) {
              const list = Array.isArray(res.data) ? res.data : (res.data.completions || res.data.data || []);
              if (Array.isArray(list) && list.length > 0) {
                hasFetchedDirect = true;
                list.forEach((c) => {
                  const dateKey = (c.completed_on || c.completion_date || c.date || '').split('T')[0];
                  if (dateKey) {
                    allCompletions.push({
                      id: c.id || `comp-${habit.id}-${dateKey}`,
                      habit_id: c.habit_id || habit.id,
                      user_id: c.user_id || this.currentUserId,
                      completion_date: dateKey,
                      completed_at: c.completed_at || `${dateKey}T12:00:00.000Z`,
                    });
                  }
                });
              }
            }
          } catch {
            // ignore per habit
          }

          // If direct endpoint didn't return completions, reconstruct from active streak
          if (!hasFetchedDirect) {
            const streak = (habit as any).streak || (habit as any).current_streak || 0;
            if (streak > 0) {
              const today = new Date();
              for (let i = 0; i < streak; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateKey = `${y}-${m}-${day}`;
                allCompletions.push({
                  id: `comp-streak-${habit.id}-${dateKey}`,
                  habit_id: habit.id,
                  user_id: this.currentUserId,
                  completion_date: dateKey,
                  completed_at: `${dateKey}T12:00:00.000Z`,
                });
              }
            }
          }
        })
      );
    } catch (err) {
      console.warn('Error fetching server completions:', err);
    }

    return allCompletions;
  }

  async fetchStatsFromServer(): Promise<BackendStats | null> {
    const res = await this.request<BackendStats>('/habits/stats');
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  }

  // --- USERS & FRIENDS SERVER INTEGRATION (/users/* & /friends/*) ---

  async searchUsersByUsername(query: string): Promise<{ id: string; username: string; name?: string }[]> {
    const clean = query.trim().replace(/^@/, '');
    if (!clean) return [];
    try {
      const results: Array<{ id: string; username: string; name?: string }> = [];
      if (clean.length >= 3) {
        const res = await this.request<{ results: Array<{ id: string; username: string; name?: string }> }>(
          `/users/search?query=${encodeURIComponent(clean)}`
        );
        if (res.ok && Array.isArray(res.data?.results)) {
          results.push(...res.data.results);
        }
      }
      // If query is < 3 chars or returned 0 results, try exact profile lookup
      if (results.length === 0 && clean.length >= 1) {
        const direct = await this.fetchUserProfileByUsername(clean);
        if (direct && direct.id) {
          results.push({
            id: direct.id,
            username: direct.username,
            name: direct.username,
          });
        }
      }
      return results;
    } catch (err) {
      console.warn('searchUsersByUsername error:', err);
    }
    return [];
  }

  async fetchUserProfileByUsername(username: string): Promise<{ id: string; username: string; total_habits?: number; current_streak?: number } | null> {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return null;
    try {
      const res = await this.request<{ id: string; username: string; total_habits?: number; current_streak?: number }>(
        `/users/@${encodeURIComponent(clean)}`
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async sendFriendRequestByUsername(username: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    request_id?: string;
    from_user_id?: string;
    to_user_id?: string;
    to_username?: string;
  }> {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) {
      return { success: false, error: 'Username handle is required.' };
    }
    try {
      const res = await this.request<{
        message?: string;
        request_id?: string;
        from_user_id?: string;
        to_user_id?: string;
        to_username?: string;
        status?: string;
      }>('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ username: clean }),
      });
      if (res.ok) {
        return {
          success: true,
          message: res.data?.message || 'Follow request sent successfully!',
          request_id: res.data?.request_id,
          from_user_id: res.data?.from_user_id,
          to_user_id: res.data?.to_user_id,
          to_username: res.data?.to_username || clean,
        };
      }

      // If already requested or already friends on backend (409 Conflict), resolve target ID and return success
      if (res.status === 409 || /already|exist/i.test(res.error || '')) {
        let targetId: string | undefined;
        try {
          const profile = await this.fetchUserProfileByUsername(clean);
          if (profile?.id) targetId = profile.id;
        } catch {}

        return {
          success: true,
          message: `Follow request is active for @${clean}!`,
          to_user_id: targetId,
          to_username: clean,
        };
      }

      let err = res.error || '';
      if (res.status === 404) err = `@${clean} was not found on HabitUp.`;
      else if (res.status === 400) err = err || 'Cannot send request to this user.';
      return {
        success: false,
        error: err || 'Failed to send follow request.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error.' };
    }
  }

  async fetchPendingFriendRequests(): Promise<any[]> {
    try {
      const res = await this.request<{ pending_requests?: any[]; requests?: any[] } | any[]>('/friends/requests');
      if (res.ok && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray((res.data as any).pending_requests)) return (res.data as any).pending_requests;
        if (Array.isArray((res.data as any).requests)) return (res.data as any).requests;
      }
    } catch {
      // ignore
    }
    return [];
  }

  async acceptFriendRequestOnServer(requestId: string): Promise<{ success: boolean; error?: string; friendship_id?: string }> {
    if (!isUuid(requestId)) {
      return { success: false, error: 'Invalid request UUID' };
    }
    try {
      const res = await this.request<{ friendship_id?: string }>(`/friends/requests/${requestId}/accept`, { method: 'POST' });
      return { success: res.ok, error: res.error, friendship_id: res.data?.friendship_id };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async rejectFriendRequestOnServer(requestId: string): Promise<{ success: boolean; error?: string }> {
    if (!isUuid(requestId)) {
      return { success: false, error: 'Invalid request UUID' };
    }
    try {
      const res = await this.request(`/friends/requests/${requestId}`, { method: 'DELETE' });
      return { success: res.ok, error: res.error };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async fetchFriendsFromServer(): Promise<any[]> {
    try {
      const res = await this.request<{ friends: any[] } | any[]>('/friends');
      if (res.ok && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray((res.data as any).friends)) return (res.data as any).friends;
      }
    } catch {
      // ignore
    }
    return [];
  }

  async fetchFriendHabitsFromServer(friendId: string): Promise<BackendHabit[]> {
    try {
      const res = await this.request<{ habits: BackendHabit[] } | BackendHabit[]>(`/friends/${friendId}/habits`);
      if (res.ok && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray((res.data as any).habits)) return (res.data as any).habits;
      }
    } catch {
      // ignore
    }
    return [];
  }

  async fetchFriendStatsFromServer(friendId: string, period?: string): Promise<any | null> {
    try {
      const p = period || 'month';
      const res = await this.request(`/friends/${friendId}/stats?period=${p}`);
      if (res.ok && res.data) return res.data;
    } catch {}
    return null;
  }

  async removeFriendOnServer(friendId: string): Promise<boolean> {
    try {
      const res = await this.request(`/friends/${friendId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- NOTIFICATIONS & FCM DEVICE TOKEN ---

  async registerDeviceToken(
    token: string,
    platform: string = Platform.OS,
    timezone?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!token) {
      console.log('[FCM] device-token API called: NO (token is empty)');
      return { success: false, error: 'Device token is required' };
    }

    const tz = timezone || getDetectedTimezone() || 'UTC';
    const plat = platform === 'ios' ? 'ios' : 'android';

    console.log('[FCM] device-token API called: YES');
    console.log('[FCM] API URL/path: POST /notifications/device-token');
    console.log('[FCM] FCM token generated: YES');
    console.log('[FCM] FCM token length:', token.length);
    console.log('[FCM] Authorization header exists:', !!this.accessToken);

    try {
      const res = await this.request<{ success?: boolean; message?: string }>('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({
          token,
          platform: plat,
          timezone: tz,
        }),
      });

      console.log('[FCM] Device token API status:', res.status);
      console.log('[FCM] Device token response:', JSON.stringify(res.data || res.error || ''));

      if (res.ok) {
        return {
          success: true,
          message: res.data?.message || 'Device token registered successfully',
        };
      }
      return {
        success: false,
        error: res.error || 'Failed to register device token',
      };
    } catch (err: any) {
      console.warn('[FCM] Device token API exception:', err?.message || err);
      return { success: false, error: err?.message || 'Network error' };
    }
  }

  // --- LOCAL STORAGE CACHE HELPERS ---

  getHabits(targetUserId?: string, email?: string): Habit[] {
    const uid = targetUserId || this.currentUserId;
    const directHabits = this.getStorage<Habit[]>(`habitup_habits_${uid}`, []);
    let emailHabits: Habit[] = [];
    if (email) {
      const emailUid = getUserIdFromEmail(email);
      if (emailUid !== uid) {
        emailHabits = this.getStorage<Habit[]>(`habitup_habits_${emailUid}`, []);
      }
    }
    const defaultHabits = uid === 'usr_default' ? this.getStorage<Habit[]>('habitup_habits_usr_default', []) : [];

    const combined =
      directHabits.length > 0 || emailHabits.length > 0
        ? [...directHabits, ...emailHabits]
        : [...defaultHabits];

    const seenName = new Set<string>();
    const result: Habit[] = [];
    for (const h of combined) {
      if (!h || !h.id) continue;
      const cleanName = (h.name || '').trim().toLowerCase();
      if (!cleanName || seenName.has(cleanName)) continue;
      seenName.add(cleanName);
      result.push(h);
    }
    return result;
  }

  saveHabits(habits: Habit[], targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.setStorage(`habitup_habits_${uid}`, habits);
  }

  getCompletions(targetUserId?: string, email?: string): HabitCompletion[] {
    const uid = targetUserId || this.currentUserId;
    const directCompletions = this.getStorage<HabitCompletion[]>(`habitup_completions_${uid}`, []);
    let emailCompletions: HabitCompletion[] = [];
    if (email) {
      const emailUid = getUserIdFromEmail(email);
      if (emailUid !== uid) {
        emailCompletions = this.getStorage<HabitCompletion[]>(`habitup_completions_${emailUid}`, []);
      }
    }
    const defaultCompletions = uid === 'usr_default' ? this.getStorage<HabitCompletion[]>('habitup_completions_usr_default', []) : [];

    const combined =
      directCompletions.length > 0 || emailCompletions.length > 0
        ? [...directCompletions, ...emailCompletions]
        : [...defaultCompletions];

    const seen = new Set<string>();
    return combined.filter((c) => {
      if (!c || !c.habit_id) return false;
      const dateKey = (c.completion_date || '').split('T')[0];
      const key = `${c.habit_id}_${dateKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  saveCompletions(completions: HabitCompletion[], targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.setStorage(`habitup_completions_${uid}`, completions);
  }

  getUser(targetUserId?: string): UserProfile {
    const uid = targetUserId || this.currentUserId;
    const fallback = createDefaultUserProfile('', '');
    const user = this.getStorage<UserProfile>(`habitup_user_${uid}`, fallback);
    return user && user.id ? user : fallback;
  }

  saveUser(user: UserProfile, targetUserId?: string): void {
    const uid = targetUserId || user.id || this.currentUserId;
    this.setStorage(`habitup_user_${uid}`, user);
  }

  getSessions(targetUserId?: string): UserSession[] {
    const uid = targetUserId || this.currentUserId;
    const initialSessions: UserSession[] = [
      {
        id: `sess-${Date.now()}`,
        device_id: 'dev-mobile-app',
        device_name: 'HabitUp Mobile (React Native)',
        ip_address: 'Active JWT Session',
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        is_current: true,
      },
    ];
    return this.getStorage<UserSession[]>(`habitup_sessions_${uid}`, initialSessions);
  }

  saveSessions(sessions: UserSession[], targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.setStorage(`habitup_sessions_${uid}`, sessions);
  }

  getSyncQueue(targetUserId?: string): SyncMutation[] {
    const uid = targetUserId || this.currentUserId;
    return this.getStorage<SyncMutation[]>(`habitup_sync_queue_${uid}`, []);
  }

  saveSyncQueue(queue: SyncMutation[], targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.setStorage(`habitup_sync_queue_${uid}`, queue);
  }

  resetAllData(targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.saveHabits([], uid);
    this.saveCompletions([], uid);
    this.saveSessions(this.getSessions(uid), uid);
    this.saveSyncQueue([], uid);
  }

  // --- A/B TESTING & EXPERIMENT METHODS ---

  async getExperiment(name: string): Promise<{
    experiment: string;
    experimentId: string | null;
    variant: string | null;
    friendsEnabled: boolean;
    assigned: boolean;
    active?: boolean;
    preExisting?: boolean;
  }> {
    try {
      const res = await this.request<any>(`/experiments/${encodeURIComponent(name)}`, {
        method: 'GET',
      });
      if (res.ok && res.data) {
        return {
          experiment: res.data.experiment || name,
          experimentId: res.data.experimentId || null,
          variant: res.data.variant || null,
          friendsEnabled: res.data.friendsEnabled !== false,
          assigned: !!res.data.assigned,
          active: res.data.active !== false,
          preExisting: !!res.data.preExisting,
        };
      }
    } catch (e) {
      console.warn('getExperiment error:', e);
    }
    return {
      experiment: name,
      experimentId: null,
      variant: null,
      friendsEnabled: true,
      assigned: false,
    };
  }

  async recordExperimentExposure(name: string): Promise<boolean> {
    try {
      const res = await this.request<{ ok: boolean }>(`/experiments/${encodeURIComponent(name)}/exposure`, {
        method: 'POST',
      });
      return res.ok && !!res.data?.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiClient();
export const localApi = apiService;
