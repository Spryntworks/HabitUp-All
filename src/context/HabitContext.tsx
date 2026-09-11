import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  HabitCompletion,
  UserProfile,
  UserSession,
  SyncMutation,
  TabType,
  DeviceFrameType,
  ColorTheme,
  HabitCalculatedStats,
  OverallStats,
  FriendUser,
  FriendPublicHabit,
  FollowRequestItem,
  SocialFeedActivity,
} from '../types';
import { INITIAL_FRIENDS, INITIAL_FEED } from '../constants/socialData';
import { getDetectedTimezone } from '../constants/timezones';
import { localApi, getUserIdFromEmail, createDefaultUserProfile, isUuid } from '../services/apiService';
import {
  notificationService,
  InAppNotification,
  requestNotificationPermission,
  registerForPushNotificationsAsync,
  getCachedPushToken,
  setupNotificationListeners,
} from '../services/notificationService';
import { soundService } from '../services/soundService';
import {
  formatDateKey,
  calculateHabitStats,
  calculatePlantStreak,
  isHabitScheduledOnDate,
  getWeekDays,
  getUserInviteCode,
  formatFriendDisplayName,
} from '../utils/streakCalculator';

interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
  undoAction?: () => void;
}

interface HabitContextType {
  habits: Habit[];
  completions: HabitCompletion[];
  user: UserProfile;
  sessions: UserSession[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  deviceFrame: DeviceFrameType;
  setDeviceFrame: (frame: DeviceFrameType) => void;
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  syncQueue: SyncMutation[];
  toast: ToastData | null;
  showToast: (message: string, undoAction?: () => void, type?: 'success' | 'info' | 'warning') => void;
  clearToast: () => void;
  
  // Modals & Auth State
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isBiometricModalOpen: boolean;
  setIsBiometricModalOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isPlantGardenModalOpen: boolean;
  setIsPlantGardenModalOpen: (open: boolean) => void;
  selectedHabitForDetail: Habit | null;
  setSelectedHabitForDetail: (habit: Habit | null) => void;
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
  isAuthSessionModalOpen: boolean;
  setIsAuthSessionModalOpen: (open: boolean) => void;
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: (open: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  fcmPushToken: string | null;
  registerPushToken: () => Promise<string | null>;
  triggerTestNotification: (title?: string, body?: string) => void;
  sendHabitReminder: (habit: Habit) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  setFilterStatus: (status: 'all' | 'active' | 'paused' | 'archived') => void;

  // Auth Actions
  isAuthLoading: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string, username?: string, timezone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  biometricLogin: () => void;
  socialLogin: (provider: 'apple' | 'google') => void;

  // Actions
  toggleCompletion: (habitId: string, dateStr?: string) => void;
  createHabit: (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Habit;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  pauseHabit: (habitId: string) => void;
  resumeHabit: (habitId: string) => void;
  archiveHabit: (habitId: string) => void;
  unarchiveHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  resetAllData: () => void;
  importJsonData: (json: string) => boolean;
  exportJsonData: () => string;
  triggerCelebration: () => void;
  isSyncing: boolean;
  syncWithBackend: () => Promise<void>;
  
  // Stats helpers
  getHabitStats: (habitId: string, refDate?: Date) => HabitCalculatedStats;
  overallStats: OverallStats;

  // Social & Friends Hub
  friends: FriendUser[];
  socialFeed: SocialFeedActivity[];
  incomingRequests: FollowRequestItem[];
  sendFriendRequestByUsername: (username: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  acceptFollowRequest: (requestId: string, friendUsername?: string) => Promise<void>;
  declineFollowRequest: (requestId: string) => Promise<void>;
  unfollowFriendHabit: (habitId: string, habitName?: string) => void;
  adoptFriendHabit: (habit: FriendPublicHabit, friendId: string, friendName: string, friendAvatar?: string) => Promise<void>;
  createSharedHabit: (friendId: string, habitName: string, icon?: string, color?: string, time?: string) => void;
  addFriendByCodeOrUsername: (input: string) => void;
  nudgeFriend: (friendId: string, habitName: string) => void;
  toggleFriendHabitCompletion: (friendId: string, habitId: string) => void;
  sendKudos: (activityId: string) => void;
  sendFriendRequest: (friendId: string) => void;
  acceptFriendRequest: (friendId: string) => void;
  removeFriend: (friendId: string) => void;
  syncFollowRequests: (currentUser: UserProfile | null) => Promise<void>;
  syncFriendsWithBackend: (currentUser: UserProfile | null) => Promise<void>;

  // A/B Testing & Experiments
  friendsEnabled: boolean;
  experimentVariant: string | null;
  recordFriendsExposure: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | null>(null);

function deduplicateHabits(list: Habit[]): Habit[] {
  if (!Array.isArray(list)) return [];
  const nameMap = new Map<string, Habit>();

  for (const h of list) {
    if (!h || !h.id) continue;
    const cleanName = (h.name || '').trim().toLowerCase();
    if (!cleanName) continue;

    const existing = nameMap.get(cleanName);
    if (!existing) {
      nameMap.set(cleanName, { ...h });
    } else {
      // Merge into the best habit record
      const existingIsActive = !existing.deleted_at && !existing.archived_at;
      const currentIsActive = !h.deleted_at && !h.archived_at;

      // Prefer the active habit over a deleted/archived one
      const base = (!existingIsActive && currentIsActive) ? h : existing;
      const other = (!existingIsActive && currentIsActive) ? existing : h;

      const merged: Habit = {
        ...base,
        is_shared: base.is_shared || other.is_shared || false,
        buddy_id: base.buddy_id || other.buddy_id,
        buddy_name: base.buddy_name || other.buddy_name,
        buddy_avatar: base.buddy_avatar || other.buddy_avatar,
        description: base.description || other.description,
        icon: base.icon || other.icon || 'Target',
        color: base.color || other.color || '#7C5CFF',
        reminder_time: base.reminder_time || other.reminder_time,
        reminder_enabled: base.reminder_enabled || other.reminder_enabled,
      };

      nameMap.set(cleanName, merged);
    }
  }

  return Array.from(nameMap.values());
}

export function deduplicateFriendHabits(list: FriendPublicHabit[]): FriendPublicHabit[] {
  if (!Array.isArray(list)) return [];
  const nameMap = new Map<string, FriendPublicHabit>();

  for (const fh of list) {
    if (!fh || !fh.name) continue;
    const cleanName = fh.name.trim().toLowerCase();
    if (!cleanName) continue;

    const existing = nameMap.get(cleanName);
    if (!existing) {
      nameMap.set(cleanName, { ...fh });
    } else {
      const bestStreak = Math.max(existing.currentStreak || 0, fh.currentStreak || 0);
      const isDone = existing.isCompletedToday || fh.isCompletedToday;
      const weekly = (existing.weeklyHistory || [false, false, false, false, false, false, false]).map(
        (val, idx) => val || (fh.weeklyHistory && fh.weeklyHistory[idx]) || false
      );

      nameMap.set(cleanName, {
        ...existing,
        currentStreak: bestStreak,
        isCompletedToday: isDone,
        weeklyHistory: weekly,
        adoptersCount: Math.max(existing.adoptersCount || 1, fh.adoptersCount || 1),
        description: existing.description || fh.description,
        icon: existing.icon || fh.icon || 'Target',
        color: existing.color || fh.color || '#7C5CFF',
        reminder_time: existing.reminder_time || fh.reminder_time || '08:00',
      });
    }
  }

  return Array.from(nameMap.values());
}

function deduplicateCompletions(list: HabitCompletion[]): HabitCompletion[] {
  const seen = new Set<string>();
  const result: HabitCompletion[] = [];
  for (const c of list) {
    if (!c || !c.habit_id) continue;
    const dateKey = (c.completion_date || '').split('T')[0];
    if (!dateKey) continue;
    const key = `${c.habit_id}_${dateKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        ...c,
        completion_date: dateKey,
      });
    }
  }
  return result;
}

export interface MutualUserRef {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

export interface MutualConnectionRecord {
  id: string;
  userA: MutualUserRef;
  userB: MutualUserRef;
  createdAt: string;
}

export interface MutualSharedHabitRecord {
  id: string;
  habitName: string;
  icon: string;
  color: string;
  time: string;
  userA: MutualUserRef;
  userB: MutualUserRef;
  createdAt: string;
}

export interface FriendNudgeRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderEmail?: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName?: string;
  recipientUsername?: string;
  recipientEmail?: string;
  habitName: string;
  habitIcon?: string;
  habitColor?: string;
  timestamp: string;
  delivered: boolean;
  deliveredAt?: string;
}

export async function getPendingNudges(): Promise<FriendNudgeRecord[]> {
  try {
    const raw = await AsyncStorage.getItem('habitup_pending_nudges_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePendingNudge(nudge: FriendNudgeRecord): Promise<void> {
  try {
    const list = await getPendingNudges();
    list.push(nudge);
    await AsyncStorage.setItem('habitup_pending_nudges_v1', JSON.stringify(list));
  } catch (e) {
    console.warn('savePendingNudge error:', e);
  }
}

export async function getStoredFollowRequests(): Promise<FollowRequestItem[]> {
  try {
    const raw = await AsyncStorage.getItem('habitup_friend_requests_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveStoredFollowRequests(requests: FollowRequestItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem('habitup_friend_requests_v1', JSON.stringify(requests));
  } catch (e) {
    console.warn('saveStoredFollowRequests error:', e);
  }
}

async function getMutualConnections(): Promise<MutualConnectionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem('habitup_mutual_connections_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMutualConnection(userA: MutualUserRef, userB: MutualUserRef): Promise<void> {
  try {
    const connections = await getMutualConnections();
    const keyA = (userA.id || userA.email || userA.name).toLowerCase();
    const keyB = (userB.id || userB.email || userB.name).toLowerCase();
    const connKey = [keyA, keyB].sort().join('___');

    const existingIdx = connections.findIndex(
      (c) =>
        [(c.userA.id || c.userA.email || c.userA.name).toLowerCase(), (c.userB.id || c.userB.email || c.userB.name).toLowerCase()]
          .sort()
          .join('___') === connKey
    );

    const newRecord: MutualConnectionRecord = {
      id: `conn_${connKey}`,
      userA,
      userB,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      connections[existingIdx] = newRecord;
    } else {
      connections.push(newRecord);
    }
    await AsyncStorage.setItem('habitup_mutual_connections_v1', JSON.stringify(connections));
  } catch (e) {
    console.warn('saveMutualConnection error:', e);
  }
}

async function getMutualSharedHabits(): Promise<MutualSharedHabitRecord[]> {
  try {
    const raw = await AsyncStorage.getItem('habitup_mutual_shared_habits_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMutualSharedHabit(
  habitName: string,
  icon: string,
  color: string,
  time: string,
  userA: MutualUserRef,
  userB: MutualUserRef
): Promise<void> {
  try {
    const habitsList = await getMutualSharedHabits();
    const cleanHabitName = habitName.trim().toLowerCase();
    const keyA = (userA.id || userA.email || userA.name).toLowerCase();
    const keyB = (userB.id || userB.email || userB.name).toLowerCase();
    const connKey = [keyA, keyB].sort().join('___');
    const recordKey = `${connKey}___${cleanHabitName}`;

    const existingIdx = habitsList.findIndex((h) => {
      const hKeyA = (h.userA.id || h.userA.email || h.userA.name).toLowerCase();
      const hKeyB = (h.userB.id || h.userB.email || h.userB.name).toLowerCase();
      const hConnKey = [hKeyA, hKeyB].sort().join('___');
      return `${hConnKey}___${h.habitName.trim().toLowerCase()}` === recordKey;
    });

    const newRecord: MutualSharedHabitRecord = {
      id: `shared_${recordKey}`,
      habitName: habitName.trim(),
      icon: icon || 'Target',
      color: color || '#7C5CFF',
      time: time || '08:00',
      userA,
      userB,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      habitsList[existingIdx] = newRecord;
    } else {
      habitsList.push(newRecord);
    }

    await AsyncStorage.setItem('habitup_mutual_shared_habits_v1', JSON.stringify(habitsList));
  } catch (e) {
    console.warn('saveMutualSharedHabit error:', e);
  }
}

async function removeMutualRecords(
  userIdOrEmail: string,
  friendIdOrEmail: string,
  friendUsername?: string,
  friendName?: string
): Promise<void> {
  try {
    const uKey = (userIdOrEmail || '').toLowerCase();
    const fKey = (friendIdOrEmail || '').toLowerCase();
    const fUser = (friendUsername || '').replace(/^@/, '').toLowerCase();
    const fName = (friendName || '').toLowerCase();

    const isMatch = (ref: MutualUserRef) => {
      if (!ref) return false;
      const rId = (ref.id || '').toLowerCase();
      const rEmail = (ref.email || '').toLowerCase();
      const rUser = (ref.username || '').replace(/^@/, '').toLowerCase();
      const rName = (ref.name || '').toLowerCase();

      return (
        (fKey && (rId === fKey || rEmail === fKey)) ||
        (fUser && (rUser === fUser || rId.includes(fUser))) ||
        (fName && rName === fName)
      );
    };

    const isUser = (ref: MutualUserRef) => {
      if (!ref) return false;
      const rId = (ref.id || '').toLowerCase();
      const rEmail = (ref.email || '').toLowerCase();
      return uKey && (rId === uKey || rEmail === uKey);
    };

    const connections = await getMutualConnections();
    const filteredConns = connections.filter((c) => {
      const match = (isUser(c.userA) && isMatch(c.userB)) || (isUser(c.userB) && isMatch(c.userA)) || isMatch(c.userA) || isMatch(c.userB);
      return !match;
    });
    await AsyncStorage.setItem('habitup_mutual_connections_v1', JSON.stringify(filteredConns));

    const habitsList = await getMutualSharedHabits();
    const filteredHabits = habitsList.filter((h) => {
      const match = (isUser(h.userA) && isMatch(h.userB)) || (isUser(h.userB) && isMatch(h.userA)) || isMatch(h.userA) || isMatch(h.userB);
      return !match;
    });
    await AsyncStorage.setItem('habitup_mutual_shared_habits_v1', JSON.stringify(filteredHabits));
  } catch {}
}

async function removeMutualSharedHabitRecord(userIdOrEmail: string, friendIdOrEmail: string, habitName: string): Promise<void> {
  try {
    const uKey = (userIdOrEmail || '').toLowerCase();
    const fKey = (friendIdOrEmail || '').toLowerCase();
    const hName = (habitName || '').trim().toLowerCase();

    const habitsList = await getMutualSharedHabits();
    const filteredHabits = habitsList.filter((h) => {
      const aId = (h.userA.id || '').toLowerCase();
      const aEmail = (h.userA.email || '').toLowerCase();
      const bId = (h.userB.id || '').toLowerCase();
      const bEmail = (h.userB.email || '').toLowerCase();
      const sameHabit = h.habitName.trim().toLowerCase() === hName;
      const match =
        sameHabit &&
        (((aId === uKey || aEmail === uKey) && (bId === fKey || bEmail === fKey)) ||
          ((aId === fKey || aEmail === fKey) && (bId === uKey || bEmail === uKey)));
      return !match;
    });
    await AsyncStorage.setItem('habitup_mutual_shared_habits_v1', JSON.stringify(filteredHabits));
  } catch {}
}

export function getDefaultFriendStarterHabits(friendName: string): FriendPublicHabit[] {
  const seed = (friendName || 'friend').toLowerCase();
  if (seed.includes('ram')) {
    return [
      {
        id: `fh-seed-1-${seed}`,
        name: 'Morning 5km Run',
        description: 'Morning cardio & endurance run 🏃',
        icon: 'Activity',
        color: '#FF6B6B',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '06:30',
        currentStreak: 5,
        isCompletedToday: false,
        adoptersCount: 3,
        weeklyHistory: [true, true, true, true, true, false, false],
      },
      {
        id: `fh-seed-2-${seed}`,
        name: 'Deep Meditation',
        description: 'Mindfulness & breathwork 🧘',
        icon: 'Sparkles',
        color: '#7C5CFF',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '07:00',
        currentStreak: 3,
        isCompletedToday: false,
        adoptersCount: 2,
        weeklyHistory: [true, true, true, false, false, false, false],
      },
      {
        id: `fh-seed-3-${seed}`,
        name: 'Drink 3L Water',
        description: 'Daily hydration goal 💧',
        icon: 'Droplets',
        color: '#38BDF8',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '09:00',
        currentStreak: 7,
        isCompletedToday: false,
        adoptersCount: 4,
        weeklyHistory: [true, true, true, true, true, true, false],
      },
    ];
  } else if (seed.includes('vijay')) {
    return [
      {
        id: `fh-seed-1-${seed}`,
        name: 'Strength Workout',
        description: 'Resistance and core training 🏋️',
        icon: 'Dumbbell',
        color: '#EF4444',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '18:00',
        currentStreak: 4,
        isCompletedToday: false,
        adoptersCount: 2,
        weeklyHistory: [true, true, true, true, false, false, false],
      },
      {
        id: `fh-seed-2-${seed}`,
        name: 'Read 20 Pages',
        description: 'Daily book reading & learning 📚',
        icon: 'BookOpen',
        color: '#F59E0B',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '21:00',
        currentStreak: 6,
        isCompletedToday: false,
        adoptersCount: 3,
        weeklyHistory: [true, true, true, true, true, true, false],
      },
      {
        id: `fh-seed-3-${seed}`,
        name: 'LeetCode Daily',
        description: 'Solve 1 algorithmic problem 💻',
        icon: 'Cpu',
        color: '#10B981',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: '08:30',
        currentStreak: 8,
        isCompletedToday: false,
        adoptersCount: 5,
        weeklyHistory: [true, true, true, true, true, true, true],
      },
    ];
  }
  return [
    {
      id: `fh-seed-1-${seed}`,
      name: 'Morning 5km Run',
      description: 'Morning cardio & endurance run 🏃',
      icon: 'Activity',
      color: '#FF6B6B',
      frequency_type: 'daily',
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      reminder_time: '06:30',
      currentStreak: 4,
      isCompletedToday: false,
      adoptersCount: 2,
      weeklyHistory: [true, true, true, true, false, false, false],
    },
    {
      id: `fh-seed-2-${seed}`,
      name: 'Read 20 Pages',
      description: 'Daily book reading & learning 📚',
      icon: 'BookOpen',
      color: '#F59E0B',
      frequency_type: 'daily',
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      reminder_time: '21:00',
      currentStreak: 5,
      isCompletedToday: false,
      adoptersCount: 3,
      weeklyHistory: [true, true, true, true, true, false, false],
    },
    {
      id: `fh-seed-3-${seed}`,
      name: 'Drink 3L Water',
      description: 'Daily hydration goal 💧',
      icon: 'Droplets',
      color: '#38BDF8',
      frequency_type: 'daily',
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      reminder_time: '09:00',
      currentStreak: 6,
      isCompletedToday: false,
      adoptersCount: 4,
      weeklyHistory: [true, true, true, true, true, true, false],
    },
  ];
}

export async function publishUserHabits(
  user: UserProfile | null,
  habits: Habit[],
  completions: HabitCompletion[]
): Promise<void> {
  if (!user || !user.id) return;
  try {
    const raw = await AsyncStorage.getItem('habitup_public_habits_catalog_v1');
    const catalog: Record<string, { userId: string; habits: Habit[]; completions: HabitCompletion[]; updatedAt: string }> = raw
      ? JSON.parse(raw)
      : {};

    const cleanHabits = habits.filter((h) => !h.deleted_at && !h.archived_at);
    const entry = {
      userId: user.id,
      habits: cleanHabits,
      completions,
      updatedAt: new Date().toISOString(),
    };

    if (user.id) catalog[user.id.toLowerCase()] = entry;
    if (user.email && user.email.includes('@')) catalog[user.email.toLowerCase().trim()] = entry;
    if (user.username) {
      const cleanUsername = user.username.replace(/^@/, '').toLowerCase().trim();
      if (cleanUsername) catalog[`username_${cleanUsername}`] = entry;
    }

    await AsyncStorage.setItem('habitup_public_habits_catalog_v1', JSON.stringify(catalog));
  } catch (e) {
    console.warn('publishUserHabits error:', e);
  }
}

export async function getFriendPublicHabits(
  friendId: string,
  friendEmail?: string,
  friendName?: string,
  existingHabits?: FriendPublicHabit[],
  excludeUserId?: string,
  excludeEmail?: string,
  excludeUsername?: string,
  friendUsername?: string
): Promise<FriendPublicHabit[]> {
  try {
    const todayStr = formatDateKey(new Date());
    const weekDays = getWeekDays(new Date());

    const cleanFriendId = (friendId || '').trim().toLowerCase();
    const cleanFriendEmail = (friendEmail || '').trim().toLowerCase();
    const cleanFriendName = (friendName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFriendUsername = (friendUsername || '').replace(/^@/, '').trim().toLowerCase();

    const cleanExcludeId = (excludeUserId || '').trim().toLowerCase();
    const cleanExcludeEmail = (excludeEmail || '').trim().toLowerCase();
    const cleanExcludeUsername = (excludeUsername || '').replace(/^@/, '').trim().toLowerCase();

    // 1. Check catalog
    const catalogRaw = await AsyncStorage.getItem('habitup_public_habits_catalog_v1');
    const catalog: Record<string, { userId?: string; habits: Habit[]; completions: HabitCompletion[] }> = catalogRaw
      ? JSON.parse(catalogRaw)
      : {};

    let matchedUserHabits: Habit[] = [];
    let matchedUserCompletions: HabitCompletion[] = [];

    for (const [key, val] of Object.entries(catalog)) {
      const lowerKey = key.toLowerCase();
      const valUserId = (val?.userId || '').toLowerCase();

      // STRICT ISOLATION: Never match the current/excluded user
      if (cleanExcludeId && (valUserId === cleanExcludeId || lowerKey === cleanExcludeId)) continue;
      if (cleanExcludeEmail && lowerKey === cleanExcludeEmail) continue;
      if (cleanExcludeUsername && lowerKey === `username_${cleanExcludeUsername}`) continue;

      // Exact matching for friend
      const isMatch =
        (cleanFriendId && (lowerKey === cleanFriendId || valUserId === cleanFriendId)) ||
        (cleanFriendEmail && lowerKey === cleanFriendEmail) ||
        (cleanFriendName && lowerKey === `username_${cleanFriendName}`) ||
        (cleanFriendUsername && (lowerKey === `username_${cleanFriendUsername}` || lowerKey === cleanFriendUsername));

      if (isMatch) {
        if (Array.isArray(val.habits) && val.habits.length > 0) {
          matchedUserHabits = val.habits;
          matchedUserCompletions = val.completions || [];
          break;
        }
      }
    }

    // 2. If not found in catalog, check localApi storage ONLY if friendId/friendEmail is provided and not current user
    if (
      matchedUserHabits.length === 0 &&
      cleanFriendId &&
      cleanFriendId !== 'usr_default' &&
      cleanFriendId !== cleanExcludeId
    ) {
      const storageHabits = localApi.getHabits(friendId, friendEmail);
      if (storageHabits && storageHabits.length > 0) {
        matchedUserHabits = storageHabits;
        matchedUserCompletions = localApi.getCompletions(friendId, friendEmail);
      }
    }

    // Filter active habits
    const activeHabits = matchedUserHabits.filter((h) => !h.deleted_at && !h.archived_at);

    if (activeHabits.length > 0) {
      const mapped = activeHabits.map((h) => {
        const isDoneToday = matchedUserCompletions.some(
          (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === todayStr
        );
        const weeklyHistory = weekDays.map((col) =>
          matchedUserCompletions.some(
            (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === col.key
          )
        );
        const stats = calculateHabitStats(h, matchedUserCompletions);
        const currentStreak = Math.max(stats.currentStreak, 0);

        return {
          id: `fh-${h.id}`,
          name: h.name,
          description: h.description,
          icon: h.icon || 'Sparkles',
          color: h.color || '#7C5CFF',
          frequency_type: h.frequency_type || 'daily',
          scheduled_days: h.scheduled_days || [0, 1, 2, 3, 4, 5, 6],
          reminder_time: h.reminder_time || '08:00',
          currentStreak,
          isCompletedToday: isDoneToday,
          adoptersCount: h.is_shared ? 2 : 1,
          weeklyHistory,
        };
      });
      return deduplicateFriendHabits(mapped);
    }

    // 3. Fallback to existing habits if any
    if (existingHabits && existingHabits.length > 0) {
      return deduplicateFriendHabits(existingHabits);
    }

    // 4. Default starter public habits (pending by default)
    const defaults = getDefaultFriendStarterHabits(friendName || 'Buddy').map((dh) => ({
      ...dh,
      isCompletedToday: false,
    }));
    return deduplicateFriendHabits(defaults);
  } catch {
    return deduplicateFriendHabits(
      getDefaultFriendStarterHabits(friendName || 'Buddy').map((dh) => ({
        ...dh,
        isCompletedToday: false,
      }))
    );
  }
}

async function syncMutualDataForUser(
  currentUser: UserProfile,
  existingHabits: Habit[],
  existingFriends: FriendUser[]
): Promise<{ habits: Habit[]; friends: FriendUser[] }> {
  if (!currentUser || !currentUser.id) {
    return { habits: existingHabits, friends: existingFriends };
  }

  const myId = (currentUser.id || '').toLowerCase();
  const myEmail = (currentUser.email || '').toLowerCase();
  const myName = (currentUser.name || '').toLowerCase();

  const isMe = (u: MutualUserRef) => {
    if (!u) return false;
    const uId = (u.id || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();
    return uId === myId || (myEmail && uEmail === myEmail) || (myName && uName === myName);
  };

  const connections = await getMutualConnections();
  const mutualHabits = await getMutualSharedHabits();

  let updatedFriends = [...existingFriends];
  let updatedHabits = [...existingHabits];

  // 1. Sync connections where currentUser is involved
  for (const conn of connections) {
    let partner: MutualUserRef | null = null;
    if (isMe(conn.userA) && !isMe(conn.userB)) {
      partner = conn.userB;
    } else if (isMe(conn.userB) && !isMe(conn.userA)) {
      partner = conn.userA;
    }

    if (partner) {
      const pId = partner.id;
      const pEmail = (partner.email || '').toLowerCase();
      const pName = partner.name;
      const pUsername = partner.username.startsWith('@') ? partner.username : `@${partner.username}`;

      const alreadyFriendIdx = updatedFriends.findIndex(
        (f) =>
          f.id === pId ||
          (pEmail && f.email && f.email.toLowerCase() === pEmail) ||
          (f.name && f.name.toLowerCase() === pName.toLowerCase()) ||
          (f.username && f.username.toLowerCase() === pUsername.toLowerCase())
      );

      const partnerPublicHabits = await getFriendPublicHabits(
        pId,
        pEmail,
        pName,
        alreadyFriendIdx >= 0 ? updatedFriends[alreadyFriendIdx].habits : undefined,
        myId,
        myEmail,
        currentUser.username
      );

      if (alreadyFriendIdx >= 0) {
        updatedFriends[alreadyFriendIdx] = {
          ...updatedFriends[alreadyFriendIdx],
          isFriend: true,
          requestStatus: 'accepted',
          habits: partnerPublicHabits,
        };
      } else {
        const newFriendObj: FriendUser = {
          id: pId || `friend-${pName.toLowerCase()}-${Date.now()}`,
          name: pName,
          username: pUsername,
          email: partner.email || `${pName.toLowerCase()}@gmail.com`,
          avatar: partner.avatar || '🤝',
          bio: 'Habit buddy on HabitUp! Building streaks together.',
          plantStage: '🌱 Fresh Seedling (Lvl 1)',
          currentStreak: 0,
          totalCompletions: 0,
          isFriend: true,
          requestStatus: 'accepted',
          habits: partnerPublicHabits,
        };
        updatedFriends.push(newFriendObj);
      }
    }
  }

  // Also refresh public habits for all other friends in updatedFriends if empty
  for (let i = 0; i < updatedFriends.length; i++) {
    const f = updatedFriends[i];
    if (!f.habits || f.habits.length === 0) {
      f.habits = await getFriendPublicHabits(f.id, f.email, f.name, f.habits, myId, myEmail, currentUser.username);
    }
  }

  // 2. Check mutual habits where currentUser is involved
  mutualHabits.forEach((mh) => {
    let partner: MutualUserRef | null = null;
    if (isMe(mh.userA) && !isMe(mh.userB)) {
      partner = mh.userB;
    } else if (isMe(mh.userB) && !isMe(mh.userA)) {
      partner = mh.userA;
    }

    if (partner) {
      const cleanHabitName = mh.habitName.trim().toLowerCase();
      const partnerDisplayName = partner.name;
      const partnerId = partner.id;

      // Ensure currentUser has this shared habit in their habits
      const existingMyHabit = updatedHabits.find(
        (h) =>
          !h.deleted_at &&
          !h.archived_at &&
          (h.name || '').trim().toLowerCase() === cleanHabitName
      );

      if (existingMyHabit) {
        updatedHabits = updatedHabits.map((h) =>
          h.id === existingMyHabit.id
            ? {
                ...h,
                is_shared: true,
                buddy_id: partnerId || h.buddy_id,
                buddy_name: partnerDisplayName || h.buddy_name,
                buddy_avatar: partner.avatar || h.buddy_avatar || '🤝',
              }
            : h
        );
      } else {
        const newHabit: Habit = {
          id: `hab-shared-${mh.id}-${currentUser.id}`,
          user_id: currentUser.id,
          name: mh.habitName,
          description: `Shared routine with ${partnerDisplayName} 🤝`,
          icon: mh.icon || 'Target',
          color: mh.color || '#7C5CFF',
          frequency_type: 'daily',
          scheduled_days: [0, 1, 2, 3, 4, 5, 6],
          reminder_time: mh.time || '08:00',
          reminder_enabled: !!mh.time,
          buddy_id: partnerId,
          buddy_name: partnerDisplayName,
          buddy_avatar: partner.avatar || '🤝',
          is_shared: true,
          created_at: mh.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updatedHabits.push(newHabit);
      }

      // Ensure partner friend in updatedFriends has this public habit
      updatedFriends = updatedFriends.map((f) => {
        const isThisPartner =
          f.id === partnerId ||
          (partner?.email && f.email && f.email.toLowerCase() === partner.email.toLowerCase()) ||
          (f.name && f.name.toLowerCase() === partnerDisplayName.toLowerCase());

        if (isThisPartner) {
          const hasFriendHabit = f.habits.some(
            (fh) => (fh.name || '').trim().toLowerCase() === cleanHabitName
          );
          if (!hasFriendHabit) {
            const myNameShort = currentUser.name ? currentUser.name.split(' ')[0] : 'You';
            const publicHabit: FriendPublicHabit = {
              id: `fh-shared-${mh.id}`,
              name: mh.habitName,
              description: `Shared with ${myNameShort}`,
              icon: mh.icon || 'Target',
              color: mh.color || '#7C5CFF',
              frequency_type: 'daily',
              scheduled_days: [0, 1, 2, 3, 4, 5, 6],
              reminder_time: mh.time || '08:00',
              currentStreak: 0,
              isCompletedToday: false,
              adoptersCount: 2,
              weeklyHistory: [false, false, false, false, false, false, false],
            };
            return {
              ...f,
              habits: deduplicateFriendHabits([publicHabit, ...f.habits]),
            };
          }
        }
        return {
          ...f,
          habits: deduplicateFriendHabits(f.habits || []),
        };
      });
    }
  });

  return {
    habits: deduplicateHabits(updatedHabits),
    friends: updatedFriends.map((f) => ({ ...f, habits: deduplicateFriendHabits(f.habits || []) })),
  };
}

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(() => deduplicateHabits(localApi.getHabits()));
  const [completions, setCompletions] = useState<HabitCompletion[]>(() => deduplicateCompletions(localApi.getCompletions()));
  const [user, setUser] = useState<UserProfile>(() => localApi.getUser());
  const [sessions, setSessions] = useState<UserSession[]>(() => localApi.getSessions());
  const [syncQueue, setSyncQueue] = useState<SyncMutation[]>(() => localApi.getSyncQueue());
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrameType>('iphone');
  const [theme, setTheme] = useState<ColorTheme>('dark');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isPlantGardenModalOpen, setIsPlantGardenModalOpen] = useState<boolean>(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isAuthSessionModalOpen, setIsAuthSessionModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [fcmPushToken, setFcmPushToken] = useState<string | null>(null);

  const registerPushToken = useCallback(async (): Promise<string | null> => {
    try {
      const reg = await registerForPushNotificationsAsync();
      if (reg?.token) {
        setFcmPushToken(reg.token);
        const tz = reg.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const plat = reg.platform === 'ios' ? 'ios' : 'android';
        await localApi.registerDeviceToken(reg.token, plat, tz);
        return reg.token;
      }
    } catch (err) {
      console.warn('[FCM] Token registration error:', err);
    }
    return null;
  }, []);

  // Social & Community State
  const [friends, setFriends] = useState<FriendUser[]>(INITIAL_FRIENDS);
  const [socialFeed, setSocialFeed] = useState<SocialFeedActivity[]>(INITIAL_FEED);
  const [incomingRequests, setIncomingRequests] = useState<FollowRequestItem[]>([]);

  // A/B Experiment State (friends_feature_v1)
  const [friendsEnabled, setFriendsEnabled] = useState<boolean>(true);
  const [experimentVariant, setExperimentVariant] = useState<string | null>(null);

  const syncExperimentState = useCallback(async () => {
    try {
      // 1. Check cached experiment
      const cached = await AsyncStorage.getItem('habitup_exp_friends_feature_v1');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.friendsEnabled === 'boolean') {
            setFriendsEnabled(parsed.friendsEnabled);
            setExperimentVariant(parsed.variant || null);
          }
        } catch {}
      }

      // 2. Fetch live experiment from backend
      const exp = await localApi.getExperiment('friends_feature_v1');
      if (exp) {
        setFriendsEnabled(exp.friendsEnabled);
        setExperimentVariant(exp.variant);
        AsyncStorage.setItem('habitup_exp_friends_feature_v1', JSON.stringify(exp)).catch(() => {});
      }
    } catch (e) {
      console.warn('syncExperimentState error:', e);
    }
  }, []);

  const recordFriendsExposure = useCallback(async () => {
    try {
      await localApi.recordExperimentExposure('friends_feature_v1');
    } catch {}
  }, []);

  const isInitialDataLoaded = useRef(false);
  const isLoggingOut = useRef(false);

  // Load initial settings & restore previous data from backend on startup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Request notification permission immediately on startup
        requestNotificationPermission().catch(() => {});

        // 1. Restore persistent user ID
        const savedUidRaw = await AsyncStorage.getItem('habitup_current_user_id');
        let currentUid = 'usr_default';
        if (savedUidRaw) {
          try {
            currentUid = JSON.parse(savedUidRaw);
          } catch {
            currentUid = savedUidRaw;
          }
        }

        // Initialize ApiClient storage & restore tokens for currentUid
        await localApi.initStorage(currentUid);
        localApi.setCurrentUserId(currentUid);

        // 2. Restore persistent User Profile
        let activeUser: UserProfile | null = null;
        const savedUserStr = await AsyncStorage.getItem(`habitup_user_${currentUid}`);
        if (savedUserStr) {
          try {
            activeUser = JSON.parse(savedUserStr);
          } catch {}
        }
        if (!activeUser) {
          const globalUserStr = await AsyncStorage.getItem('habitup_current_user_v1');
          if (globalUserStr) {
            try {
              activeUser = JSON.parse(globalUserStr);
            } catch {}
          }
        }

        if (activeUser && activeUser.id) {
          setUser(activeUser);
          currentUid = activeUser.id;
          localApi.setCurrentUserId(currentUid);
          await localApi.initStorage(currentUid);
        }

        // Restore persistent Friends and Activity Feed per user
        let loadedFriends: FriendUser[] = [];
        const savedFriendsStr = await AsyncStorage.getItem(`habitup_social_friends_${currentUid}`);
        if (savedFriendsStr) {
          try {
            const parsed = JSON.parse(savedFriendsStr);
            if (Array.isArray(parsed)) loadedFriends = parsed;
          } catch {}
        }
        if (loadedFriends.length === 0 && currentUid !== 'usr_default') {
          const globalFriendsStr = await AsyncStorage.getItem('habitup_social_friends_v1');
          if (globalFriendsStr) {
            try {
              const parsed = JSON.parse(globalFriendsStr);
              if (Array.isArray(parsed)) loadedFriends = parsed;
            } catch {}
          }
        }
        // Exclude any friend records that represent the current user
        if (activeUser) {
          const myId = (activeUser.id || '').toLowerCase();
          const myEmail = (activeUser.email || '').trim().toLowerCase();
          const myUsername = (activeUser.username || '').replace(/^@/, '').trim().toLowerCase();

          loadedFriends = loadedFriends.filter((f) => {
            const fId = (f.id || '').toLowerCase();
            const fEmail = (f.email || '').trim().toLowerCase();
            const fUsername = (f.username || '').replace(/^@/, '').trim().toLowerCase();

            if (myId && fId === myId) return false;
            if (myEmail && fEmail && fEmail === myEmail) return false;
            if (myUsername && fUsername && fUsername === myUsername) return false;
            return true;
          });
        }
        setFriends(loadedFriends);

        let loadedFeed: SocialFeedActivity[] = [];
        const savedFeedStr = await AsyncStorage.getItem(`habitup_social_feed_${currentUid}`);
        if (savedFeedStr) {
          try {
            const parsed = JSON.parse(savedFeedStr);
            if (Array.isArray(parsed)) loadedFeed = parsed;
          } catch {}
        }
        if (loadedFeed.length === 0 && currentUid !== 'usr_default') {
          const globalFeedStr = await AsyncStorage.getItem('habitup_social_feed_v1');
          if (globalFeedStr) {
            try {
              const parsed = JSON.parse(globalFeedStr);
              if (Array.isArray(parsed)) loadedFeed = parsed;
            } catch {}
          }
        }
        setSocialFeed(loadedFeed);

        // 3. Restore habits, completions, sessions for this user
        let loadedHabits: Habit[] = [];
        const savedHabitsStr = await AsyncStorage.getItem(`habitup_habits_${currentUid}`);
        if (savedHabitsStr) {
          try {
            const parsed = JSON.parse(savedHabitsStr);
            if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
          } catch {}
        }
        if (activeUser?.email) {
          const emailUid = getUserIdFromEmail(activeUser.email);
          if (emailUid !== currentUid && emailUid !== 'usr_default') {
            const emailHabitsStr = await AsyncStorage.getItem(`habitup_habits_${emailUid}`);
            if (emailHabitsStr) {
              try {
                const parsed = JSON.parse(emailHabitsStr);
                if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
              } catch {}
            }
          }
        }
        if (loadedHabits.length === 0 && currentUid === 'usr_default') {
          const defaultHabitsStr = await AsyncStorage.getItem('habitup_habits_usr_default');
          if (defaultHabitsStr) {
            try {
              const parsed = JSON.parse(defaultHabitsStr);
              if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
            } catch {}
          }
        }

        if (loadedHabits.length === 0) {
          const memHabits = localApi.getHabits(currentUid, activeUser?.email);
          if (memHabits.length > 0) loadedHabits.push(...memHabits);
        }

        // Restore completions
        let loadedCompletions: HabitCompletion[] = [];
        const savedCompStr = await AsyncStorage.getItem(`habitup_completions_${currentUid}`);
        if (savedCompStr) {
          try {
            const parsed = JSON.parse(savedCompStr);
            if (Array.isArray(parsed) && parsed.length > 0) loadedCompletions.push(...parsed);
          } catch {}
        }
        if (activeUser?.email) {
          const emailUid = getUserIdFromEmail(activeUser.email);
          if (emailUid !== currentUid && emailUid !== 'usr_default') {
            const emailCompStr = await AsyncStorage.getItem(`habitup_completions_${emailUid}`);
            if (emailCompStr) {
              try {
                const parsed = JSON.parse(emailCompStr);
                if (Array.isArray(parsed) && parsed.length > 0) loadedCompletions.push(...parsed);
              } catch {}
            }
          }
        }
        if (loadedCompletions.length === 0 && currentUid === 'usr_default') {
          const defaultCompStr = await AsyncStorage.getItem('habitup_completions_usr_default');
          if (defaultCompStr) {
            try {
              const parsed = JSON.parse(defaultCompStr);
              if (Array.isArray(parsed) && parsed.length > 0) loadedCompletions.push(...parsed);
            } catch {}
          }
        }
        if (loadedCompletions.length === 0) {
          const memCompletions = localApi.getCompletions(currentUid, activeUser?.email);
          if (memCompletions.length > 0) loadedCompletions.push(...memCompletions);
        }

        let cleanHabits = deduplicateHabits(loadedHabits);
        let cleanCompletions = deduplicateCompletions(loadedCompletions);

        if (cleanHabits.length > 0) {
          setHabits(cleanHabits);
        }
        if (cleanCompletions.length > 0) {
          setCompletions(cleanCompletions);
        }

        setSessions(localApi.getSessions(currentUid));
        setSyncQueue(localApi.getSyncQueue(currentUid));

        // 4. Check Auth state
        const authVal = await AsyncStorage.getItem('habitup_is_authenticated_v1');
        let isAuth = false;
        if (authVal) {
          try {
            isAuth = JSON.parse(authVal);
          } catch {
            isAuth = authVal === 'true';
          }
        }

        const hasValidUser = !!(activeUser && activeUser.id && activeUser.id !== 'usr_default');
        const hasTokens = localApi.hasAuthToken();

        if (isAuth || (hasValidUser && (hasTokens || activeUser?.email))) {
          setIsAuthenticated(true);
          AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(true)).catch(() => {});

          try {
            const me = await localApi.fetchMe();
            if (me && me.id) {
              setUser(me);
              localApi.saveUser(me, me.id);
              AsyncStorage.setItem('habitup_current_user_v1', JSON.stringify(me)).catch(() => {});
            }

            const [serverHabits, stats] = await Promise.all([
              localApi.fetchHabitsFromServer().catch(() => null),
              localApi.fetchStatsFromServer().catch(() => null),
            ]);

            if (serverHabits && serverHabits.length > 0) {
              let combinedHabits = deduplicateHabits([...cleanHabits, ...serverHabits]);
              if (stats?.habits && Array.isArray(stats.habits)) {
                combinedHabits = combinedHabits.map((h) => {
                  const matched = stats.habits.find((sh) => sh.id === h.id || sh.name.toLowerCase() === h.name.toLowerCase());
                  if (matched) {
                    return {
                      ...h,
                      streak: Math.max((h as any).streak || 0, matched.current_streak || 0),
                    };
                  }
                  return h;
                });
              }
              cleanHabits = combinedHabits;
              setHabits(cleanHabits);
              localApi.saveHabits(cleanHabits, currentUid);

              const serverCompletions = await localApi.fetchCompletionsFromServer(cleanHabits);
              if (serverCompletions && serverCompletions.length > 0) {
                cleanCompletions = deduplicateCompletions([...cleanCompletions, ...serverCompletions]);
              }
            }

            // Reconstruct streak completion dates if any active streak is missing local dates
            const today = new Date();
            for (const h of cleanHabits) {
              const streak = (h as any).streak || 0;
              if (streak > 0) {
                for (let i = 0; i < streak; i++) {
                  const d = new Date(today);
                  d.setDate(today.getDate() - i);
                  const dateKey = formatDateKey(d);
                  const already = cleanCompletions.some(
                    (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === dateKey
                  );
                  if (!already) {
                    cleanCompletions.push({
                      id: `comp-streak-${h.id}-${dateKey}`,
                      habit_id: h.id,
                      user_id: currentUid,
                      completion_date: dateKey,
                      completed_at: `${dateKey}T12:00:00.000Z`,
                    });
                  }
                }
              }
            }

            cleanCompletions = deduplicateCompletions(cleanCompletions);
            setCompletions(cleanCompletions);
            localApi.saveCompletions(cleanCompletions, currentUid);
          } catch (e) {
            // Offline fallback: keep cached session and habits intact without throwing back to login
            console.log('Online habit sync skipped (offline or network delay):', e);
          }
        } else {
          setIsAuthenticated(false);
        }

        // 5. Sync mutual cross-account friends and shared habits
        if (activeUser) {
          const synced = await syncMutualDataForUser(activeUser, cleanHabits, loadedFriends);
          if (synced.habits.length > 0) {
            setHabits(synced.habits);
            localApi.saveHabits(synced.habits, activeUser.id);
          }
          if (synced.friends.length > 0) {
            setFriends(synced.friends);
          }
          checkAndDeliverPendingNudges(activeUser);
        }

        // 6. Sync A/B experiment variant
        syncExperimentState().catch(() => {});
      } catch (err) {
        console.warn('Bootstrap error:', err);
      } finally {
        isInitialDataLoaded.current = true;
        setIsAuthLoading(false);
      }
    };
    bootstrap();

    AsyncStorage.getItem('habitup_theme_v1').then((val) => {
      if (val === 'light' || val === 'dark') setTheme(val);
    });
    AsyncStorage.getItem('habitup_notifications_enabled_v1').then((val) => {
      if (val !== null) setNotificationsEnabled(JSON.parse(val));
    });
    getCachedPushToken().then((token) => {
      if (token) setFcmPushToken(token);
    });
    registerPushToken().catch(() => {});
  }, [syncExperimentState, registerPushToken]);

  // Handle incoming push notification interaction (tap from background/lockscreen)
  useEffect(() => {
    const unsubscribe = setupNotificationListeners((data) => {
      console.log('[HabitContext] Push notification tapped with payload:', data);
      if (data?.habitId) {
        const found = habits.find((h) => h.id === data.habitId);
        if (found) {
          setSelectedHabitForDetail(found);
        }
      }
    });

    return () => unsubscribe();
  }, [habits]);

  // Safety: If friends feature is disabled by A/B experiment (Variant A), redirect friends tab to streaks
  useEffect(() => {
    if (!friendsEnabled && (activeTab === 'friends' || activeTab === 'habits')) {
      setActiveTab('streaks');
    }
  }, [friendsEnabled, activeTab]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'archived'>('all');

  // Persistence side-effects (only persist once initial bootstrap data is loaded and user is authenticated and not logging out)
  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id && isAuthenticated && !isLoggingOut.current) {
      if (habits.length > 0 || user.id !== 'usr_default') {
        localApi.saveHabits(habits, user.id);
        if (user.email) {
          const emailUid = getUserIdFromEmail(user.email);
          localApi.saveHabits(habits, emailUid);
        }
        publishUserHabits(user, habits, completions);
      }
    }
  }, [habits, user?.id, user?.email, isAuthenticated]);

  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id && isAuthenticated && !isLoggingOut.current) {
      if (completions.length > 0 || user.id !== 'usr_default') {
        localApi.saveCompletions(completions, user.id);
        if (user.email) {
          const emailUid = getUserIdFromEmail(user.email);
          localApi.saveCompletions(completions, emailUid);
        }
        publishUserHabits(user, habits, completions);
      }
    }
  }, [completions, user?.id, user?.email, isAuthenticated]);

  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id && isAuthenticated && !isLoggingOut.current) {
      localApi.saveUser(user, user.id);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id) {
      localApi.saveSessions(sessions, user.id);
    }
  }, [sessions, user?.id]);

  useEffect(() => {
    if (isInitialDataLoaded.current) {
      if (user?.id) {
        AsyncStorage.setItem(`habitup_social_friends_${user.id}`, JSON.stringify(friends)).catch(() => {});
        if (user.email) {
          const emailUid = getUserIdFromEmail(user.email);
          if (emailUid !== user.id) {
            AsyncStorage.setItem(`habitup_social_friends_${emailUid}`, JSON.stringify(friends)).catch(() => {});
          }
        }
      }
      AsyncStorage.setItem('habitup_social_friends_v1', JSON.stringify(friends)).catch(() => {});
    }
  }, [friends, user?.id, user?.email]);

  useEffect(() => {
    if (isInitialDataLoaded.current) {
      if (user?.id) {
        AsyncStorage.setItem(`habitup_social_feed_${user.id}`, JSON.stringify(socialFeed)).catch(() => {});
        if (user.email) {
          const emailUid = getUserIdFromEmail(user.email);
          if (emailUid !== user.id) {
            AsyncStorage.setItem(`habitup_social_feed_${emailUid}`, JSON.stringify(socialFeed)).catch(() => {});
          }
        }
      }
      AsyncStorage.setItem('habitup_social_feed_v1', JSON.stringify(socialFeed)).catch(() => {});
    }
  }, [socialFeed, user?.id, user?.email]);

  // Live mutual sync whenever user enters or views the Friends tab
  useEffect(() => {
    if (activeTab === 'friends' && isInitialDataLoaded.current && user && user.id) {
      syncMutualDataForUser(user, habits, friends)
        .then((synced) => {
          if (synced.friends.length > 0) {
            setFriends(synced.friends);
          }
          if (synced.habits.length > 0) {
            setHabits(synced.habits);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Sync backend friends and their live public habits
  const syncFriendsWithBackend = useCallback(
    async (currentUser: UserProfile | null) => {
      if (!currentUser || isOffline || (!isAuthenticated && !localApi.hasAuthToken())) return;
      try {
        const serverFriends = await localApi.fetchFriendsFromServer();
        if (!Array.isArray(serverFriends)) return;

        const myId = (currentUser.id || '').toLowerCase();
        const myUsername = (currentUser.username || '').replace(/^@/, '').toLowerCase();
        const todayStr = formatDateKey(new Date());
        const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

        // Server friend IDs and usernames currently active on Railway
        const serverFriendIds = new Set(
          serverFriends.map((sf) => (sf.friend_id || sf.id || '').toLowerCase()).filter(Boolean)
        );
        const serverFriendUsernames = new Set(
          serverFriends.map((sf) => (sf.username || '').replace(/^@/, '').toLowerCase()).filter(Boolean)
        );

        setFriends((prevFriends) => {
          const updatedList = [...prevFriends];

          // Add or update friends from server
          for (const sf of serverFriends) {
            const fId = sf.friend_id || sf.id;
            const fUsername = (sf.username || '').replace(/^@/, '').toLowerCase();
            if (!fUsername || (fId && fId.toLowerCase() === myId) || fUsername === myUsername) continue;

            const fDisplayName = sf.name || (fUsername.charAt(0).toUpperCase() + fUsername.slice(1));
            const usernameTag = `@${fUsername}`;

            const existingIdx = updatedList.findIndex(
              (f) =>
                (fId && (f.id || '').toLowerCase() === fId.toLowerCase()) ||
                (f.username && f.username.replace(/^@/, '').toLowerCase() === fUsername)
            );

            if (existingIdx >= 0) {
              updatedList[existingIdx] = {
                ...updatedList[existingIdx],
                id: fId || updatedList[existingIdx].id,
                name: updatedList[existingIdx].name || fDisplayName,
                username: usernameTag,
                isFriend: true,
                requestStatus: 'accepted',
                currentStreak: sf.best_streak !== undefined ? sf.best_streak : updatedList[existingIdx].currentStreak,
                totalCompletions: sf.total_habits !== undefined ? sf.total_habits : updatedList[existingIdx].totalCompletions,
              };
            } else {
              updatedList.push({
                id: fId || `friend-${fUsername}`,
                name: fDisplayName,
                username: usernameTag,
                email: `${fUsername}@gmail.com`,
                avatar: '🤝',
                bio: 'Habit buddy on HabitUp! Building streaks together.',
                plantStage: '🌱 Fresh Seedling (Lvl 1)',
                currentStreak: sf.best_streak || 0,
                totalCompletions: sf.total_habits || 0,
                isFriend: true,
                requestStatus: 'accepted',
                habits: [],
              });
            }
          }

          return updatedList;
        });

        // 3. Fetch each accepted friend's habits & live stats from Railway backend
        for (const sf of serverFriends) {
          const fId = sf.friend_id || sf.id;
          if (!fId || fId === myId) continue;
          try {
            const [backendHabits, friendStats, catalogHabits] = await Promise.all([
              localApi.fetchFriendHabitsFromServer(fId),
              localApi.fetchFriendStatsFromServer(fId, 'week'),
              getFriendPublicHabits(fId, sf.email, sf.name, undefined, myId, currentUser.email, myUsername),
            ]);

            let mappedHabits: FriendPublicHabit[] = [];

            if (Array.isArray(backendHabits) && backendHabits.length > 0) {
              mappedHabits = backendHabits
                .filter((bh) => !bh.deleted_at && !bh.archived_at)
                .map((bh) => {
                  const freq = bh.frequency_type === 'daily' || !bh.frequency_type ? 'daily' : 'custom_days';
                  const scheduled_days = Array.isArray(bh.schedule) && bh.schedule.length > 0 ? bh.schedule : [0, 1, 2, 3, 4, 5, 6];

                  const catMatch = catalogHabits.find(
                    (ch) =>
                      ch.id === bh.id ||
                      ch.id === `fh-${bh.id}` ||
                      ch.name.trim().toLowerCase() === bh.name.trim().toLowerCase()
                  );

                  const statMatch = friendStats?.habits?.find(
                    (sh: any) =>
                      sh.id === bh.id ||
                      (sh.name && sh.name.trim().toLowerCase() === bh.name.trim().toLowerCase())
                  );

                  const streak = Math.max(
                    bh.streak || 0,
                    statMatch?.current_streak || 0,
                    catMatch?.currentStreak || 0
                  );

                  let isCompletedToday = false;
                  if (catMatch && typeof catMatch.isCompletedToday === 'boolean') {
                    isCompletedToday = catMatch.isCompletedToday;
                  } else if (statMatch && (statMatch.is_completed_today !== undefined || statMatch.completed_today !== undefined)) {
                    isCompletedToday = !!(statMatch.is_completed_today ?? statMatch.completed_today);
                  } else if ((bh as any).is_completed_today !== undefined || (bh as any).completed_today !== undefined) {
                    isCompletedToday = !!((bh as any).is_completed_today ?? (bh as any).completed_today);
                  } else if ((bh as any).last_completed_at) {
                    isCompletedToday = String((bh as any).last_completed_at).split('T')[0] === todayStr;
                  } else if (streak > 0) {
                    isCompletedToday = true;
                  }

                  let weeklyHistory = [false, false, false, false, false, false, false];
                  if (catMatch && Array.isArray(catMatch.weeklyHistory) && catMatch.weeklyHistory.some(Boolean)) {
                    weeklyHistory = catMatch.weeklyHistory;
                  } else {
                    if (isCompletedToday) {
                      weeklyHistory[todayIndex] = true;
                      for (let i = 1; i < streak && todayIndex - i >= 0; i++) {
                        weeklyHistory[todayIndex - i] = true;
                      }
                    } else if (streak > 0) {
                      for (let i = 1; i <= streak && todayIndex - i >= 0; i++) {
                        weeklyHistory[todayIndex - i] = true;
                      }
                    }
                  }

                  return {
                    id: bh.id,
                    name: bh.name,
                    description: bh.description || undefined,
                    icon: bh.icon || 'Target',
                    color: bh.color || '#7C5CFF',
                    frequency_type: freq,
                    scheduled_days,
                    reminder_time: '08:00',
                    currentStreak: streak,
                    isCompletedToday,
                    adoptersCount: 1,
                    weeklyHistory,
                  };
                });
            } else if (catalogHabits.length > 0) {
              mappedHabits = catalogHabits;
            }

            mappedHabits = deduplicateFriendHabits(mappedHabits);

            if (mappedHabits.length > 0) {
              const bestStreak = Math.max(
                sf.best_streak || 0,
                ...mappedHabits.map((h) => h.currentStreak || 0)
              );
              const totalCompletions = Math.max(
                sf.total_habits || 0,
                friendStats?.total_completions || 0,
                mappedHabits.length
              );

              setFriends((prevFriends) =>
                prevFriends.map((f) => {
                  if (
                    f.id === fId ||
                    (f.username && f.username.replace(/^@/, '').toLowerCase() === (sf.username || '').replace(/^@/, '').toLowerCase())
                  ) {
                    return {
                      ...f,
                      currentStreak: bestStreak,
                      totalCompletions,
                      habits: mappedHabits,
                    };
                  }
                  return f;
                })
              );
            }
          } catch {}
        }
      } catch (err) {
        console.warn('syncFriendsWithBackend error:', err);
      }
    },
    [isOffline, isAuthenticated]
  );

  // Sync incoming follow requests from local storage and backend
  const syncFollowRequests = useCallback(
    async (currentUser: UserProfile | null) => {
      if (!currentUser) return;
      try {
        const myUsername = (
          currentUser.username ||
          (currentUser.name
            ? `@${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            : '')
        ).replace(/^@/, '').toLowerCase();
        const myCleanHandle = myUsername;
        const myEmail = (currentUser.email || '').toLowerCase();
        const myId = (currentUser.id || '').toLowerCase();

        // 1. Fetch locally stored follow requests
        const stored = await getStoredFollowRequests();

        // 2. Fetch server requests if online and authenticated
        let serverRequests: any[] = [];
        if (!isOffline && (isAuthenticated || localApi.hasAuthToken())) {
          try {
            serverRequests = await localApi.fetchPendingFriendRequests();
          } catch {}
        }

        // Merge server & local requests
        const combined: FollowRequestItem[] = [...stored];
        for (const sr of serverRequests) {
          const sReqId = sr.request_id || sr.id;
          if (!sReqId) continue;
          const sFromUserId = sr.from_user_id || sr.fromUserId || sr.senderId || sr.user_id;
          const sFromUsername = sr.from_username || sr.fromUsername || sr.senderUsername || (sr.username ? `@${sr.username}` : '@friend');
          const sCleanFromUser = sFromUsername.replace(/^@/, '');
          const sFromName = sr.from_name || sr.fromName || sr.name || (sCleanFromUser.charAt(0).toUpperCase() + sCleanFromUser.slice(1)) || 'Friend';
          const sCreatedAt = sr.created_at || sr.createdAt || new Date().toISOString();
          const sTotalHabits = sr.total_habits !== undefined ? sr.total_habits : 0;
          const sBestStreak = sr.best_streak !== undefined ? sr.best_streak : 0;

          const existsIdx = combined.findIndex(
            (r) =>
              r.id === sReqId ||
              (r.fromUserId === sFromUserId && r.status === 'pending')
          );

          const reqItem: FollowRequestItem = {
            id: sReqId,
            fromUserId: sFromUserId || `friend-${sCleanFromUser}`,
            fromName: sFromName,
            fromUsername: sFromUsername.startsWith('@') ? sFromUsername : `@${sFromUsername}`,
            fromAvatar: sr.fromAvatar || sr.senderAvatar || '🤝',
            toUserId: currentUser.id,
            toUsername: `@${myCleanHandle}`,
            status: 'pending',
            createdAt: sCreatedAt,
            totalHabits: sTotalHabits,
            bestStreak: sBestStreak,
          };

          if (existsIdx >= 0) {
            combined[existsIdx] = reqItem;
          } else {
            combined.unshift(reqItem);
          }
        }

        // Filter incoming requests addressed to current user
        const pendingForMe = combined.filter((r) => {
          if (r.status !== 'pending') return false;

          const fromHandle = (r.fromUsername || '').replace(/^@/, '').toLowerCase();
          const fromId = (r.fromUserId || '').toLowerCase();
          // Never display a request sent BY me as an incoming request to me
          if ((myCleanHandle && fromHandle === myCleanHandle) || (myId && fromId === myId)) {
            return false;
          }

          // Server requests fetched via /friends/requests are inherently addressed to the authenticated user!
          if (serverRequests.some((sr) => (sr.request_id && sr.request_id === r.id) || (sr.id && sr.id === r.id))) {
            return true;
          }

          const toHandle = (r.toUsername || '').replace(/^@/, '').toLowerCase();
          const toId = (r.toUserId || '').toLowerCase();
          return (
            (toHandle && (toHandle === myCleanHandle || (myEmail && toHandle === myEmail))) ||
            (toId && myId && (toId === myId || toId.includes(myCleanHandle)))
          );
        });

        setIncomingRequests(pendingForMe);

        // 4. Update friends state to ensure any incoming requests are marked as pending_received (healing any misclassified pending_sent)
        if (pendingForMe.length > 0) {
          setFriends((prev) => {
            const updated = [...prev];
            for (const inc of pendingForMe) {
              const cleanInc = (inc.fromUsername || '').replace(/^@/, '').toLowerCase();
              const incId = (inc.fromUserId || '').toLowerCase();

              const idx = updated.findIndex((f) => {
                const fClean = (f.username || '').replace(/^@/, '').toLowerCase();
                const fId = (f.id || '').toLowerCase();
                return (cleanInc && fClean === cleanInc) || (incId && fId === incId);
              });

              if (idx >= 0) {
                if (updated[idx].requestStatus !== 'accepted') {
                  updated[idx] = {
                    ...updated[idx],
                    requestStatus: 'pending_received',
                    requestId: inc.id,
                    id: inc.fromUserId || updated[idx].id,
                    name: updated[idx].name || inc.fromName,
                  };
                }
              } else {
                updated.unshift({
                  id: inc.fromUserId || `friend-${cleanInc}`,
                  name: inc.fromName,
                  username: inc.fromUsername.startsWith('@') ? inc.fromUsername : `@${cleanInc}`,
                  email: `${cleanInc}@gmail.com`,
                  avatar: inc.fromAvatar || '🤝',
                  bio: 'Habit buddy on HabitUp!',
                  plantStage: '🌱 Fresh Seedling (Lvl 1)',
                  currentStreak: inc.bestStreak || 0,
                  totalCompletions: inc.totalHabits || 0,
                  isFriend: true,
                  requestStatus: 'pending_received',
                  requestId: inc.id,
                  habits: [],
                });
              }
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('syncFollowRequests error:', err);
      }
    },
    [isOffline, isAuthenticated]
  );

  // Poll for incoming follow requests and friends updates
  useEffect(() => {
    if (user) {
      syncFollowRequests(user);
      if (activeTab === 'friends') {
        syncFriendsWithBackend(user);
      }
    }
  }, [user, activeTab, syncFollowRequests, syncFriendsWithBackend]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      syncFollowRequests(user);
      if (isAuthenticated && !isOffline) {
        syncFriendsWithBackend(user);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, isOffline, syncFollowRequests, syncFriendsWithBackend]);

  // Instantaneous cross-tab and cross-window sync listener (Web only)
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function' ||
      !user
    ) {
      return;
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'habitup_public_habits_catalog_v1' ||
        e.key === 'habitup_social_friends_v1' ||
        e.key?.startsWith('habitup_completions_') ||
        e.key?.startsWith('habitup_habits_')
      ) {
        syncFriendsWithBackend(user);
        syncFollowRequests(user);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [user, syncFriendsWithBackend, syncFollowRequests]);

  const showToast = useCallback(
    (message: string, undoAction?: () => void, type: 'success' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      setToast({ id, message, undoAction, type });
      setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
      }, 4000);
    },
    []
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const checkAndDeliverPendingNudges = useCallback(
    async (currentUser: UserProfile | null) => {
      if (!currentUser || !currentUser.id || currentUser.id === 'usr_default') return;
      try {
        const nudges = await getPendingNudges();
        if (!nudges || nudges.length === 0) return;

        const myId = (currentUser.id || '').toLowerCase();
        const myEmail = (currentUser.email || '').toLowerCase();
        const myName = (currentUser.name || '').trim().toLowerCase();
        const myUsername = (currentUser.username || '').replace(/^@/, '').trim().toLowerCase();
        const myCleanHandle = myName.replace(/[^a-z0-9]/g, '');

        let hasUpdates = false;
        const updatedNudges: FriendNudgeRecord[] = [];

        for (const nudge of nudges) {
          if (nudge.delivered) {
            updatedNudges.push(nudge);
            continue;
          }

          const sendId = (nudge.senderId || '').toLowerCase();
          const sendEmail = (nudge.senderEmail || '').toLowerCase();
          const sendUsername = (nudge.senderUsername || '').replace(/^@/, '').toLowerCase();
          const sendName = (nudge.senderName || '').trim().toLowerCase();

          const isSender =
            (sendId && myId && sendId === myId) ||
            (sendEmail && myEmail && sendEmail === myEmail) ||
            (sendUsername && myUsername && sendUsername === myUsername) ||
            (sendName && myName && sendName === myName);

          // The sender MUST NEVER deliver to themselves
          if (isSender) {
            updatedNudges.push(nudge);
            continue;
          }

          const recId = (nudge.recipientId || '').toLowerCase();
          const recEmail = (nudge.recipientEmail || '').toLowerCase();
          const recUsername = (nudge.recipientUsername || '').replace(/^@/, '').toLowerCase();
          const recName = (nudge.recipientName || '').trim().toLowerCase();

          // Check if current user is the intended recipient
          const isRecipient =
            (recId && myId && recId === myId) ||
            (recEmail && myEmail && recEmail === myEmail) ||
            (recUsername && myUsername && recUsername === myUsername) ||
            (recName && myName && recName === myName) ||
            (recId && (recId === `friend-${myCleanHandle}` || recId === `friend-${myUsername}`));

          if (isRecipient) {
            nudge.delivered = true;
            nudge.deliveredAt = new Date().toISOString();
            hasUpdates = true;

            // Find matching habit if user has it
            const matchedHabit = habits.find(
              (h) => !h.deleted_at && !h.archived_at && h.name.trim().toLowerCase() === nudge.habitName.trim().toLowerCase()
            );

            // Trigger real-time In-App Banner, Web Audio Chime, Browser Notification, and Mobile Push Notification!
            notificationService.triggerNudge({
              senderName: nudge.senderName || 'Your buddy',
              habitName: nudge.habitName,
              habitId: matchedHabit?.id,
              senderAvatar: nudge.senderAvatar || '👋',
              icon: nudge.habitIcon || 'Bell',
              color: nudge.habitColor || '#F59E0B',
            });

            showToast(
              `👋 ${nudge.senderName} sent you a nudge for "${nudge.habitName}"! ⚡`,
              undefined,
              'info'
            );
          }
          updatedNudges.push(nudge);
        }

        if (hasUpdates) {
          await AsyncStorage.setItem('habitup_pending_nudges_v1', JSON.stringify(updatedNudges));
        }
      } catch (err) {
        console.warn('checkAndDeliverPendingNudges error:', err);
      }
    },
    [habits, showToast]
  );

  // Periodic polling for pending nudges across active sessions / switches
  useEffect(() => {
    if (!user || !user.id) return;
    checkAndDeliverPendingNudges(user);
    const interval = setInterval(() => {
      checkAndDeliverPendingNudges(user);
    }, 3000);
    return () => clearInterval(interval);
  }, [user, checkAndDeliverPendingNudges]);

  const triggerCelebration = useCallback(() => {
    if (soundEnabled) {
      try {
        soundService.playCompletionChime();
      } catch {
        // ignore
      }
    }
    if (hapticsEnabled) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // ignore
      }
    }
  }, [soundEnabled, hapticsEnabled]);

  const switchAccountData = useCallback(async (targetUser: UserProfile) => {
    isLoggingOut.current = false;
    const uid = targetUser.id;
    localApi.setCurrentUserId(uid);
    localApi.saveUser(targetUser, uid);
    AsyncStorage.setItem('habitup_current_user_id', JSON.stringify(uid)).catch(() => {});
    AsyncStorage.setItem('habitup_current_user_v1', JSON.stringify(targetUser)).catch(() => {});

    // 1. Check local storage directly from AsyncStorage and memory cache
    let loadedHabits: Habit[] = [];
    const directHabitsStr = await AsyncStorage.getItem(`habitup_habits_${uid}`);
    if (directHabitsStr) {
      try {
        const parsed = JSON.parse(directHabitsStr);
        if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
      } catch {}
    }
    if (targetUser.email) {
      const emailUid = getUserIdFromEmail(targetUser.email);
      if (emailUid !== uid) {
        const emailHabitsStr = await AsyncStorage.getItem(`habitup_habits_${emailUid}`);
        if (emailHabitsStr) {
          try {
            const parsed = JSON.parse(emailHabitsStr);
            if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
          } catch {}
        }
      }
    }
    if (loadedHabits.length === 0) {
      const memHabits = localApi.getHabits(uid, targetUser.email);
      if (memHabits.length > 0) loadedHabits.push(...memHabits);
    }

    // 2. Load completions directly from AsyncStorage and memory cache
    let loadedCompletions: HabitCompletion[] = [];
    const directCompStr = await AsyncStorage.getItem(`habitup_completions_${uid}`);
    if (directCompStr) {
      try {
        const parsed = JSON.parse(directCompStr);
        if (Array.isArray(parsed) && parsed.length > 0) loadedCompletions.push(...parsed);
      } catch {}
    }
    if (targetUser.email) {
      const emailUid = getUserIdFromEmail(targetUser.email);
      if (emailUid !== uid) {
        const emailCompStr = await AsyncStorage.getItem(`habitup_completions_${emailUid}`);
        if (emailCompStr) {
          try {
            const parsed = JSON.parse(emailCompStr);
            if (Array.isArray(parsed) && parsed.length > 0) loadedCompletions.push(...parsed);
          } catch {}
        }
      }
    }
    if (loadedCompletions.length === 0) {
      const memCompletions = localApi.getCompletions(uid, targetUser.email);
      if (memCompletions.length > 0) loadedCompletions.push(...memCompletions);
    }

    let cleanHabits = deduplicateHabits(loadedHabits);
    let cleanCompletions = deduplicateCompletions(loadedCompletions);

    // 3. Fetch latest habits, completions & stats from backend server
    try {
      const [serverHabits, stats] = await Promise.all([
        localApi.fetchHabitsFromServer(),
        localApi.fetchStatsFromServer().catch(() => null),
      ]);

      if (serverHabits && serverHabits.length > 0) {
        let combinedHabits = deduplicateHabits([...cleanHabits, ...serverHabits]);
        if (stats?.habits && Array.isArray(stats.habits)) {
          combinedHabits = combinedHabits.map((h) => {
            const matched = stats.habits.find((sh) => sh.id === h.id || sh.name.toLowerCase() === h.name.toLowerCase());
            if (matched) {
              return {
                ...h,
                streak: Math.max((h as any).streak || 0, matched.current_streak || 0),
              };
            }
            return h;
          });
        }
        cleanHabits = combinedHabits;

        const serverCompletions = await localApi.fetchCompletionsFromServer(cleanHabits);
        if (serverCompletions && serverCompletions.length > 0) {
          cleanCompletions = deduplicateCompletions([...cleanCompletions, ...serverCompletions]);
        }
      }
    } catch {
      // offline fallback
    }

    // Reconstruct streak completion dates if any active streak is missing local dates
    const today = new Date();
    for (const h of cleanHabits) {
      const streak = (h as any).streak || 0;
      if (streak > 0) {
        for (let i = 0; i < streak; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateKey = formatDateKey(d);
          const already = cleanCompletions.some(
            (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === dateKey
          );
          if (!already) {
            cleanCompletions.push({
              id: `comp-streak-${h.id}-${dateKey}`,
              habit_id: h.id,
              user_id: uid,
              completion_date: dateKey,
              completed_at: `${dateKey}T12:00:00.000Z`,
            });
          }
        }
      }
    }

    cleanHabits = deduplicateHabits(cleanHabits);
    cleanCompletions = deduplicateCompletions(cleanCompletions);

    localApi.saveHabits(cleanHabits, uid);
    localApi.saveCompletions(cleanCompletions, uid);
    if (targetUser.email) {
      const emailUid = getUserIdFromEmail(targetUser.email);
      localApi.saveHabits(cleanHabits, emailUid);
      localApi.saveCompletions(cleanCompletions, emailUid);
    }
    publishUserHabits(targetUser, cleanHabits, cleanCompletions);

    // Restore user-specific friends and feed
    let userFriends: FriendUser[] = [];
    try {
      const savedFriendsStr = await AsyncStorage.getItem(`habitup_social_friends_${uid}`);
      if (savedFriendsStr) {
        const parsed = JSON.parse(savedFriendsStr);
        if (Array.isArray(parsed)) userFriends = parsed;
      }
    } catch {}

    // Filter out any self records
    const myId = (targetUser.id || '').toLowerCase();
    const myEmail = (targetUser.email || '').trim().toLowerCase();
    const myUsername = (targetUser.username || '').replace(/^@/, '').trim().toLowerCase();

    userFriends = userFriends.filter((f) => {
      const fId = (f.id || '').toLowerCase();
      const fEmail = (f.email || '').trim().toLowerCase();
      const fUsername = (f.username || '').replace(/^@/, '').trim().toLowerCase();

      if (myId && fId === myId) return false;
      if (myEmail && fEmail && fEmail === myEmail) return false;
      if (myUsername && fUsername && fUsername === myUsername) return false;
      return true;
    });

    let userFeed: SocialFeedActivity[] = [];
    try {
      const savedFeedStr = await AsyncStorage.getItem(`habitup_social_feed_${uid}`);
      if (savedFeedStr) {
        const parsed = JSON.parse(savedFeedStr);
        if (Array.isArray(parsed)) userFeed = parsed;
      }
    } catch {}

    // Sync mutual cross-account friends and shared habits for targetUser
    const synced = await syncMutualDataForUser(targetUser, cleanHabits, userFriends);
    cleanHabits = synced.habits;
    userFriends = synced.friends;
    localApi.saveHabits(cleanHabits, uid);
    if (targetUser.email) {
      localApi.saveHabits(cleanHabits, getUserIdFromEmail(targetUser.email));
    }

    const loadedSessions = localApi.getSessions(uid);
    const loadedQueue = localApi.getSyncQueue(uid);

    setUser(targetUser);
    setHabits(cleanHabits);
    setCompletions(cleanCompletions);
    setFriends(userFriends);
    setSocialFeed(userFeed);
    setSessions(loadedSessions);
    setSyncQueue(loadedQueue);
    setIsAuthenticated(true);
    AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(true)).catch(() => {});
    setActiveTab('home');

    // Deliver any queued nudges targeting this newly logged-in account
    checkAndDeliverPendingNudges(targetUser);

    // Immediately sync incoming follow requests and backend friends for this target user
    syncFollowRequests(targetUser);
    syncFriendsWithBackend(targetUser);
    syncExperimentState().catch(() => {});
    registerPushToken().catch(() => {});
  }, [checkAndDeliverPendingNudges, syncFollowRequests, syncFriendsWithBackend, syncExperimentState, registerPushToken]);

  const login = useCallback(
    async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanIdentifier = (identifier || '').trim();
      const pass = (password || '').trim();

      if (!cleanIdentifier) {
        showToast('Please enter an email or username.', undefined, 'warning');
        return { success: false, error: 'Please enter an email or username.' };
      }
      if (!pass) {
        showToast('Please enter your password.', undefined, 'warning');
        return { success: false, error: 'Please enter your password.' };
      }

      const res = await localApi.loginUser(cleanIdentifier, pass);
      if (!res.success) {
        showToast(res.error || 'Authentication failed. Please check your credentials.', undefined, 'warning');
        return { success: false, error: res.error };
      }

      const uid =
        res.user?.id ||
        (cleanIdentifier.includes('@')
          ? getUserIdFromEmail(cleanIdentifier)
          : `usr_${cleanIdentifier.toLowerCase()}`);
      const targetUser: UserProfile =
        res.user ||
        createDefaultUserProfile(
          cleanIdentifier.split('@')[0],
          cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@example.com`,
          undefined,
          cleanIdentifier
        );

      await switchAccountData(targetUser);

      showToast(`Welcome back, ${targetUser.name || targetUser.username || cleanIdentifier}!`, undefined, 'success');
      return { success: true };
    },
    [switchAccountData, showToast]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password?: string,
      username?: string,
      timezone?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'User';
      const cleanUsername =
        (username || '').trim().replace(/^@/, '').toLowerCase() ||
        cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const pass = (password || '').trim();
      const chosenTimezone = timezone || getDetectedTimezone();

      if (!cleanEmail || !pass) {
        showToast('Please provide email, password, and username.', undefined, 'warning');
        return { success: false, error: 'Please provide email, password, and username.' };
      }
      if (!cleanUsername || cleanUsername.length < 3) {
        showToast('Username must be at least 3 characters.', undefined, 'warning');
        return { success: false, error: 'Username must be at least 3 characters.' };
      }
      if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
        showToast('Username can only contain letters, numbers, underscores, and dots.', undefined, 'warning');
        return { success: false, error: 'Username can only contain letters, numbers, underscores, and dots.' };
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', undefined, 'warning');
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const res = await localApi.registerUser(cleanName, cleanEmail, pass, cleanUsername, chosenTimezone);
      if (!res.success) {
        showToast(res.error || 'Registration failed.', undefined, 'warning');
        return { success: false, error: res.error };
      }

      const uid = res.user?.id || getUserIdFromEmail(cleanEmail);
      const newUser: UserProfile = {
        ...(res.user || {}),
        id: uid,
        name: cleanName,
        email: cleanEmail,
        username: res.user?.username || cleanUsername,
        timezone: chosenTimezone,
        avatar: '',
        created_at: res.user?.created_at || new Date().toISOString(),
      };

      localApi.setCurrentUserId(uid);
      localApi.saveUser(newUser, uid);
      localApi.saveHabits([], uid);
      localApi.saveCompletions([], uid);
      localApi.saveSyncQueue([], uid);
      AsyncStorage.setItem('habitup_current_user_id', JSON.stringify(uid)).catch(() => {});
      AsyncStorage.setItem('habitup_current_user_v1', JSON.stringify(newUser)).catch(() => {});

      setUser(newUser);
      setHabits([]);
      setCompletions([]);
      setFriends([]);
      setSocialFeed([]);
      setSessions(localApi.getSessions(uid));
      setSyncQueue([]);
      setIsAuthenticated(true);
      AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(true)).catch(() => {});
      setActiveTab('home');
      setIsOnboardingModalOpen(true);

      syncFollowRequests(newUser);
      syncFriendsWithBackend(newUser);
      syncExperimentState().catch(() => {});
      registerPushToken().catch(() => {});

      showToast(`Welcome, @${newUser.username || cleanUsername}! Let's set up your habits.`, undefined, 'success');
      return { success: true };
    },
    [showToast, setActiveTab, setIsOnboardingModalOpen, syncFollowRequests, syncFriendsWithBackend, syncExperimentState, registerPushToken]
  );

  const logout = useCallback(() => {
    isLoggingOut.current = true;
    try {
      // 1. Permanently save current user's habits & completions before signing out
      if (user?.id && user.id !== 'usr_default') {
        localApi.saveHabits(habits, user.id);
        localApi.saveCompletions(completions, user.id);
        if (user.email) {
          const emailUid = getUserIdFromEmail(user.email);
          localApi.saveHabits(habits, emailUid);
          localApi.saveCompletions(completions, emailUid);
        }
        localApi.saveUser(user, user.id);
        publishUserHabits(user, habits, completions);
      }

      // 2. Clear authentication and session
      setIsAuthenticated(false);
      AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(false)).catch(() => {});
      AsyncStorage.removeItem('habitup_current_user_v1').catch(() => {});
      localApi.clearTokens();
      localApi.logoutUser().catch(() => {});

      // 3. Reset in-memory state to clean default user
      const defaultUser = createDefaultUserProfile('User', '');
      defaultUser.id = 'usr_default';
      localApi.setCurrentUserId('usr_default');
      setUser(defaultUser);
      setHabits([]);
      setCompletions([]);
      setFriends(INITIAL_FRIENDS);
      setSocialFeed(INITIAL_FEED);
      setSessions(localApi.getSessions('usr_default'));
      setSyncQueue([]);

      showToast('You have been signed out.', undefined, 'info');
    } finally {
      setTimeout(() => {
        isLoggingOut.current = false;
      }, 500);
    }
  }, [user, habits, completions, showToast]);

  const deleteAccount = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      if (!password) {
        return { success: false, error: 'Password is required to delete your account.' };
      }

      const res = await localApi.deleteAccount(password);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to delete account.' };
      }

      // Clear local storage and reset all states
      if (user?.id) {
        localApi.resetAllData(user.id);
      }
      if (user?.email) {
        const emailUid = getUserIdFromEmail(user.email);
        localApi.resetAllData(emailUid);
      }

      setHabits([]);
      setCompletions([]);
      setFriends([]);
      setSocialFeed([]);
      setIsAuthenticated(false);
      const defaultUser = createDefaultUserProfile('User', '');
      defaultUser.id = 'usr_default';
      localApi.setCurrentUserId('usr_default');
      setUser(defaultUser);

      AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(false)).catch(() => {});
      AsyncStorage.removeItem('habitup_current_user_v1').catch(() => {});
      AsyncStorage.removeItem('habitup_social_friends_v1').catch(() => {});
      AsyncStorage.removeItem('habitup_social_feed_v1').catch(() => {});
      AsyncStorage.removeItem('habitup_access_token').catch(() => {});
      AsyncStorage.removeItem('habitup_refresh_token').catch(() => {});

      showToast('Your account has been deleted.', undefined, 'info');
      return { success: true };
    },
    [user, showToast]
  );

  const biometricLogin = useCallback(() => {
    setIsBiometricModalOpen(true);
  }, []);

  const socialLogin = useCallback(
    (provider: 'apple' | 'google') => {
      const email = provider === 'apple' ? 'demo.apple@habitup.app' : 'demo.google@habitup.app';
      const name = provider === 'apple' ? 'Apple User' : 'Google User';
      const uid = getUserIdFromEmail(email);
      const userProfile = createDefaultUserProfile(name, email);
      userProfile.id = uid;
      switchAccountData(userProfile);
      showToast(`Signed in with ${provider === 'apple' ? 'Apple' : 'Google'}`, undefined, 'success');
    },
    [switchAccountData, showToast]
  );

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const addMutationToQueue = useCallback((endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', payload: unknown) => {
    const mut: SyncMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      endpoint,
      method,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    setSyncQueue((prev) => {
      const updated = [...prev, mut];
      if (user?.id) {
        localApi.saveSyncQueue(updated, user.id);
      }
      return updated;
    });
  }, [user?.id]);

  const toggleCompletion = useCallback(
    (habitId: string, dateStr?: string) => {
      const rawTarget = dateStr || selectedDate || formatDateKey(new Date());
      const targetDate = rawTarget.split('T')[0];

      if (hapticsEnabled) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // ignore
        }
      }

      setCompletions((prev) => {
        const isAlreadyCompleted = prev.some(
          (c) => c.habit_id === habitId && (c.completion_date || '').split('T')[0] === targetDate
        );

        if (isAlreadyCompleted) {
          // Remove completion locally and from backend
          const updated = prev.filter(
            (c) => !(c.habit_id === habitId && (c.completion_date || '').split('T')[0] === targetDate)
          );
          if (isOffline) {
            addMutationToQueue(`/habits/${habitId}/completions/${targetDate}`, 'DELETE', null);
          } else {
            localApi.removeCompletion(habitId, targetDate).then((res) => {
              if (res?.streak !== undefined) {
                setHabits((prevH) =>
                  prevH.map((h) => (h.id === habitId ? { ...h, streak: res.streak } as any : h))
                );
              }
            }).catch(() => {
              addMutationToQueue(`/habits/${habitId}/completions/${targetDate}`, 'DELETE', null);
            });
          }
          if (user?.id) {
            publishUserHabits(user, habits, updated);
          }
          showToast('Marked uncompleted', undefined, 'info');
          return updated;
        } else {
          // Add completion locally and to backend
          const newCompletion: HabitCompletion = {
            id: `comp-${habitId}-${targetDate}-${Date.now()}`,
            habit_id: habitId,
            user_id: user?.id || 'usr_default',
            completion_date: targetDate,
            completed_at: new Date().toISOString(),
          };
          const updated = deduplicateCompletions([...prev, newCompletion]);
          triggerCelebration();
          if (isOffline) {
            addMutationToQueue(`/habits/${habitId}/completions`, 'POST', { completion_date: targetDate });
          } else {
            localApi.addCompletion(habitId, targetDate).then((res) => {
              if (res?.streak !== undefined) {
                setHabits((prevH) =>
                  prevH.map((h) => (h.id === habitId ? { ...h, streak: res.streak } as any : h))
                );
              }
            }).catch(() => {
              addMutationToQueue(`/habits/${habitId}/completions`, 'POST', { completion_date: targetDate });
            });
          }
          if (user?.id) {
            publishUserHabits(user, habits, updated);
          }
          showToast('Habit completed! 🎉 Keep going!', undefined, 'success');
          return updated;
        }
      });
    },
    [selectedDate, user, habits, hapticsEnabled, isOffline, triggerCelebration, showToast, addMutationToQueue]
  );

  const createHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Habit => {
      const now = new Date().toISOString();
      const cleanName = (habitData.name || '').trim().toLowerCase();
      const tempId = `hab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const resolvedScheduledDays =
        habitData.frequency_type === 'daily' || !habitData.scheduled_days || habitData.scheduled_days.length === 0
          ? [0, 1, 2, 3, 4, 5, 6]
          : habitData.scheduled_days;

      // Check if habit with same name already exists
      const existing = habits.find(
        (h) => !h.deleted_at && !h.archived_at && (h.name || '').trim().toLowerCase() === cleanName
      );

      if (existing) {
        const merged: Habit = {
          ...existing,
          ...habitData,
          scheduled_days: resolvedScheduledDays,
          is_shared: habitData.is_shared || existing.is_shared || false,
          buddy_id: habitData.buddy_id || existing.buddy_id,
          buddy_name: habitData.buddy_name || existing.buddy_name,
          buddy_avatar: habitData.buddy_avatar || existing.buddy_avatar,
          updated_at: now,
        };

        setHabits((prev) => deduplicateHabits(prev.map((h) => (h.id === existing.id ? merged : h))));
        showToast(`Habit "${merged.name}" updated!`, undefined, 'success');

        if (merged.reminder_enabled && merged.reminder_time) {
          notificationService.scheduleReminder(merged);
        }

        if (isOffline) {
          addMutationToQueue(`/habits/${existing.id}`, 'PATCH', merged);
        } else {
          localApi.updateHabitOnServer(existing.id, merged).catch(() => {
            addMutationToQueue(`/habits/${existing.id}`, 'PATCH', merged);
          });
        }

        return merged;
      }

      const newHabit: Habit = {
        ...habitData,
        scheduled_days: resolvedScheduledDays,
        id: tempId,
        user_id: user?.id || 'usr_default',
        created_at: now,
        updated_at: now,
        paused_at: null,
        archived_at: null,
        deleted_at: null,
      };

      setHabits((prev) => deduplicateHabits([...prev, newHabit]));
      showToast(`Habit "${newHabit.name}" created!`, undefined, 'success');

      if (newHabit.reminder_enabled && newHabit.reminder_time) {
        notificationService.scheduleReminder(newHabit);
      }

      // Live Backend Sync or offline queue
      if (isOffline) {
        addMutationToQueue('/habits', 'POST', newHabit);
      } else {
        localApi.createHabitOnServer(newHabit).then((serverHabit) => {
          if (serverHabit) {
            const mergedHabit: Habit = {
              ...serverHabit,
              buddy_id: newHabit.buddy_id,
              buddy_name: newHabit.buddy_name,
              buddy_avatar: newHabit.buddy_avatar,
              is_shared: newHabit.is_shared,
            };
            setHabits((prev) =>
              deduplicateHabits(
                prev.map((h) =>
                  h.id === tempId || (h.name && h.name.toLowerCase() === serverHabit.name.toLowerCase() && h.buddy_id === newHabit.buddy_id)
                    ? mergedHabit
                    : h
                )
              )
            );
          }
        }).catch(() => {
          addMutationToQueue('/habits', 'POST', newHabit);
        });
      }

      return newHabit;
    },
    [user?.id, isOffline, showToast, addMutationToQueue]
  );

  const updateHabit = useCallback(
    (habitId: string, updates: Partial<Habit>) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, ...updates, updated_at: new Date().toISOString() } : h))
      );
      if (isOffline) {
        addMutationToQueue(`/habits/${habitId}`, 'PATCH', updates);
      } else {
        localApi.updateHabitOnServer(habitId, updates).catch(() => {
          addMutationToQueue(`/habits/${habitId}`, 'PATCH', updates);
        });
      }
      showToast('Habit updated.', undefined, 'info');
    },
    [isOffline, showToast, addMutationToQueue]
  );

  const pauseHabit = useCallback((habitId: string) => {
    updateHabit(habitId, { paused_at: new Date().toISOString() });
    if (isOffline) {
      addMutationToQueue(`/habits/${habitId}/pause`, 'PATCH', null);
    } else {
      localApi.pauseHabitOnServer(habitId).catch(() => {
        addMutationToQueue(`/habits/${habitId}/pause`, 'PATCH', null);
      });
    }
  }, [updateHabit, isOffline, addMutationToQueue]);

  const resumeHabit = useCallback((habitId: string) => {
    updateHabit(habitId, { paused_at: null });
    if (isOffline) {
      addMutationToQueue(`/habits/${habitId}/unpause`, 'PATCH', null);
    } else {
      localApi.unpauseHabitOnServer(habitId).catch(() => {
        addMutationToQueue(`/habits/${habitId}/unpause`, 'PATCH', null);
      });
    }
  }, [updateHabit, isOffline, addMutationToQueue]);

  const archiveHabit = useCallback((habitId: string) => {
    updateHabit(habitId, { archived_at: new Date().toISOString() });
    if (isOffline) {
      addMutationToQueue(`/habits/${habitId}/archive`, 'PATCH', null);
    } else {
      localApi.archiveHabitOnServer(habitId).catch(() => {
        addMutationToQueue(`/habits/${habitId}/archive`, 'PATCH', null);
      });
    }
  }, [updateHabit, isOffline, addMutationToQueue]);

  const unarchiveHabit = useCallback((habitId: string) => {
    updateHabit(habitId, { archived_at: null });
    if (isOffline) {
      addMutationToQueue(`/habits/${habitId}/unarchive`, 'PATCH', null);
    } else {
      localApi.unarchiveHabitOnServer(habitId).catch(() => {
        addMutationToQueue(`/habits/${habitId}/unarchive`, 'PATCH', null);
      });
    }
  }, [updateHabit, isOffline, addMutationToQueue]);

  const deleteHabit = useCallback(
    (habitId: string) => {
      const targetHabit = habits.find((h) => h.id === habitId);
      if (targetHabit && targetHabit.buddy_id && targetHabit.is_shared) {
        removeMutualSharedHabitRecord(user?.id || '', targetHabit.buddy_id, targetHabit.name);
        if (user?.email) {
          removeMutualSharedHabitRecord(user.email, targetHabit.buddy_id, targetHabit.name);
        }
      }
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setCompletions((prev) => prev.filter((c) => c.habit_id !== habitId));
      if (isOffline) {
        addMutationToQueue(`/habits/${habitId}`, 'DELETE', null);
      } else {
        localApi.deleteHabitOnServer(habitId).catch(() => {
          addMutationToQueue(`/habits/${habitId}`, 'DELETE', null);
        });
      }
      showToast('Habit deleted.', undefined, 'info');
    },
    [habits, user, isOffline, showToast, addMutationToQueue]
  );

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    showToast('Profile updated.', undefined, 'success');
  }, [showToast]);

  const revokeSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Session revoked.', undefined, 'info');
  }, [showToast]);

  const revokeAllOtherSessions = useCallback(() => {
    setSessions((prev) => prev.filter((s) => s.is_current));
    showToast('All other sessions revoked.', undefined, 'info');
  }, [showToast]);

  const resetAllData = useCallback(() => {
    setHabits([]);
    setCompletions([]);
    setFriends([]);
    setSocialFeed([]);
    AsyncStorage.removeItem('habitup_social_friends_v1').catch(() => {});
    AsyncStorage.removeItem('habitup_social_feed_v1').catch(() => {});
    if (user?.id) {
      localApi.resetAllData(user.id);
    }
    showToast('All data has been reset.', undefined, 'warning');
  }, [user?.id, showToast]);

  const exportJsonData = useCallback((): string => {
    const backup = {
      version: '1.0',
      user,
      habits,
      completions,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  }, [user, habits, completions]);

  const importJsonData = useCallback((jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.habits)) {
        setHabits(deduplicateHabits(data.habits));
      }
      if (Array.isArray(data.completions)) {
        setCompletions(deduplicateCompletions(data.completions));
      }
      showToast('Data imported successfully!', undefined, 'success');
      return true;
    } catch {
      showToast('Invalid backup file format.', undefined, 'warning');
      return false;
    }
  }, [showToast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('habitup_theme_v1', next).catch(() => {});
      return next;
    });
  }, []);

  const triggerTestNotification = useCallback((title?: string, body?: string) => {
    notificationService.triggerTest(title, body);
    showToast('Test notification triggered!', undefined, 'info');
  }, [showToast]);

  const sendHabitReminder = useCallback((habit: Habit) => {
    notificationService.scheduleReminder(habit);
    showToast(`Reminder set for ${habit.name}`, undefined, 'info');
  }, [showToast]);

  const syncWithBackend = useCallback(async () => {
    if (isSyncing) return;
    if (!isAuthenticated || !localApi.hasAuthToken()) {
      showToast('Please log in to sync with cloud backend.', undefined, 'warning');
      return;
    }
    setIsSyncing(true);
    showToast('Syncing with cloud backend...', undefined, 'info');

    try {
      if (isOffline) {
        setIsOffline(false);
      }

      let syncedMutationsCount = 0;
      let syncedHabitsCount = 0;
      let syncedCompletionsCount = 0;

      // 1. Process Pending Mutations in syncQueue
      if (syncQueue.length > 0) {
        for (const mut of syncQueue) {
          try {
            if (mut.method === 'POST' && mut.endpoint === '/habits') {
              const res = await localApi.createHabitOnServer(mut.payload as any);
              if (res) syncedMutationsCount++;
            } else if (mut.method === 'PATCH' && mut.endpoint.includes('/habits/')) {
              const parts = mut.endpoint.split('/');
              const habitId = parts[2];
              if (mut.endpoint.endsWith('/pause')) {
                await localApi.pauseHabitOnServer(habitId);
              } else if (mut.endpoint.endsWith('/unpause')) {
                await localApi.unpauseHabitOnServer(habitId);
              } else if (mut.endpoint.endsWith('/archive')) {
                await localApi.archiveHabitOnServer(habitId);
              } else if (mut.endpoint.endsWith('/unarchive')) {
                await localApi.unarchiveHabitOnServer(habitId);
              } else {
                await localApi.updateHabitOnServer(habitId, mut.payload as any);
              }
              syncedMutationsCount++;
            } else if (mut.method === 'DELETE' && mut.endpoint.includes('/habits/')) {
              const parts = mut.endpoint.split('/');
              const habitId = parts[2];
              if (parts[3] === 'completions' && parts[4]) {
                await localApi.removeCompletion(habitId, parts[4]);
              } else {
                await localApi.deleteHabitOnServer(habitId);
              }
              syncedMutationsCount++;
            } else if (mut.method === 'POST' && mut.endpoint.includes('/completions')) {
              const parts = mut.endpoint.split('/');
              const habitId = parts[2];
              const dStr = (mut.payload as any)?.completion_date;
              await localApi.addCompletion(habitId, dStr);
              syncedMutationsCount++;
            }
          } catch {
            // continue processing
          }
        }
      }

      // 2. Push any local offline habits (with temp ID 'hab-') to backend
      for (const h of habits) {
        if (h.id.startsWith('hab-')) {
          try {
            const serverH = await localApi.createHabitOnServer(h);
            if (serverH) {
              syncedHabitsCount++;
              setHabits((prev) =>
                deduplicateHabits(prev.map((item) => (item.id === h.id ? serverH : item)))
              );
            }
          } catch {}
        }
      }

      // 3. Push local completions to backend
      for (const c of completions) {
        if (c.id.startsWith('comp-')) {
          try {
            const res = await localApi.addCompletion(c.habit_id, c.completion_date);
            if (res?.completion) {
              syncedCompletionsCount++;
            }
          } catch {}
        }
      }

      // 4. Fetch latest habits from server
      const serverHabits = await localApi.fetchHabitsFromServer();
      if (serverHabits && serverHabits.length > 0) {
        setHabits((prev) => deduplicateHabits([...serverHabits, ...prev]));
      }

      // 5. Fetch latest user profile
      const me = await localApi.fetchMe();
      if (me) {
        setUser((prev) => ({ ...(prev || {}), ...me }));
        localApi.saveUser(me, me.id);
      }

      // 6. Clear sync queue
      setSyncQueue([]);
      if (user?.id) {
        localApi.saveSyncQueue([], user.id);
      }

      const totalItemsSynced = syncedMutationsCount + syncedHabitsCount + syncedCompletionsCount;
      if (totalItemsSynced > 0) {
        showToast(
          `Synced ${totalItemsSynced} item${totalItemsSynced === 1 ? '' : 's'} with cloud! (${syncedHabitsCount} habits, ${syncedCompletionsCount} check-ins)`,
          undefined,
          'success'
        );
      } else {
        showToast(
          `All synced! ${habits.length} habits & ${completions.length} check-ins up to date.`,
          undefined,
          'success'
        );
      }
    } catch {
      showToast('Sync completed locally. Cloud server currently unavailable.', undefined, 'info');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOffline, syncQueue, habits, completions, user, showToast]);

  const getHabitStats = useCallback(
    (habitId: string, refDate?: Date): HabitCalculatedStats => {
      const targetHabit = habits.find((h) => h.id === habitId);
      const reference = refDate || new Date(selectedDate + 'T12:00:00');
      return calculateHabitStats(targetHabit, completions, reference);
    },
    [habits, completions, selectedDate]
  );

  const overallStats = useMemo<OverallStats>(() => {
    const activeHabits = habits.filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at);
    const selectedDateTime = new Date(selectedDate + 'T12:00:00');
    
    let totalScheduled = 0;
    let totalCompleted = 0;

    activeHabits.forEach((h) => {
      if (isHabitScheduledOnDate(h, selectedDateTime)) {
        totalScheduled++;
        const isDone = completions.some(
          (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === selectedDate
        );
        if (isDone) totalCompleted++;
      }
    });

    const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    const plantStreak = calculatePlantStreak(habits, completions, selectedDateTime);

    const weekDays = getWeekDays(selectedDateTime);
    const weeklyActivity = weekDays.map((d) => {
      const dStr = d.key;
      let due = 0;
      let done = 0;
      activeHabits.forEach((h) => {
        if (isHabitScheduledOnDate(h, d.date)) {
          due++;
          if (completions.some((c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === dStr)) {
            done++;
          }
        }
      });
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(d.date.getDay() + 6) % 7],
        date: dStr,
        completedCount: done,
        totalDue: due,
      };
    });

    let currentBestStreak = 0;
    let bestAllTimeStreak = 0;
    activeHabits.forEach((h) => {
      const st = calculateHabitStats(h, completions, selectedDateTime);
      if (st.currentStreak > currentBestStreak) currentBestStreak = st.currentStreak;
      if (st.longestStreak > bestAllTimeStreak) bestAllTimeStreak = st.longestStreak;
    });

    return {
      completionRate,
      totalCompletionsCount: completions.length,
      activeHabitsCount: activeHabits.length,
      currentBestStreak,
      bestAllTimeStreak,
      weeklyActivity,
      plantStreak,
    };
  }, [habits, completions, selectedDate]);

  // Social & Community Actions
  const adoptFriendHabit = useCallback(
    async (friendHabit: FriendPublicHabit, friendId: string, friendName: string, friendAvatar?: string) => {
      // 1. Create habit for current user
      createHabit({
        name: friendHabit.name,
        description: friendHabit.description || `Shared routine with ${friendName}`,
        icon: friendHabit.icon,
        color: friendHabit.color,
        frequency_type: friendHabit.frequency_type,
        scheduled_days: friendHabit.scheduled_days,
        reminder_time: friendHabit.reminder_time,
        reminder_enabled: !!friendHabit.reminder_time,
        buddy_id: friendId,
        buddy_name: friendName,
        buddy_avatar: friendAvatar || '🤝',
        is_shared: true,
      });

      // 2. Save mutual connection & mutual shared habit record so partner account gets reciprocal habit
      const currentUserRef: MutualUserRef = {
        id: user?.id || 'usr_default',
        name: user?.name || 'User',
        username: `@${(user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        email: user?.email || '',
        avatar: user?.avatar || '🌟',
      };
      const friendObj = friends.find((f) => f.id === friendId);
      const buddyUserRef: MutualUserRef = {
        id: friendObj?.id || friendId,
        name: friendName,
        username: friendObj?.username || `@${friendName.toLowerCase()}`,
        email: friendObj?.email || '',
        avatar: friendAvatar || friendObj?.avatar || '🤝',
      };
      saveMutualConnection(currentUserRef, buddyUserRef);
      saveMutualSharedHabit(
        friendHabit.name,
        friendHabit.icon,
        friendHabit.color,
        friendHabit.reminder_time || '08:00',
        currentUserRef,
        buddyUserRef
      );

      const newFeedItem: SocialFeedActivity = {
        id: `feed-adopt-${Date.now()}`,
        friendId: user?.id || 'me',
        friendName: user?.name ? user.name.split(' ')[0] : 'You',
        friendUsername: '@' + (user?.name?.toLowerCase().replace(/\s+/g, '_') || 'you'),
        friendAvatar: user?.avatar || '🌟',
        habitName: friendHabit.name,
        habitIcon: friendHabit.icon,
        habitColor: friendHabit.color,
        type: 'habit_adopted',
        timestamp: 'Just now',
        kudosCount: 0,
        hasGivenKudos: false,
      };

      setSocialFeed((prev) => [newFeedItem, ...prev]);

      setFriends((prev) =>
        prev.map((f) => ({
          ...f,
          habits: f.habits.map((h) =>
            h.id === friendHabit.id ? { ...h, adoptersCount: (h.adoptersCount || 0) + 1 } : h
          ),
        }))
      );

      if (soundEnabled) soundService.playCompletionChime();
      if (hapticsEnabled) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {}
      }
      showToast(`Now following "${friendHabit.name}" with ${friendName}! Tracking mutual progress 🤝🎉`, undefined, 'success');
    },
    [createHabit, friends, user, soundEnabled, hapticsEnabled, showToast]
  );

  const sendKudos = useCallback(
    (activityId: string) => {
      setSocialFeed((prev) =>
        prev.map((item) => {
          if (item.id === activityId) {
            const nextState = !item.hasGivenKudos;
            return {
              ...item,
              hasGivenKudos: nextState,
              kudosCount: nextState ? item.kudosCount + 1 : Math.max(0, item.kudosCount - 1),
            };
          }
          return item;
        })
      );
      if (soundEnabled) soundService.playClickSound();
      if (hapticsEnabled) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } catch {}
      }
      showToast('Cheer & kudos sent! 🔥', undefined, 'success');
    },
    [soundEnabled, hapticsEnabled, showToast]
  );

  const sendFriendRequest = useCallback(
    (friendId: string) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friendId
            ? { ...f, isFriend: true, requestStatus: 'accepted' }
            : f
        )
      );
      if (soundEnabled) soundService.playClickSound();
      showToast('Connected as habit buddies! 🤝', undefined, 'success');
    },
    [soundEnabled, showToast]
  );

  const acceptFriendRequest = useCallback(
    (friendId: string) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friendId
            ? { ...f, isFriend: true, requestStatus: 'accepted' }
            : f
        )
      );
      showToast('Friend request accepted! 🎉', undefined, 'success');
    },
    [showToast]
  );

  const createSharedHabit = useCallback(
    (friendId: string, habitName: string, icon?: string, color?: string, time?: string) => {
      const friend = friends.find((f) => f.id === friendId);
      const friendName = friend ? formatFriendDisplayName(friend).displayName : 'Friend';
      const friendAvatar = friend?.avatar || '🤝';
      const myDisplayName = user?.name ? user.name.split(' ')[0] : 'You';

      // 1. Add to current user's habits
      createHabit({
        name: habitName,
        description: `Shared routine with ${friendName} 🤝`,
        icon: icon || 'Target',
        color: color || '#7C5CFF',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        reminder_time: time || '08:00',
        reminder_enabled: !!time,
        buddy_id: friendId,
        buddy_name: friendName,
        buddy_avatar: friendAvatar,
        is_shared: true,
      });

      // 2. Add to friend's habits list
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === friendId) {
            const newFriendHabit: FriendPublicHabit = {
              id: `fh-shared-${Date.now()}`,
              name: habitName,
              description: `Shared with ${myDisplayName}`,
              icon: icon || 'Target',
              color: color || '#7C5CFF',
              frequency_type: 'daily',
              scheduled_days: [0, 1, 2, 3, 4, 5, 6],
              reminder_time: time || '08:00',
              currentStreak: 0,
              isCompletedToday: false,
              adoptersCount: 2,
              weeklyHistory: [false, false, false, false, false, false, false],
            };
            return {
              ...f,
              habits: deduplicateFriendHabits([
                newFriendHabit,
                ...f.habits.filter((h) => (h.name || '').trim().toLowerCase() !== habitName.trim().toLowerCase()),
              ]),
            };
          }
          return f;
        })
      );

      // 3. Record cross-account mutual connection and mutual shared habit
      const currentUserRef: MutualUserRef = {
        id: user?.id || 'usr_default',
        name: user?.name || 'User',
        username: `@${(user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        email: user?.email || '',
        avatar: user?.avatar || '🌟',
      };
      const buddyUserRef: MutualUserRef = {
        id: friend?.id || friendId,
        name: friendName,
        username: friend?.username || `@${friendName.toLowerCase()}`,
        email: friend?.email || '',
        avatar: friendAvatar,
      };
      saveMutualConnection(currentUserRef, buddyUserRef);
      saveMutualSharedHabit(habitName, icon || 'Target', color || '#7C5CFF', time || '08:00', currentUserRef, buddyUserRef);

      if (soundEnabled) soundService.playCompletionChime();
      if (hapticsEnabled) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {}
      }
      showToast(`Shared habit "${habitName}" created for you and ${friendName}! 🤝`, undefined, 'success');
    },
    [createHabit, friends, user, soundEnabled, hapticsEnabled, showToast]
  );

  const nudgeFriend = useCallback(
    (friendId: string, habitName: string) => {
      const friend = friends.find((f) => f.id === friendId);
      const friendName = friend ? formatFriendDisplayName(friend).displayName : 'Your buddy';
      const mySenderName = user?.name ? user.name.split(' ')[0] : 'Your buddy';
      const mySenderUsername = `@${(user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const mySenderAvatar = user?.avatar || '🌟';

      // Find habit icon & color if available
      const friendHabit = friend?.habits.find((h) => h.name.toLowerCase() === habitName.toLowerCase());
      const habitIcon = friendHabit?.icon || 'Target';
      const habitColor = friendHabit?.color || '#F59E0B';

      // Create persistent cross-account nudge record
      const newNudge: FriendNudgeRecord = {
        id: `nudge-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        senderId: user?.id || 'usr_me',
        senderName: user?.name || mySenderName,
        senderUsername: mySenderUsername,
        senderAvatar: mySenderAvatar,
        senderEmail: user?.email || '',
        recipientId: friend?.id || friendId,
        recipientName: friend?.name || friendName,
        recipientUsername: friend?.username || '',
        recipientEmail: friend?.email || '',
        habitName,
        habitIcon,
        habitColor,
        timestamp: new Date().toISOString(),
        delivered: false,
      };

      savePendingNudge(newNudge);

      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === friendId) {
            return {
              ...f,
              habits: f.habits.map((h) =>
                h.name.toLowerCase() === habitName.toLowerCase()
                  ? { ...h, lastNudgeTime: new Date().toISOString() }
                  : h
              ),
            };
          }
          return f;
        })
      );

      if (soundEnabled) soundService.playClickSound();
      if (hapticsEnabled) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } catch {}
      }
      showToast(`Sent a friendly reminder to ${friendName} for "${habitName}"! ⚡👋`, undefined, 'success');
    },
    [friends, user, soundEnabled, hapticsEnabled, showToast]
  );

  const toggleFriendHabitCompletion = useCallback(
    (friendId: string, habitId: string) => {
      const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === friendId) {
            return {
              ...f,
              habits: f.habits.map((h) => {
                if (h.id === habitId) {
                  const nextCompleted = !h.isCompletedToday;
                  const nextWeekly = [...(h.weeklyHistory || [false, false, false, false, false, false, false])];
                  nextWeekly[todayIndex] = nextCompleted;
                  return {
                    ...h,
                    isCompletedToday: nextCompleted,
                    currentStreak: nextCompleted
                      ? h.currentStreak + 1
                      : Math.max(0, h.currentStreak - 1),
                    weeklyHistory: nextWeekly,
                  };
                }
                return h;
              }),
            };
          }
          return f;
        })
      );
      if (soundEnabled) soundService.playClickSound();
    },
    [soundEnabled]
  );

  const addFriendByCodeOrUsername = useCallback(
    async (input: string) => {
      const clean = input.trim();
      if (!clean) return;

      const lower = clean.toLowerCase();
      const myCode = getUserInviteCode(user).toLowerCase();
      const myCleanEmail = (user?.email || '').trim().toLowerCase();
      const myName = (user?.name || '').trim().toLowerCase();
      const myHandle = myName.replace(/[^a-z0-9]/g, '');

      // 1. Prevent adding own profile / own invite code
      if (
        lower === myCode ||
        (myCleanEmail && (lower === myCleanEmail || lower.includes(myCleanEmail))) ||
        (myHandle && (lower === myHandle || lower === `@${myHandle}`)) ||
        (myName && lower === myName)
      ) {
        showToast('This is your own invite code! Share it with a friend 🤝', undefined, 'info');
        return;
      }

      // 2. Extract name & username tag from code or handle
      let extractedHandle = clean.replace(/^@/, '');
      let extractedName = '';

      const habitCodeMatch = clean.match(/^HABIT-([a-zA-Z]+)(\d+)?$/i);
      if (habitCodeMatch) {
        const codeTag = habitCodeMatch[1].toUpperCase();
        if (codeTag === 'RAM') extractedName = 'Ram';
        else if (codeTag === 'VIJ') extractedName = 'Vijay';
        else if (codeTag === 'CHE') extractedName = 'Chetan';
        else if (codeTag === 'SAM') extractedName = 'Sam';
        else if (codeTag === 'ALE') extractedName = 'Alex';
        else if (codeTag === 'SAR') extractedName = 'Sarah';
        else if (codeTag === 'JOH') extractedName = 'John';
        else extractedName = codeTag.charAt(0) + codeTag.slice(1).toLowerCase();

        extractedHandle = codeTag.toLowerCase();
      } else {
        const parts = extractedHandle.split(/[._\s]/)[0];
        extractedName = parts.charAt(0).toUpperCase() + parts.slice(1).toLowerCase();
      }

      const usernameClean = `@${extractedHandle.toLowerCase()}`;
      const displayName = extractedName || 'Habit Buddy';

      // 3. Check if matching friend already exists (excluding self)
      const match = friends.find((f) => {
        if (user?.id && f.id === user.id) return false;
        if (user?.email && f.email && f.email.toLowerCase() === user.email.toLowerCase()) return false;
        return (
          f.username.toLowerCase() === lower ||
          f.username.toLowerCase() === usernameClean.toLowerCase() ||
          f.email.toLowerCase() === lower ||
          getUserInviteCode(f).toLowerCase() === lower ||
          f.name.toLowerCase() === lower ||
          f.name.toLowerCase() === displayName.toLowerCase()
        );
      });

      const currentUserRef: MutualUserRef = {
        id: user?.id || 'usr_default',
        name: user?.name || 'User',
        username: `@${(user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        email: user?.email || '',
        avatar: user?.avatar || '🌟',
      };

      if (match) {
        const partnerHabits = await getFriendPublicHabits(
          match.id,
          match.email,
          match.name,
          match.habits,
          user?.id,
          user?.email,
          user?.username
        );
        setFriends((prev) =>
          prev.map((f) =>
            f.id === match.id ? { ...f, isFriend: true, requestStatus: 'accepted', habits: partnerHabits } : f
          )
        );
        const buddyUserRef: MutualUserRef = {
          id: match.id,
          name: match.name,
          username: match.username,
          email: match.email,
          avatar: match.avatar || '🤝',
        };
        saveMutualConnection(currentUserRef, buddyUserRef);

        if (soundEnabled) soundService.playCompletionChime();
        showToast(`Added ${match.name} (${match.username})! Check out their habits below 🤝`, undefined, 'success');
      } else {
        const partnerHabits = await getFriendPublicHabits(
          `friend-${extractedHandle.toLowerCase()}`,
          `${extractedHandle.toLowerCase()}@gmail.com`,
          displayName,
          undefined,
          user?.id,
          user?.email,
          user?.username
        );

        const newBuddy: FriendUser = {
          id: `friend-${extractedHandle.toLowerCase()}-${Date.now()}`,
          name: displayName,
          username: usernameClean,
          email: `${extractedHandle.toLowerCase()}@gmail.com`,
          avatar: '🤝',
          bio: 'Habit buddy on HabitUp! Building streaks together.',
          plantStage: '🌱 Fresh Seedling (Lvl 1)',
          currentStreak: 0,
          totalCompletions: 0,
          isFriend: true,
          requestStatus: 'accepted',
          habits: partnerHabits,
        };

        setFriends((prev) => [newBuddy, ...prev.filter((f) => f.id !== newBuddy.id && f.id !== user?.id)]);
        const buddyUserRef: MutualUserRef = {
          id: newBuddy.id,
          name: newBuddy.name,
          username: newBuddy.username,
          email: newBuddy.email,
          avatar: newBuddy.avatar || '🤝',
        };
        saveMutualConnection(currentUserRef, buddyUserRef);

        if (soundEnabled) soundService.playCompletionChime();
        showToast(`Connected with ${newBuddy.name} (${usernameClean})! Check out their habits below 🤝`, undefined, 'success');
      }
    },
    [friends, user, soundEnabled, showToast]
  );

  const acceptFollowRequest = useCallback(
    async (requestId: string, friendUsername?: string) => {
      // 1. Resolve valid UUID if requestId is empty or invalid
      let effectiveReqId = isUuid(requestId) ? requestId : '';
      const cleanTarget = (friendUsername || '').replace(/^@/, '').toLowerCase();

      if (!effectiveReqId && cleanTarget) {
        const found = incomingRequests.find(
          (r) =>
            (r.fromUsername || '').replace(/^@/, '').toLowerCase() === cleanTarget ||
            (r.fromUserId && r.fromUserId.toLowerCase() === cleanTarget)
        );
        if (found && isUuid(found.id)) {
          effectiveReqId = found.id;
        }
      }

      if (!effectiveReqId && !isOffline && isAuthenticated && localApi.hasAuthToken()) {
        try {
          const serverRequests = await localApi.fetchPendingFriendRequests();
          const sReq = serverRequests.find(
            (sr) =>
              (cleanTarget && sr.from_username && sr.from_username.replace(/^@/, '').toLowerCase() === cleanTarget) ||
              (cleanTarget && sr.from_user_id && sr.from_user_id.toLowerCase() === cleanTarget) ||
              (sr.request_id && isUuid(sr.request_id))
          );
          if (sReq && isUuid(sReq.request_id || sReq.id)) {
            effectiveReqId = sReq.request_id || sReq.id;
          }
        } catch {}
      }

      // 2. Send accept to server if online
      if (!isOffline && isAuthenticated && localApi.hasAuthToken() && effectiveReqId) {
        try {
          await localApi.acceptFriendRequestOnServer(effectiveReqId);
        } catch (e) {
          console.warn('Backend acceptFriendRequestOnServer error:', e);
        }
      }

      // 3. Update stored requests
      const stored = await getStoredFollowRequests();
      const req = stored.find(
        (r) =>
          (effectiveReqId && r.id === effectiveReqId) ||
          (cleanTarget && (r.fromUsername || '').replace(/^@/, '').toLowerCase() === cleanTarget)
      );
      const updatedStored = stored.map((r) =>
        (effectiveReqId && r.id === effectiveReqId) ||
        (cleanTarget && (r.fromUsername || '').replace(/^@/, '').toLowerCase() === cleanTarget)
          ? { ...r, status: 'accepted' as const }
          : r
      );
      await saveStoredFollowRequests(updatedStored);

      // 4. Update incomingRequests list in state
      setIncomingRequests((prev) =>
        prev.filter(
          (r) =>
            (!effectiveReqId || r.id !== effectiveReqId) &&
            (!cleanTarget || (r.fromUsername || '').replace(/^@/, '').toLowerCase() !== cleanTarget)
        )
      );

      // 5. Find friend and update requestStatus to 'accepted' + load habits
      const targetUsername = (friendUsername || req?.fromUsername || (cleanTarget ? `@${cleanTarget}` : '')).toLowerCase();
      const targetClean = targetUsername.replace(/^@/, '');
      const targetName =
        req?.fromName ||
        (targetClean ? targetClean.charAt(0).toUpperCase() + targetClean.slice(1) : 'Friend');
      const targetAvatar = req?.fromAvatar || '🤝';
      const targetId = req?.fromUserId || `friend-${targetClean}-${Date.now()}`;

      // 6. Fetch partner habits from server if available
      let partnerHabits: FriendPublicHabit[] = [];
      if (!isOffline && isAuthenticated && localApi.hasAuthToken() && req?.fromUserId) {
        try {
          const [backendHabits, friendStats, catalogHabits] = await Promise.all([
            localApi.fetchFriendHabitsFromServer(req.fromUserId),
            localApi.fetchFriendStatsFromServer(req.fromUserId, 'week'),
            getFriendPublicHabits(
              req.fromUserId,
              `${targetClean}@gmail.com`,
              targetName,
              undefined,
              user?.id,
              user?.email,
              user?.username
            ),
          ]);

          if (Array.isArray(backendHabits) && backendHabits.length > 0) {
            const todayIndex = (new Date().getDay() + 6) % 7;
            const todayStr = formatDateKey(new Date());

            partnerHabits = backendHabits
              .filter((bh) => !bh.deleted_at && !bh.archived_at)
              .map((bh) => {
                const catMatch = catalogHabits.find(
                  (ch) =>
                    ch.id === bh.id ||
                    ch.id === `fh-${bh.id}` ||
                    ch.name.trim().toLowerCase() === bh.name.trim().toLowerCase()
                );
                const statMatch = friendStats?.habits?.find(
                  (sh: any) =>
                    sh.id === bh.id ||
                    (sh.name && sh.name.trim().toLowerCase() === bh.name.trim().toLowerCase())
                );
                const streak = Math.max(bh.streak || 0, statMatch?.current_streak || 0, catMatch?.currentStreak || 0);

                let isCompletedToday = false;
                if (catMatch && typeof catMatch.isCompletedToday === 'boolean') {
                  isCompletedToday = catMatch.isCompletedToday;
                } else if (statMatch && (statMatch.is_completed_today !== undefined || statMatch.completed_today !== undefined)) {
                  isCompletedToday = !!(statMatch.is_completed_today ?? statMatch.completed_today);
                } else if ((bh as any).is_completed_today !== undefined || (bh as any).completed_today !== undefined) {
                  isCompletedToday = !!((bh as any).is_completed_today ?? (bh as any).completed_today);
                } else if ((bh as any).last_completed_at) {
                  isCompletedToday = String((bh as any).last_completed_at).split('T')[0] === todayStr;
                } else if (streak > 0) {
                  isCompletedToday = true;
                }

                let weeklyHistory = [false, false, false, false, false, false, false];
                if (catMatch && Array.isArray(catMatch.weeklyHistory) && catMatch.weeklyHistory.some(Boolean)) {
                  weeklyHistory = catMatch.weeklyHistory;
                } else if (isCompletedToday) {
                  weeklyHistory[todayIndex] = true;
                  for (let i = 1; i < streak && todayIndex - i >= 0; i++) {
                    weeklyHistory[todayIndex - i] = true;
                  }
                } else if (streak > 0) {
                  for (let i = 1; i <= streak && todayIndex - i >= 0; i++) {
                    weeklyHistory[todayIndex - i] = true;
                  }
                }

                return {
                  id: bh.id,
                  name: bh.name,
                  description: bh.description || undefined,
                  icon: bh.icon || 'Target',
                  color: bh.color || '#7C5CFF',
                  frequency_type: bh.frequency_type === 'daily' || !bh.frequency_type ? 'daily' : 'custom_days',
                  scheduled_days: Array.isArray(bh.schedule) && bh.schedule.length > 0 ? bh.schedule : [0, 1, 2, 3, 4, 5, 6],
                  reminder_time: '08:00',
                  currentStreak: streak,
                  isCompletedToday,
                  adoptersCount: 1,
                  weeklyHistory,
                };
              });
          } else if (catalogHabits.length > 0) {
            partnerHabits = catalogHabits;
          }
        } catch {}
      }

      if (partnerHabits.length === 0) {
        partnerHabits = await getFriendPublicHabits(
          targetId,
          `${targetClean}@gmail.com`,
          targetName,
          undefined,
          user?.id,
          user?.email,
          user?.username
        );
      }

      partnerHabits = deduplicateFriendHabits(partnerHabits);

      setFriends((prev) => {
        let updated: FriendUser[];
        const existing = prev.find(
          (f) =>
            (targetId && (f.id || '').toLowerCase() === targetId.toLowerCase()) ||
            f.username.toLowerCase() === targetUsername ||
            f.username.toLowerCase() === `@${targetClean}`
        );
        if (existing) {
          updated = prev.map((f) =>
            f.id === existing.id
              ? {
                  ...f,
                  id: targetId || f.id,
                  isFriend: true,
                  requestStatus: 'accepted',
                  habits: partnerHabits.length > 0 ? partnerHabits : f.habits,
                }
              : f
          );
        } else {
          const newFriend: FriendUser = {
            id: targetId,
            name: targetName,
            username: targetUsername.startsWith('@') ? targetUsername : `@${targetClean}`,
            email: `${targetClean}@gmail.com`,
            avatar: targetAvatar,
            bio: 'Habit buddy on HabitUp! Building streaks together.',
            plantStage: '🌱 Fresh Seedling (Lvl 1)',
            currentStreak: req?.bestStreak || 0,
            totalCompletions: req?.totalHabits || 0,
            isFriend: true,
            requestStatus: 'accepted',
            habits: partnerHabits,
          };
          updated = [newFriend, ...prev];
        }

        if (user?.id) {
          AsyncStorage.setItem(`habitup_social_friends_${user.id}`, JSON.stringify(updated)).catch(() => {});
        }
        return updated;
      });

      // 7. Save cross-account mutual connection
      const currentUserRef: MutualUserRef = {
        id: user?.id || 'usr_default',
        name: user?.name || 'User',
        username:
          user?.username ||
          (user?.name ? `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '@user'),
        email: user?.email || '',
        avatar: user?.avatar || '🌟',
      };
      const buddyUserRef: MutualUserRef = {
        id: targetId,
        name: targetName,
        username: targetUsername.startsWith('@') ? targetUsername : `@${targetClean}`,
        email: `${targetClean}@gmail.com`,
        avatar: targetAvatar,
      };
      saveMutualConnection(currentUserRef, buddyUserRef);

      if (user) {
        syncFriendsWithBackend(user);
        syncFollowRequests(user);
      }

      if (soundEnabled) soundService.playCompletionChime();
      showToast(
        `Accepted follow request from @${targetClean}! You can now view and follow each other's habits 🤝`,
        undefined,
        'success'
      );
    },
    [incomingRequests, isOffline, isAuthenticated, user, soundEnabled, showToast, syncFriendsWithBackend, syncFollowRequests]
  );

  const sendFriendRequestByUsername = useCallback(
    async (rawUsername: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const clean = rawUsername.trim();
      if (!clean) return { success: false, error: 'Please enter a username' };

      const cleanHandle = clean.replace(/^@/, '').toLowerCase();
      const myUsername = (
        user?.username ||
        (user?.name ? `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '@user')
      )
        .replace(/^@/, '')
        .toLowerCase();
      const myEmail = (user?.email || '').trim().toLowerCase();
      const myName = (user?.name || '').trim().toLowerCase();

      // 1. Prevent self-follow
      if (
        cleanHandle === myUsername ||
        cleanHandle === myName.replace(/[^a-z0-9]/g, '') ||
        (myEmail && cleanHandle === myEmail)
      ) {
        showToast("You can't follow your own account! Share your @username with friends 🤝", undefined, 'info');
        return { success: false, error: 'Cannot follow yourself' };
      }

      // 2. Check if already following / friend
      const existingFriend = friends.find((f) => {
        const fHandle = (f.username || '').replace(/^@/, '').toLowerCase();
        return fHandle === cleanHandle;
      });

      if (existingFriend && existingFriend.isFriend && existingFriend.requestStatus === 'accepted') {
        showToast(`You are already following @${cleanHandle}! Check out their habits below 🤝`, undefined, 'info');
        return { success: true, message: 'Already friends' };
      }

      // Check if this user already sent ME a request (in incomingRequests or existing pending_received)
      const incomingReq = incomingRequests.find(
        (r) =>
          r.status === 'pending' &&
          (r.fromUsername || '').replace(/^@/, '').toLowerCase() === cleanHandle
      );

      if (incomingReq || existingFriend?.requestStatus === 'pending_received') {
        await acceptFollowRequest(incomingReq?.id || existingFriend?.requestId || '', cleanHandle);
        return { success: true, message: 'Mutual follow accepted!' };
      }

      if (existingFriend && existingFriend.requestStatus === 'pending_sent') {
        showToast(`Follow request already sent to @${cleanHandle} ⏳ Waiting for them to accept.`, undefined, 'info');
        return { success: true, message: 'Request already pending' };
      }

      // 3. Send to server if online & authenticated
      let serverResult: {
        success: boolean;
        message?: string;
        error?: string;
        request_id?: string;
        to_user_id?: string;
      } | null = null;

      if (!isOffline) {
        if (!isAuthenticated || !localApi.hasAuthToken()) {
          showToast(`Please sign in or register to send follow requests to @${cleanHandle} 🤝`, undefined, 'warning');
          setIsAuthSessionModalOpen(true);
          return { success: false, error: 'Authentication required' };
        }

        try {
          serverResult = await localApi.sendFriendRequestByUsername(cleanHandle);

          // If backend says 409 / conflict / already sent, check if it was an incoming request from them!
          if (serverResult.message?.includes('active') || serverResult.message?.includes('already')) {
            const serverRequests = await localApi.fetchPendingFriendRequests();
            const matchingIncoming = serverRequests.find(
              (sr) => sr.from_username && sr.from_username.replace(/^@/, '').toLowerCase() === cleanHandle
            );
            if (matchingIncoming && (matchingIncoming.request_id || matchingIncoming.id)) {
              await acceptFollowRequest(matchingIncoming.request_id || matchingIncoming.id, cleanHandle);
              return { success: true, message: 'Mutual follow accepted!' };
            }
          }

          if (!serverResult.success) {
            showToast(serverResult.error || `Could not send request to @${cleanHandle}`, undefined, 'warning');
            return { success: false, error: serverResult.error };
          }
        } catch (e: any) {
          console.warn('Backend sendFriendRequestByUsername error:', e);
        }
      }

      // 4. Determine display name and avatar
      let displayName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1);
      if (cleanHandle === 'ram') displayName = 'Ram';
      else if (cleanHandle === 'vijay') displayName = 'Vijay';
      else if (cleanHandle === 'chetan') displayName = 'Chetan';
      else if (cleanHandle === 'alex') displayName = 'Alex';
      else if (cleanHandle === 'sarah') displayName = 'Sarah';
      else if (cleanHandle === 'john') displayName = 'John';

      const targetFriendId =
        serverResult?.to_user_id ||
        existingFriend?.id ||
        `friend-${cleanHandle}-${Date.now()}`;

      // 5. Create friend entry with requestStatus: 'pending_sent' (Habits are LOCKED until accepted)
      const pendingBuddy: FriendUser = {
        id: targetFriendId,
        name: displayName,
        username: `@${cleanHandle}`,
        email: `${cleanHandle}@gmail.com`,
        avatar: '🤝',
        bio: 'Habit buddy on HabitUp!',
        plantStage: '🌱 Fresh Seedling (Lvl 1)',
        currentStreak: 0,
        totalCompletions: 0,
        isFriend: true,
        requestStatus: 'pending_sent',
        habits: [], // Locked until accepted!
      };

      setFriends((prev) => [
        pendingBuddy,
        ...prev.filter(
          (f) =>
            f.id !== pendingBuddy.id &&
            f.username.toLowerCase() !== `@${cleanHandle}`.toLowerCase()
        ),
      ]);

      // 6. Record in stored follow requests
      const stored = await getStoredFollowRequests();
      const validReqId = serverResult?.request_id && isUuid(serverResult.request_id) ? serverResult.request_id : '';
      if (validReqId) {
        const newReq: FollowRequestItem = {
          id: validReqId,
          fromUserId: user?.id || 'usr_default',
          fromName: user?.name || 'You',
          fromUsername:
            user?.username ||
            (user?.name ? `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '@user'),
          fromAvatar: user?.avatar || '🌟',
          toUserId: targetFriendId,
          toUsername: `@${cleanHandle}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        await saveStoredFollowRequests([newReq, ...stored.filter((r) => r.id !== validReqId)]);
      }

      if (user) {
        syncFollowRequests(user);
        syncFriendsWithBackend(user);
      }

      if (soundEnabled) soundService.playCompletionChime();
      showToast(
        serverResult?.message?.includes('active') || serverResult?.message?.includes('already')
          ? `Follow request is active for @${cleanHandle}! Habits will unlock once they accept ⏳`
          : `Follow request sent to @${cleanHandle}! Habits will unlock once they accept ⏳`,
        undefined,
        'success'
      );
      return { success: true };
    },
    [friends, incomingRequests, user, isOffline, isAuthenticated, soundEnabled, showToast, acceptFollowRequest, syncFollowRequests, syncFriendsWithBackend, setIsAuthSessionModalOpen]
  );

  const declineFollowRequest = useCallback(
    async (requestId: string) => {
      if (!isOffline && isAuthenticated && localApi.hasAuthToken()) {
        try {
          await localApi.rejectFriendRequestOnServer(requestId);
        } catch (e) {
          console.warn('Backend rejectFriendRequestOnServer error:', e);
        }
      }

      const stored = await getStoredFollowRequests();
      const updatedStored = stored.filter((r) => r.id !== requestId);
      await saveStoredFollowRequests(updatedStored);

      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (user) {
        syncFollowRequests(user);
      }
      if (soundEnabled) soundService.playClickSound();
      showToast('Declined follow request.', undefined, 'info');
    },
    [isOffline, isAuthenticated, soundEnabled, showToast, user, syncFollowRequests]
  );

  const unfollowFriendHabit = useCallback(
    (habitId: string, habitName?: string) => {
      deleteHabit(habitId);

      if (user && habitName) {
        removeMutualSharedHabitRecord(user.id, '', habitName);
        if (user.email) {
          removeMutualSharedHabitRecord(user.email, '', habitName);
        }
      }

      if (soundEnabled) soundService.playClickSound();
      showToast(
        `Unfollowed routine${habitName ? ` "${habitName}"` : ''}. You can re-follow anytime below! 🤝`,
        undefined,
        'info'
      );
    },
    [deleteHabit, user, soundEnabled, showToast]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      const target = friends.find((f) => f.id === friendId);
      const name = target ? formatFriendDisplayName(target).displayName : 'Friend';
      const targetUsername = target?.username ? target.username.replace(/^@/, '') : '';
      const targetEmail = target?.email || '';

      // 1. Remove friend on server if online and authenticated
      if (!isOffline && isAuthenticated && localApi.hasAuthToken()) {
        try {
          let serverIdToRemove = friendId;
          if (!serverIdToRemove || serverIdToRemove.startsWith('friend-')) {
            if (targetUsername) {
              const profile = await localApi.fetchUserProfileByUsername(targetUsername);
              if (profile?.id) serverIdToRemove = profile.id;
            }
          }
          if (serverIdToRemove && !serverIdToRemove.startsWith('friend-')) {
            await localApi.removeFriendOnServer(serverIdToRemove);
          }
        } catch (e) {
          console.warn('removeFriendOnServer error:', e);
        }
      }

      // 2. Clean up stored follow requests if any pending
      try {
        const stored = await getStoredFollowRequests();
        const pendingForThis = stored.filter((r) => {
          const toU = (r.toUsername || '').replace(/^@/, '').toLowerCase();
          const fromU = (r.fromUsername || '').replace(/^@/, '').toLowerCase();
          const toId = (r.toUserId || '').toLowerCase();
          const fromId = (r.fromUserId || '').toLowerCase();
          const fIdLow = (friendId || '').toLowerCase();
          const match =
            (targetUsername && toU === targetUsername.toLowerCase()) ||
            (targetUsername && fromU === targetUsername.toLowerCase()) ||
            toId === fIdLow ||
            fromId === fIdLow;
          if (match && !isOffline && isAuthenticated && localApi.hasAuthToken() && r.id) {
            localApi.rejectFriendRequestOnServer(r.id).catch(() => {});
          }
          return match;
        });

        if (pendingForThis.length > 0) {
          const remainingReqs = stored.filter((r) => !pendingForThis.some((pr) => pr.id === r.id));
          await saveStoredFollowRequests(remainingReqs);
        }
      } catch {}

      // 3. Remove friend completely from active friends state
      setFriends((prev) =>
        prev.filter((f) => {
          if (f.id === friendId) return false;
          if (targetUsername && f.username && f.username.replace(/^@/, '').toLowerCase() === targetUsername.toLowerCase()) {
            return false;
          }
          return true;
        })
      );

      // 4. Remove mutual cross-account records from AsyncStorage
      if (user) {
        await removeMutualRecords(user.id, friendId, targetUsername, target?.name);
        if (user.email) {
          await removeMutualRecords(user.email, targetEmail || friendId, targetUsername, target?.name);
        }
      }

      // 5. Remove all habits created with or adopted from this friend
      const removedHabitIds: string[] = [];
      setHabits((prev) => {
        const remaining: Habit[] = [];
        for (const h of prev) {
          if (
            h.buddy_id === friendId ||
            (targetUsername && h.buddy_name && h.buddy_name.toLowerCase() === targetUsername.toLowerCase()) ||
            (target?.name && h.buddy_name && h.buddy_name.toLowerCase() === target.name.toLowerCase())
          ) {
            removedHabitIds.push(h.id);
          } else {
            remaining.push(h);
          }
        }
        return remaining;
      });

      // 6. Remove completions for those removed habits
      if (removedHabitIds.length > 0) {
        const removedSet = new Set(removedHabitIds);
        setCompletions((prev) => prev.filter((c) => !removedSet.has(c.habit_id)));

        // Sync deletions to backend if needed
        removedHabitIds.forEach((hId) => {
          if (isOffline) {
            addMutationToQueue(`/habits/${hId}`, 'DELETE', null);
          } else {
            localApi.deleteHabitOnServer(hId).catch(() => {
              addMutationToQueue(`/habits/${hId}`, 'DELETE', null);
            });
          }
        });
      }

      if (user) {
        syncFriendsWithBackend(user);
        syncFollowRequests(user);
      }

      if (soundEnabled) soundService.playClickSound();
      showToast(
        removedHabitIds.length > 0
          ? `Unfollowed ${name} and removed ${removedHabitIds.length} shared habit${removedHabitIds.length === 1 ? '' : 's'}.`
          : `Unfollowed ${name}.`,
        undefined,
        'info'
      );
    },
    [friends, soundEnabled, isOffline, isAuthenticated, addMutationToQueue, showToast, user, syncFriendsWithBackend, syncFollowRequests]
  );

  return (
    <HabitContext.Provider
      value={{
        habits,
        completions,
        user,
        sessions,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        deviceFrame,
        setDeviceFrame,
        theme,
        setTheme,
        toggleTheme,
        soundEnabled,
        setSoundEnabled,
        hapticsEnabled,
        setHapticsEnabled,
        isOffline,
        setIsOffline,
        syncQueue,
        toast,
        showToast,
        clearToast,
        isAuthenticated,
        setIsAuthenticated,
        isBiometricModalOpen,
        setIsBiometricModalOpen,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isPlantGardenModalOpen,
        setIsPlantGardenModalOpen,
        selectedHabitForDetail,
        setSelectedHabitForDetail,
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
        isAuthSessionModalOpen,
        setIsAuthSessionModalOpen,
        isNotificationModalOpen,
        setIsNotificationModalOpen,
        notificationsEnabled,
        setNotificationsEnabled,
        fcmPushToken,
        registerPushToken,
        triggerTestNotification,
        sendHabitReminder,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        isAuthLoading,
        login,
        register,
        logout,
        deleteAccount,
        biometricLogin,
        socialLogin,
        toggleCompletion,
        createHabit,
        updateHabit,
        pauseHabit,
        resumeHabit,
        archiveHabit,
        unarchiveHabit,
        deleteHabit,
        updateUser,
        revokeSession,
        revokeAllOtherSessions,
        resetAllData,
        importJsonData,
        exportJsonData,
        triggerCelebration,
        isSyncing,
        syncWithBackend,
        getHabitStats,
        overallStats,
        friends,
        socialFeed,
        incomingRequests,
        sendFriendRequestByUsername,
        acceptFollowRequest,
        declineFollowRequest,
        unfollowFriendHabit,
        adoptFriendHabit,
        createSharedHabit,
        addFriendByCodeOrUsername,
        nudgeFriend,
        toggleFriendHabitCompletion,
        sendKudos,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
        syncFollowRequests,
        syncFriendsWithBackend,
        friendsEnabled,
        experimentVariant,
        recordFriendsExposure,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabit = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabit must be used within a HabitProvider');
  }
  return context;
};
