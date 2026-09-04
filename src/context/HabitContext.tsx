import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  SocialFeedActivity,
} from '../types';
import { INITIAL_FRIENDS, INITIAL_FEED } from '../constants/socialData';
import { localApi, getUserIdFromEmail, createDefaultUserProfile } from '../services/apiService';
import {
  notificationService,
  InAppNotification,
  requestNotificationPermission,
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
  triggerTestNotification: (title?: string, body?: string) => void;
  sendHabitReminder: (habit: Habit) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  setFilterStatus: (status: 'all' | 'active' | 'paused' | 'archived') => void;

  // Auth Actions
  isAuthLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string, timezone?: string) => Promise<{ success: boolean; error?: string }>;
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
  adoptFriendHabit: (habit: FriendPublicHabit, friendId: string, friendName: string, friendAvatar?: string) => Promise<void>;
  createSharedHabit: (friendId: string, habitName: string, icon?: string, color?: string, time?: string) => void;
  addFriendByCodeOrUsername: (input: string) => void;
  nudgeFriend: (friendId: string, habitName: string) => void;
  toggleFriendHabitCompletion: (friendId: string, habitId: string) => void;
  sendKudos: (activityId: string) => void;
  sendFriendRequest: (friendId: string) => void;
  acceptFriendRequest: (friendId: string) => void;
  removeFriend: (friendId: string) => void;
}

const HabitContext = createContext<HabitContextType | null>(null);

function deduplicateHabits(list: Habit[]): Habit[] {
  const seen = new Set<string>();
  const result: Habit[] = [];
  for (const h of list) {
    if (h && h.id && !seen.has(h.id)) {
      seen.add(h.id);
      result.push(h);
    }
  }
  return result;
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
  senderAvatar?: string;
  recipientId: string;
  recipientName?: string;
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

async function removeMutualRecords(userIdOrEmail: string, friendIdOrEmail: string): Promise<void> {
  try {
    const uKey = userIdOrEmail.toLowerCase();
    const fKey = friendIdOrEmail.toLowerCase();

    const connections = await getMutualConnections();
    const filteredConns = connections.filter((c) => {
      const aId = (c.userA.id || '').toLowerCase();
      const aEmail = (c.userA.email || '').toLowerCase();
      const bId = (c.userB.id || '').toLowerCase();
      const bEmail = (c.userB.email || '').toLowerCase();
      const match =
        ((aId === uKey || aEmail === uKey) && (bId === fKey || bEmail === fKey)) ||
        ((aId === fKey || aEmail === fKey) && (bId === uKey || bEmail === uKey));
      return !match;
    });
    await AsyncStorage.setItem('habitup_mutual_connections_v1', JSON.stringify(filteredConns));

    const habitsList = await getMutualSharedHabits();
    const filteredHabits = habitsList.filter((h) => {
      const aId = (h.userA.id || '').toLowerCase();
      const aEmail = (h.userA.email || '').toLowerCase();
      const bId = (h.userB.id || '').toLowerCase();
      const bEmail = (h.userB.email || '').toLowerCase();
      const match =
        ((aId === uKey || aEmail === uKey) && (bId === fKey || bEmail === fKey)) ||
        ((aId === fKey || aEmail === fKey) && (bId === uKey || bEmail === uKey));
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
        isCompletedToday: true,
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
        isCompletedToday: true,
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
      isCompletedToday: true,
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
    const catalog: Record<string, { habits: Habit[]; completions: HabitCompletion[]; updatedAt: string }> = raw
      ? JSON.parse(raw)
      : {};

    const cleanHabits = habits.filter((h) => !h.deleted_at && !h.archived_at);
    const entry = {
      habits: cleanHabits,
      completions,
      updatedAt: new Date().toISOString(),
    };

    if (user.id) catalog[user.id.toLowerCase()] = entry;
    if (user.email) catalog[user.email.toLowerCase()] = entry;
    const nameKey = (user.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nameKey) catalog[nameKey] = entry;

    await AsyncStorage.setItem('habitup_public_habits_catalog_v1', JSON.stringify(catalog));
  } catch (e) {
    console.warn('publishUserHabits error:', e);
  }
}

export async function getFriendPublicHabits(
  friendId: string,
  friendEmail?: string,
  friendName?: string,
  existingHabits?: FriendPublicHabit[]
): Promise<FriendPublicHabit[]> {
  try {
    const todayStr = formatDateKey(new Date());
    const weekDays = getWeekDays(new Date());

    // 1. Check catalog
    const catalogRaw = await AsyncStorage.getItem('habitup_public_habits_catalog_v1');
    const catalog: Record<string, { habits: Habit[]; completions: HabitCompletion[] }> = catalogRaw
      ? JSON.parse(catalogRaw)
      : {};

    const friendKeyId = (friendId || '').toLowerCase();
    const friendKeyEmail = (friendEmail || '').toLowerCase();
    const friendKeyName = (friendName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let matchedUserHabits: Habit[] = [];
    let matchedUserCompletions: HabitCompletion[] = [];

    for (const [key, val] of Object.entries(catalog)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === friendKeyId ||
        (friendKeyEmail && lowerKey === friendKeyEmail) ||
        (friendKeyName && (lowerKey.includes(friendKeyName) || friendKeyName.includes(lowerKey)))
      ) {
        if (Array.isArray(val.habits) && val.habits.length > 0) {
          matchedUserHabits = val.habits;
          matchedUserCompletions = val.completions || [];
          break;
        }
      }
    }

    // 2. If not found in catalog, check localApi storage
    if (matchedUserHabits.length === 0) {
      const storageHabits = localApi.getHabits(friendId, friendEmail);
      if (storageHabits && storageHabits.length > 0) {
        matchedUserHabits = storageHabits;
        matchedUserCompletions = localApi.getCompletions(friendId, friendEmail);
      }
    }

    // Filter active habits
    const activeHabits = matchedUserHabits.filter((h) => !h.deleted_at && !h.archived_at);

    if (activeHabits.length > 0) {
      return activeHabits.map((h) => {
        const isDoneToday = matchedUserCompletions.some(
          (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === todayStr
        );
        const weeklyHistory = weekDays.map((col) =>
          matchedUserCompletions.some(
            (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === col.key
          )
        );
        const stats = calculateHabitStats(h, matchedUserCompletions);
        const currentStreak = Math.max(stats.currentStreak, isDoneToday ? 1 : 0);

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
    }

    // 3. Fallback to existing habits if any
    if (existingHabits && existingHabits.length > 0) {
      return existingHabits;
    }

    // 4. Default starter public habits
    return getDefaultFriendStarterHabits(friendName || 'Buddy');
  } catch {
    return getDefaultFriendStarterHabits(friendName || 'Buddy');
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
        alreadyFriendIdx >= 0 ? updatedFriends[alreadyFriendIdx].habits : undefined
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
      f.habits = await getFriendPublicHabits(f.id, f.email, f.name, f.habits);
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
      const hasMyHabit = updatedHabits.some(
        (h) =>
          !h.deleted_at &&
          !h.archived_at &&
          h.name.trim().toLowerCase() === cleanHabitName &&
          (h.buddy_id === partnerId || (h.buddy_name && h.buddy_name.toLowerCase() === partnerDisplayName.toLowerCase()))
      );

      if (!hasMyHabit) {
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
            (fh) => fh.name.trim().toLowerCase() === cleanHabitName
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
              habits: [publicHabit, ...f.habits],
            };
          }
        }
        return f;
      });
    }
  });

  return {
    habits: deduplicateHabits(updatedHabits),
    friends: updatedFriends,
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

  // Social & Community State
  const [friends, setFriends] = useState<FriendUser[]>(INITIAL_FRIENDS);
  const [socialFeed, setSocialFeed] = useState<SocialFeedActivity[]>(INITIAL_FEED);

  const isInitialDataLoaded = useRef(false);

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
          loadedFriends = loadedFriends.filter((f) => {
            if (f.id === activeUser.id) return false;
            if (activeUser.email && f.email && f.email.toLowerCase() === activeUser.email.toLowerCase()) return false;
            const myName = (activeUser.name || '').trim().toLowerCase();
            const fName = (f.name || '').trim().toLowerCase();
            const myHandle = myName.replace(/[^a-z0-9]/g, '');
            const fHandle = (f.username || '').replace(/^@/, '').toLowerCase();
            if (myHandle && fHandle && myHandle === fHandle) return false;
            if (myName && fName && myName === fName) return false;
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
        if (currentUid !== 'usr_default') {
          const defaultHabitsStr = await AsyncStorage.getItem('habitup_habits_usr_default');
          if (defaultHabitsStr) {
            try {
              const parsed = JSON.parse(defaultHabitsStr);
              if (Array.isArray(parsed) && parsed.length > 0) loadedHabits.push(...parsed);
            } catch {}
          }
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

        if (loadedHabits.length === 0) {
          const memHabits = localApi.getHabits(currentUid, activeUser?.email);
          if (memHabits.length > 0) loadedHabits.push(...memHabits);
        }

        const cleanHabits = deduplicateHabits(loadedHabits);
        if (cleanHabits.length > 0) {
          setHabits(cleanHabits);
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
        if (currentUid !== 'usr_default') {
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
        const cleanCompletions = deduplicateCompletions(loadedCompletions);
        if (cleanCompletions.length > 0) {
          setCompletions(cleanCompletions);
        }

        setSessions(localApi.getSessions(currentUid));
        setSyncQueue(localApi.getSyncQueue(currentUid));

        // 4. Check Auth state
        const authVal = await AsyncStorage.getItem('habitup_is_authenticated_v1');
        const isAuth = authVal ? JSON.parse(authVal) : false;
        setIsAuthenticated(isAuth);

        if (isAuth) {
          try {
            const me = await localApi.fetchMe();
            if (me) {
              setUser(me);
              localApi.saveUser(me, me.id);
              AsyncStorage.setItem('habitup_current_user_v1', JSON.stringify(me)).catch(() => {});
            }
            const serverHabits = await localApi.fetchHabitsFromServer();
            if (serverHabits && serverHabits.length > 0) {
              setHabits(deduplicateHabits(serverHabits));
              const serverCompletions = await localApi.fetchCompletionsFromServer(serverHabits);
              if (serverCompletions && serverCompletions.length > 0) {
                setCompletions((prev) => deduplicateCompletions([...prev, ...serverCompletions]));
              }
            }
          } catch {
            // offline fallback already loaded
          }
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
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'archived'>('all');

  // Persistence side-effects (only persist once initial bootstrap data is loaded)
  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id) {
      localApi.saveHabits(habits, user.id);
      if (user.email) {
        const emailUid = getUserIdFromEmail(user.email);
        localApi.saveHabits(habits, emailUid);
      }
      publishUserHabits(user, habits, completions);
    }
  }, [habits, user?.id, user?.email]);

  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id) {
      localApi.saveCompletions(completions, user.id);
      if (user.email) {
        const emailUid = getUserIdFromEmail(user.email);
        localApi.saveCompletions(completions, emailUid);
      }
      publishUserHabits(user, habits, completions);
    }
  }, [completions, user?.id, user?.email]);

  useEffect(() => {
    if (isInitialDataLoaded.current && user?.id) {
      localApi.saveUser(user, user.id);
    }
  }, [user]);

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
      if (!currentUser || !currentUser.id) return;
      try {
        const nudges = await getPendingNudges();
        if (!nudges || nudges.length === 0) return;

        const myId = (currentUser.id || '').toLowerCase();
        const myEmail = (currentUser.email || '').toLowerCase();
        const myName = (currentUser.name || '').trim().toLowerCase();
        const myNameFirst = myName.split(' ')[0] || '';
        const myCleanHandle = myName.replace(/[^a-z0-9]/g, '');

        let hasUpdates = false;
        const updatedNudges: FriendNudgeRecord[] = [];

        for (const nudge of nudges) {
          if (nudge.delivered) {
            updatedNudges.push(nudge);
            continue;
          }

          const sendId = (nudge.senderId || '').toLowerCase();
          const sendName = (nudge.senderName || '').trim().toLowerCase();
          const isSender =
            (sendId && myId && sendId === myId) ||
            (sendName && myName && (sendName === myName || sendName === myNameFirst));

          // The sender shouldn't deliver to themselves
          if (isSender) {
            updatedNudges.push(nudge);
            continue;
          }

          const recId = (nudge.recipientId || '').toLowerCase();
          const recEmail = (nudge.recipientEmail || '').toLowerCase();
          const recName = (nudge.recipientName || '').trim().toLowerCase();
          const recNameFirst = recName.split(' ')[0] || '';
          const recCleanHandle = recName.replace(/[^a-z0-9]/g, '');

          // Check if current user is the recipient
          const isRecipient =
            (recId && myId && (recId === myId || recId.includes(myId) || myId.includes(recId))) ||
            (recEmail && myEmail && (recEmail === myEmail || recEmail.includes(myEmail) || myEmail.includes(recEmail))) ||
            (recName && myName && (recName === myName || recName.includes(myName) || myName.includes(recName) || (recNameFirst && recNameFirst === myNameFirst) || (myCleanHandle && recCleanHandle && (myCleanHandle === recCleanHandle || myCleanHandle.includes(recCleanHandle) || recCleanHandle.includes(myCleanHandle))))) ||
            (recId && myNameFirst && (recId.includes(myNameFirst) || (myCleanHandle && recId.includes(myCleanHandle))));

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
    const uid = targetUser.id;
    localApi.setCurrentUserId(uid);
    localApi.saveUser(targetUser, uid);
    AsyncStorage.setItem('habitup_current_user_id', JSON.stringify(uid)).catch(() => {});
    AsyncStorage.setItem('habitup_current_user_v1', JSON.stringify(targetUser)).catch(() => {});

    // 1. Check local storage first with fallback to email key
    let loadedHabits = deduplicateHabits(localApi.getHabits(uid, targetUser.email));
    let loadedCompletions = deduplicateCompletions(localApi.getCompletions(uid, targetUser.email));

    // 2. Fetch latest habits & completions from backend server
    try {
      const serverHabits = await localApi.fetchHabitsFromServer();
      if (serverHabits && serverHabits.length > 0) {
        loadedHabits = deduplicateHabits(serverHabits);
      }
      const serverCompletions = await localApi.fetchCompletionsFromServer(loadedHabits);
      if (serverCompletions && serverCompletions.length > 0) {
        loadedCompletions = deduplicateCompletions([...loadedCompletions, ...serverCompletions]);
      }
    } catch {
      // offline fallback
    }

    localApi.saveHabits(loadedHabits, uid);
    localApi.saveCompletions(loadedCompletions, uid);
    if (targetUser.email) {
      const emailUid = getUserIdFromEmail(targetUser.email);
      localApi.saveHabits(loadedHabits, emailUid);
      localApi.saveCompletions(loadedCompletions, emailUid);
    }

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
    userFriends = userFriends.filter((f) => {
      if (f.id === targetUser.id) return false;
      if (targetUser.email && f.email && f.email.toLowerCase() === targetUser.email.toLowerCase()) return false;
      const myName = (targetUser.name || '').trim().toLowerCase();
      const fName = (f.name || '').trim().toLowerCase();
      const myHandle = myName.replace(/[^a-z0-9]/g, '');
      const fHandle = (f.username || '').replace(/^@/, '').toLowerCase();
      if (myHandle && fHandle && myHandle === fHandle) return false;
      if (myName && fName && myName === fName) return false;
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
    const synced = await syncMutualDataForUser(targetUser, loadedHabits, userFriends);
    loadedHabits = synced.habits;
    userFriends = synced.friends;
    localApi.saveHabits(loadedHabits, uid);
    if (targetUser.email) {
      localApi.saveHabits(loadedHabits, getUserIdFromEmail(targetUser.email));
    }

    const loadedSessions = localApi.getSessions(uid);
    const loadedQueue = localApi.getSyncQueue(uid);

    setUser(targetUser);
    setHabits(loadedHabits);
    setCompletions(loadedCompletions);
    setFriends(userFriends);
    setSocialFeed(userFeed);
    setSessions(loadedSessions);
    setSyncQueue(loadedQueue);
    setIsAuthenticated(true);
    AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(true)).catch(() => {});
    setActiveTab('home');

    // Deliver any queued nudges targeting this newly logged-in account
    checkAndDeliverPendingNudges(targetUser);
  }, [checkAndDeliverPendingNudges]);

  const login = useCallback(
    async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      const pass = (password || '').trim();

      if (!cleanEmail) {
        showToast('Please enter an email address.', undefined, 'warning');
        return { success: false, error: 'Please enter an email address.' };
      }
      if (!pass) {
        showToast('Please enter your password.', undefined, 'warning');
        return { success: false, error: 'Please enter your password.' };
      }

      const res = await localApi.loginUser(cleanEmail, pass);
      if (!res.success) {
        showToast(res.error || 'Authentication failed. Please check your credentials.', undefined, 'warning');
        return { success: false, error: res.error };
      }

      const uid = res.user?.id || getUserIdFromEmail(cleanEmail);
      const targetUser: UserProfile = res.user || createDefaultUserProfile(cleanEmail.split('@')[0], cleanEmail);

      await switchAccountData(targetUser);

      showToast(`Welcome back, ${targetUser.name || cleanEmail}!`, undefined, 'success');
      return { success: true };
    },
    [switchAccountData, showToast]
  );

  const register = useCallback(
    async (name: string, email: string, password?: string, timezone?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || cleanEmail.split('@')[0] || 'User';
      const pass = (password || '').trim();
      const chosenTimezone = timezone || 'Asia/Kolkata';

      if (!cleanEmail || !pass) {
        showToast('Please provide both email and password.', undefined, 'warning');
        return { success: false, error: 'Please provide both email and password.' };
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', undefined, 'warning');
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const res = await localApi.registerUser(cleanName, cleanEmail, pass, chosenTimezone);
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
        timezone: chosenTimezone,
        avatar: '',
        created_at: new Date().toISOString(),
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
      setSessions(localApi.getSessions(uid));
      setSyncQueue([]);
      setIsAuthenticated(true);
      AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(true)).catch(() => {});
      setActiveTab('home');
      setIsOnboardingModalOpen(true);

      showToast(`Welcome, ${cleanName}! Let's set up your habits.`, undefined, 'success');
      return { success: true };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    if (user?.id) {
      localApi.saveHabits(habits, user.id);
      localApi.saveCompletions(completions, user.id);
      if (user.email) {
        const emailUid = getUserIdFromEmail(user.email);
        localApi.saveHabits(habits, emailUid);
        localApi.saveCompletions(completions, emailUid);
      }
      localApi.saveUser(user, user.id);
    }
    setIsAuthenticated(false);
    AsyncStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(false)).catch(() => {});
    AsyncStorage.removeItem('habitup_current_user_v1').catch(() => {});
    setHabits([]);
    setCompletions([]);
    localApi.logoutUser().catch(() => {});
    showToast('You have been signed out.', undefined, 'info');
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
      setUser(null);

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
            localApi.removeCompletion(habitId, targetDate).catch(() => {
              addMutationToQueue(`/habits/${habitId}/completions/${targetDate}`, 'DELETE', null);
            });
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
          triggerCelebration();
          if (isOffline) {
            addMutationToQueue(`/habits/${habitId}/completions`, 'POST', { completion_date: targetDate });
          } else {
            localApi.addCompletion(habitId, targetDate).catch(() => {
              addMutationToQueue(`/habits/${habitId}/completions`, 'POST', { completion_date: targetDate });
            });
          }
          showToast('Habit completed! 🎉 Keep going!', undefined, 'success');
          return deduplicateCompletions([...prev, newCompletion]);
        }
      });
    },
    [selectedDate, user?.id, hapticsEnabled, isOffline, triggerCelebration, showToast, addMutationToQueue]
  );

  const createHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Habit => {
      const now = new Date().toISOString();
      const tempId = `hab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const resolvedScheduledDays =
        habitData.frequency_type === 'daily' || !habitData.scheduled_days || habitData.scheduled_days.length === 0
          ? [0, 1, 2, 3, 4, 5, 6]
          : habitData.scheduled_days;

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
              habits: [newFriendHabit, ...f.habits.filter((h) => h.name.toLowerCase() !== habitName.toLowerCase())],
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
        recipientId: friend?.id || friendId,
        recipientName: friend?.name || friendName,
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
        const partnerHabits = await getFriendPublicHabits(match.id, match.email, match.name, match.habits);
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
          displayName
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

  const removeFriend = useCallback(
    (friendId: string) => {
      const target = friends.find((f) => f.id === friendId);
      const name = target ? formatFriendDisplayName(target).displayName : 'Friend';

      // 1. Remove friend from active friends
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friendId
            ? { ...f, isFriend: false, requestStatus: 'none' }
            : f
        )
      );

      // 2. Remove mutual cross-account records
      if (user) {
        removeMutualRecords(user.id, friendId);
        if (user.email && target?.email) {
          removeMutualRecords(user.email, target.email);
        }
      }

      // 2. Remove all habits created with or adopted from this friend
      const removedHabitIds: string[] = [];
      setHabits((prev) => {
        const remaining: Habit[] = [];
        for (const h of prev) {
          if (h.buddy_id === friendId) {
            removedHabitIds.push(h.id);
          } else {
            remaining.push(h);
          }
        }
        return remaining;
      });

      // 3. Remove completions for those removed habits
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

      if (soundEnabled) soundService.playClickSound();
      showToast(
        removedHabitIds.length > 0
          ? `Removed ${name} and ${removedHabitIds.length} shared habit${removedHabitIds.length === 1 ? '' : 's'}.`
          : `Removed ${name} from habit buddies.`,
        undefined,
        'info'
      );
    },
    [friends, soundEnabled, isOffline, addMutationToQueue, showToast]
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
        adoptFriendHabit,
        createSharedHabit,
        addFriendByCodeOrUsername,
        nudgeFriend,
        toggleFriendHabitCompletion,
        sendKudos,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
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
