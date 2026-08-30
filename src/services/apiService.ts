import {
  Habit,
  HabitCompletion,
  UserProfile,
  UserSession,
  SyncMutation,
} from '../types';

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
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    avatar: '',
    created_at: new Date().toISOString(),
  };
};

export interface StoredCredentials {
  email: string;
  passwordHash: string;
  name: string;
  userId: string;
  timezone?: string;
}

export interface BackendHabitResponse {
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

export interface BackendReminderResponse {
  id: string;
  habit_id: string;
  user_id: string;
  time: string;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BackendStatsResponse {
  period: 'month' | 'year';
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

class ApiClient {
  private currentUserId: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.currentUserId = this.getStorage<string>('habitup_current_user_id', 'usr_default');
    this.accessToken = this.getStorage<string | null>('habitup_access_token', null);
    this.refreshToken = this.getStorage<string | null>('habitup_refresh_token', null);
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
    try {
      localStorage.removeItem('habitup_access_token');
      localStorage.removeItem('habitup_refresh_token');
    } catch {
      // ignore
    }
  }

  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  }

  // Common fetch wrapper with Authorization header and automatic token refresh retry
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    if (this.currentUserId) {
      headers['x-user-id'] = this.currentUserId;
    }

    try {
      let res = await fetch(endpoint, { ...options, headers });

      // If token expired, attempt refresh once
      if (res.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        const refreshed = await this.refreshAuthTokens();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          res = await fetch(endpoint, { ...options, headers });
        }
      }

      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const json = isJson ? await res.json() : null;

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: json?.error || `Request failed with status ${res.status}`,
        };
      }

      return { ok: true, status: res.status, data: json };
    } catch (err: any) {
      return { ok: false, status: 0, error: err?.message || 'Network error' };
    }
  }

  // Token refresh rotation
  async refreshAuthTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch('/auth/refresh', {
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

  // -------------------------------------------------------------
  // AUTHENTICATION (Matching Spryntworks/habitup-backend /auth/*)
  // -------------------------------------------------------------
  async registerUser(
    name: string,
    email: string,
    password: string,
    timezone?: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'User';
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

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

    // Fallback registration locally if offline
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
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();

    const res = await this.request<{ accessToken: string; refreshToken: string; user: UserProfile }>('/auth/login', {
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

    if (res.status === 401 || res.status === 400) {
      return { success: false, error: res.error || 'Invalid email or password.' };
    }

    // Fallback offline login
    const uid = getUserIdFromEmail(cleanEmail);
    const existing = this.getUser(uid);
    this.setCurrentUserId(uid);
    return { success: true, user: existing };
  }

  async socialAuthUser(
    provider: 'google' | 'apple',
    profile: { name: string; email: string; avatar?: string; timezone?: string }
  ): Promise<{ success: boolean; user?: UserProfile; accessToken?: string; error?: string }> {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    const cleanName = (profile.name || '').trim() || (provider === 'google' ? 'Google User' : 'Apple User');
    const tz = profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const socialSecret = `SocialPass#${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}#2026!`;

    // 1. Try logging into the backend with the social credentials
    const loginRes = await this.loginUser(cleanEmail, socialSecret);
    if (loginRes.success && loginRes.user) {
      if (profile.avatar && !loginRes.user.avatar) {
        loginRes.user.avatar = profile.avatar;
        this.saveUser(loginRes.user, loginRes.user.id);
      }
      return loginRes;
    }

    // 2. If not registered, register user on the backend
    const regRes = await this.registerUser(cleanName, cleanEmail, socialSecret, tz);
    if (regRes.success && regRes.user) {
      if (profile.avatar) {
        regRes.user.avatar = profile.avatar;
        this.saveUser(regRes.user, regRes.user.id);
      }
      return regRes;
    }

    // 3. Offline / local fallback
    const uid = getUserIdFromEmail(cleanEmail);
    const localUser: UserProfile = {
      id: uid,
      name: cleanName,
      email: cleanEmail,
      timezone: tz,
      avatar: profile.avatar || '',
      created_at: new Date().toISOString(),
    };
    this.setCurrentUserId(uid);
    this.saveUser(localUser, uid);
    return { success: true, user: localUser };
  }

  async getMe(): Promise<UserProfile | null> {
    const res = await this.request<{ user: UserProfile }>('/auth/me', { method: 'GET' });
    if (res.ok && res.data?.user) {
      this.saveUser(res.data.user, res.data.user.id);
      return res.data.user;
    }
    return null;
  }

  async logoutUser(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch {
        // ignore
      }
    }
    this.clearTokens();
  }

  async logoutAllSessions(): Promise<void> {
    await this.request('/auth/logout-all', { method: 'POST' });
    this.clearTokens();
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const res = await this.request<{ message: string }>('/auth/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return {
      success: res.ok,
      message: res.data?.message || 'If that email exists, a password reset link has been sent.',
    };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await this.request<{ message: string }>('/auth/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    return {
      success: res.ok,
      message: res.data?.message || (res.ok ? 'Password reset successfully.' : res.error || 'Reset failed'),
    };
  }

  // -------------------------------------------------------------
  // HABITS API (Matching Spryntworks/habitup-backend /habits/*)
  // -------------------------------------------------------------
  async fetchHabits(targetUserId?: string): Promise<Habit[]> {
    const uid = targetUserId || this.currentUserId;
    const res = await this.request<{ habits: BackendHabitResponse[] }>('/habits', { method: 'GET' });

    if (res.ok && Array.isArray(res.data?.habits)) {
      const converted: Habit[] = res.data.habits.map((h) => ({
        id: h.id,
        user_id: h.user_id || uid,
        name: h.name,
        description: h.description || '',
        icon: h.icon || '🎯',
        color: h.color || '#10B981',
        frequency_type: h.frequency_type === 'daily' ? 'daily' : 'custom_days',
        scheduled_days: Array.isArray(h.schedule) ? h.schedule : [0, 1, 2, 3, 4, 5, 6],
        reminder_enabled: false,
        created_at: h.created_at || new Date().toISOString(),
        updated_at: h.updated_at || h.created_at || new Date().toISOString(),
        paused_at: h.paused_at,
        archived_at: h.archived_at,
        deleted_at: h.deleted_at,
      }));

      this.saveHabits(converted, uid);
      return converted;
    }

    return this.getHabits(uid);
  }

  async fetchArchivedHabits(targetUserId?: string): Promise<Habit[]> {
    const uid = targetUserId || this.currentUserId;
    const res = await this.request<{ habits: BackendHabitResponse[] }>('/habits/archived', { method: 'GET' });

    if (res.ok && Array.isArray(res.data?.habits)) {
      return res.data.habits.map((h) => ({
        id: h.id,
        user_id: h.user_id || uid,
        name: h.name,
        description: h.description || '',
        icon: h.icon || '🎯',
        color: h.color || '#10B981',
        frequency_type: h.frequency_type === 'daily' ? 'daily' : 'custom_days',
        scheduled_days: Array.isArray(h.schedule) ? h.schedule : [0, 1, 2, 3, 4, 5, 6],
        reminder_enabled: false,
        created_at: h.created_at,
        updated_at: h.updated_at || h.created_at,
        paused_at: h.paused_at,
        archived_at: h.archived_at,
        deleted_at: h.deleted_at,
      }));
    }
    return this.getHabits(uid).filter((h) => !!h.archived_at);
  }

  async createHabit(habit: Habit, targetUserId?: string): Promise<Habit> {
    const uid = targetUserId || this.currentUserId;
    const payload = {
      name: habit.name,
      description: habit.description || null,
      icon: habit.icon,
      color: habit.color,
      frequency_type: habit.frequency_type === 'daily' ? 'daily' : 'scheduled',
      schedule: habit.scheduled_days,
    };

    const res = await this.request<{ habit: BackendHabitResponse }>('/habits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data?.habit) {
      const serverHabit = res.data.habit;
      const completeHabit: Habit = {
        ...habit,
        id: serverHabit.id,
        user_id: serverHabit.user_id || uid,
        created_at: serverHabit.created_at,
        updated_at: serverHabit.updated_at || serverHabit.created_at,
      };

      // If reminder is attached, create reminder on backend
      if (habit.reminder_time && habit.reminder_enabled) {
        this.createReminder(completeHabit.id, habit.reminder_time);
      }

      return completeHabit;
    }

    return { ...habit, user_id: uid };
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.frequency_type !== undefined) {
      payload.frequency_type = updates.frequency_type === 'daily' ? 'daily' : 'scheduled';
    }
    if (updates.scheduled_days !== undefined) {
      payload.schedule = updates.scheduled_days;
    }

    await this.request(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteHabit(id: string): Promise<void> {
    await this.request(`/habits/${id}`, { method: 'DELETE' });
  }

  async pauseHabit(id: string): Promise<void> {
    await this.request(`/habits/${id}/pause`, { method: 'PATCH' });
  }

  async unpauseHabit(id: string): Promise<void> {
    await this.request(`/habits/${id}/unpause`, { method: 'PATCH' });
  }

  async archiveHabit(id: string): Promise<void> {
    await this.request(`/habits/${id}/archive`, { method: 'PATCH' });
  }

  async unarchiveHabit(id: string): Promise<void> {
    await this.request(`/habits/${id}/unarchive`, { method: 'PATCH' });
  }

  // -------------------------------------------------------------
  // COMPLETIONS API (Matching Spryntworks/habitup-backend)
  // -------------------------------------------------------------
  async toggleCompletion(habitId: string, dateStr?: string): Promise<{ completion?: HabitCompletion; streak?: number }> {
    const today = dateStr || new Date().toISOString().slice(0, 10);
    const existing = this.getCompletions().find((c) => c.habit_id === habitId && c.completion_date === today);
    if (existing) {
      const res = await this.removeCompletion(habitId, today);
      return { streak: res.streak };
    } else {
      return await this.addCompletion(habitId);
    }
  }

  async addCompletion(habitId: string): Promise<{ completion?: HabitCompletion; streak?: number }> {
    const res = await this.request<{ completion: any; streak: number }>(`/habits/${habitId}/completions`, {
      method: 'POST',
    });
    if (res.ok && res.data) {
      return {
        completion: {
          id: res.data.completion.id,
          habit_id: res.data.completion.habit_id,
          user_id: res.data.completion.user_id,
          completion_date: res.data.completion.completion_date,
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

  // -------------------------------------------------------------
  // REMINDERS API (Matching Spryntworks/habitup-backend)
  // -------------------------------------------------------------
  async createReminder(habitId: string, time: string): Promise<BackendReminderResponse | null> {
    const res = await this.request<{ reminder: BackendReminderResponse }>(`/habits/${habitId}/reminders`, {
      method: 'POST',
      body: JSON.stringify({ time }),
    });
    return res.ok && res.data ? res.data.reminder : null;
  }

  async getReminders(habitId: string): Promise<BackendReminderResponse[]> {
    const res = await this.request<{ reminders: BackendReminderResponse[] }>(`/habits/${habitId}/reminders`, {
      method: 'GET',
    });
    return res.ok && Array.isArray(res.data?.reminders) ? res.data.reminders : [];
  }

  async updateReminder(reminderId: string, fields: { time?: string; enabled?: boolean }): Promise<void> {
    await this.request(`/reminders/${reminderId}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  }

  async deleteReminder(reminderId: string): Promise<void> {
    await this.request(`/reminders/${reminderId}`, {
      method: 'DELETE',
    });
  }

  // -------------------------------------------------------------
  // STATS API (Matching Spryntworks/habitup-backend)
  // -------------------------------------------------------------
  async getHabitStats(habitId: string, period: 'month' | 'year' = 'month') {
    const res = await this.request<{
      habit_id: string;
      period: string;
      current_streak: number;
      best_streak: number;
      total_completions: number;
      completion_rate: number;
    }>(`/habits/${habitId}/stats?period=${period}`, { method: 'GET' });
    return res.ok ? res.data : null;
  }

  async getUserStats(period: 'month' | 'year' = 'month'): Promise<BackendStatsResponse | null> {
    const res = await this.request<BackendStatsResponse>(`/stats?period=${period}`, { method: 'GET' });
    return res.ok && res.data ? res.data : null;
  }

  // Backend Health check
  async checkHealth(): Promise<{ status: string; db: string }> {
    const res = await this.request<{ status: string; db: string }>('/health', { method: 'GET' });
    return res.ok && res.data ? res.data : { status: 'offline', db: 'unknown' };
  }

  // -------------------------------------------------------------
  // LOCAL STORAGE & CACHE SYNCHRONIZATION HELPERS
  // -------------------------------------------------------------
  getHabits(targetUserId?: string): Habit[] {
    const uid = targetUserId || this.currentUserId;
    return this.getStorage<Habit[]>(`habitup_habits_${uid}`, []);
  }

  saveHabits(habits: Habit[], targetUserId?: string): void {
    const uid = targetUserId || this.currentUserId;
    this.setStorage(`habitup_habits_${uid}`, habits);
  }

  getCompletions(targetUserId?: string): HabitCompletion[] {
    const uid = targetUserId || this.currentUserId;
    return this.getStorage<HabitCompletion[]>(`habitup_completions_${uid}`, []);
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
        device_id: 'dev-browser-current',
        device_name: 'Current Session (Spryntworks API)',
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

  async fetchCompletions(targetUserId?: string): Promise<HabitCompletion[]> {
    const uid = targetUserId || this.currentUserId;
    return this.getCompletions(uid);
  }

  async syncMutations(mutations: SyncMutation[], targetUserId?: string) {
    return { success: true };
  }
}

export const apiService = new ApiClient();
export const localApi = apiService;
