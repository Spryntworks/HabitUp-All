import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  HabitCompletion,
  UserProfile,
  UserSession,
  SyncMutation,
} from '../types';

export const BACKEND_BASE_URL = 'https://habitup-backend-v2-production.up.railway.app';

export const getUserIdFromEmail = (email: string): string => {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return 'usr_default';
  return `usr_${normalized.replace(/[^a-z0-9]/g, '_')}`;
};

export const createDefaultUserProfile = (name?: string, email?: string, timezone?: string): UserProfile => {
  const cleanEmail = (email || '').trim();
  const cleanName = (name || '').trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
  return {
    id: getUserIdFromEmail(cleanEmail),
    name: cleanName,
    email: cleanEmail,
    timezone: timezone || 'Asia/Kolkata',
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

if (typeof window !== 'undefined' && window.localStorage) {
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
    this.accessToken = this.getStorage<string | null>('habitup_access_token', null);
    this.refreshToken = this.getStorage<string | null>('habitup_refresh_token', null);
    this.initAsync();
  }

  private async initAsync() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys && keys.length > 0) {
        for (const k of keys) {
          const val = await AsyncStorage.getItem(k);
          if (val !== null) memoryStore[k] = val;
        }
      }
      const uid = this.getStorage<string>('habitup_current_user_id', 'usr_default');
      this.currentUserId = uid;
      this.accessToken = this.getStorage<string | null>('habitup_access_token', null);
      this.refreshToken = this.getStorage<string | null>('habitup_refresh_token', null);
    } catch {
      // ignore
    }
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    this.setStorage('habitup_current_user_id', userId);
  }

  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  setTokens(accessToken: string | null, refreshToken?: string | null): void {
    this.accessToken = accessToken;
    this.setStorage('habitup_access_token', accessToken);
    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
      this.setStorage('habitup_refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    delete memoryStore['habitup_access_token'];
    delete memoryStore['habitup_refresh_token'];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('habitup_access_token');
        window.localStorage.removeItem('habitup_refresh_token');
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
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let res = await fetch(url, { ...options, headers });

      if (
        res.status === 401 &&
        this.refreshToken &&
        !endpoint.includes('/auth/refresh') &&
        !endpoint.includes('/auth/login')
      ) {
        const refreshed = await this.refreshAuthTokens();
        if (refreshed && this.accessToken) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          res = await fetch(url, { ...options, headers });
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
      return { ok: false, status: 0, error: err?.message || 'Network connection error' };
    }
  }

  async refreshAuthTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async registerUser(
    name: string,
    email: string,
    password: string,
    timezone?: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'User';
    const tz = timezone || 'Asia/Kolkata';

    const res = await this.request<{ accessToken: string; refreshToken?: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password,
        timezone: tz,
      }),
    });

    if (res.ok && res.data?.user) {
      const user = res.data.user;
      this.setCurrentUserId(user.id);
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      this.saveUser(user, user.id);
      return { success: true, user, accessToken: res.data.accessToken };
    }

    // Check for duplicate account or bad request
    if (!res.ok) {
      const err = res.error || '';
      if (
        res.status === 409 ||
        res.status === 400 ||
        res.status === 422 ||
        /exist|already|duplicate/i.test(err)
      ) {
        return {
          success: false,
          error: /exist|already|duplicate/i.test(err)
            ? err
            : 'An account with this email already exists. Please sign in instead.',
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
      timezone: tz,
      avatar: '',
      created_at: new Date().toISOString(),
    };
    this.setCurrentUserId(uid);
    this.saveUser(offlineUser, uid);
    return { success: true, user: offlineUser };
  }

  async loginUser(
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }

    if (password) {
      const res = await this.request<{ accessToken: string; refreshToken?: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (res.ok && res.data?.user) {
        const user = res.data.user;
        this.setCurrentUserId(user.id);
        this.setTokens(res.data.accessToken, res.data.refreshToken);
        this.saveUser(user, user.id);
        return { success: true, user, accessToken: res.data.accessToken };
      }

      // Explicit authentication failure (Wrong password or email not found)
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
          error: res.error && !res.error.includes('status') ? res.error : 'Incorrect email or password. Please try again.',
        };
      }

      if (res.status === 0 || res.status >= 500) {
        return {
          success: false,
          error: 'Cannot connect to authentication server. Please check your internet connection.',
        };
      }
    }

    const uid = getUserIdFromEmail(cleanEmail);
    const existing = this.getUser(uid);
    const userToUse: UserProfile = existing && existing.id
      ? existing
      : createDefaultUserProfile(cleanEmail.split('@')[0], cleanEmail);
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
        return this.mapBackendHabitToLocal(
          res.data.habit,
          habitData.reminder_time,
          habitData.reminder_enabled,
          habitData.scheduled_days
        );
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
          try {
            const res = await this.request<{ completions: any[] }>(`/habits/${habit.id}/completions`);
            if (res.ok && Array.isArray(res.data?.completions)) {
              res.data.completions.forEach((c) => {
                const dateKey = (c.completed_on || c.completion_date || '').split('T')[0];
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
          } catch {
            // ignore per habit
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
    const defaultHabits = this.getStorage<Habit[]>('habitup_habits_usr_default', []);

    const combined = [...directHabits, ...emailHabits, ...defaultHabits];
    const seen = new Set<string>();
    return combined.filter((h) => {
      if (!h || !h.id) return false;
      const key = `${h.id}_${h.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
    const defaultCompletions = this.getStorage<HabitCompletion[]>('habitup_completions_usr_default', []);

    const combined = [...directCompletions, ...emailCompletions, ...defaultCompletions];
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
}

export const apiService = new ApiClient();
export const localApi = apiService;
