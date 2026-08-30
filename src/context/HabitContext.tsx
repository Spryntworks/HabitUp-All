import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import confetti from 'canvas-confetti';
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
} from '../types';
import { localApi, getUserIdFromEmail, createDefaultUserProfile } from '../services/apiService';
import {
  notificationService,
  InAppNotification,
  syncRemindersToServiceWorker,
  subscribeToWebPush,
  registerServiceWorker,
} from '../services/notificationService';
import {
  formatDateKey,
  calculateHabitStats,
  calculatePlantStreak,
  isHabitScheduledOnDate,
  getWeekDays,
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
  triggerTestNotification: () => void;
  sendHabitReminder: (habit: Habit) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  setFilterStatus: (status: 'all' | 'active' | 'paused' | 'archived') => void;

  // Auth Actions
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string, timezone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  
  // Stats helpers
  getHabitStats: (habitId: string, refDate?: Date) => HabitCalculatedStats;
  overallStats: OverallStats;
}

const HabitContext = createContext<HabitContextType | null>(null);

// Deduplication helpers
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
    if (!c) continue;
    const key = c.id || `${c.habit_id}-${c.completion_date}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('habitup_is_authenticated_v1');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isPlantGardenModalOpen, setIsPlantGardenModalOpen] = useState<boolean>(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isAuthSessionModalOpen, setIsAuthSessionModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('habitup_notifications_enabled_v1');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('habitup_notifications_enabled_v1', JSON.stringify(notificationsEnabled));
    } catch {
      // ignore
    }

    if (notificationsEnabled) {
      registerServiceWorker().then(() => {
        subscribeToWebPush();
      });
    }
  }, [notificationsEnabled]);

  // Sync active reminders with Service Worker & Web Push Server whenever habits change
  useEffect(() => {
    if (!notificationsEnabled) return;
    const activeReminders = habits
      .filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at && h.reminder_enabled && h.reminder_time)
      .map((h) => ({
        habitId: h.id,
        title: h.name,
        time: h.reminder_time!,
      }));
    syncRemindersToServiceWorker(activeReminders);
  }, [habits, notificationsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('habitup_is_authenticated_v1', JSON.stringify(isAuthenticated));
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'archived'>('all');

  // Persistence side-effects (user-scoped)
  useEffect(() => {
    if (user?.id) {
      localApi.saveHabits(habits, user.id);
    }
  }, [habits, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localApi.saveCompletions(completions, user.id);
    }
  }, [completions, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localApi.saveUser(user, user.id);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      localApi.saveSessions(sessions, user.id);
    }
  }, [sessions, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localApi.saveSyncQueue(syncQueue, user.id);
    }
  }, [syncQueue, user?.id]);

  // Initial load & sync with backend server API
  useEffect(() => {
    let isMounted = true;
    async function syncWithBackend() {
      if (!user?.id) return;
      try {
        const [serverHabits, serverCompletions] = await Promise.all([
          localApi.fetchHabits(user.id),
          localApi.fetchCompletions(user.id),
        ]);
        if (isMounted) {
          if (Array.isArray(serverHabits) && serverHabits.length > 0) {
            setHabits((prev) => deduplicateHabits([...prev, ...serverHabits]));
          }
          if (Array.isArray(serverCompletions) && serverCompletions.length > 0) {
            setCompletions((prev) => deduplicateCompletions([...prev, ...serverCompletions]));
          }
        }
      } catch {
        // Fallback safely to local state
      }
    }
    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Background sync mutations when online
  useEffect(() => {
    if (isOffline || syncQueue.length === 0 || !user?.id) return;
    const pendingMutations = syncQueue.filter((m) => m.status === 'pending');
    if (pendingMutations.length === 0) return;

    localApi.syncMutations(pendingMutations, user.id).then((res) => {
      if (res && res.success) {
        setSyncQueue((prev) =>
          prev.map((m) =>
            pendingMutations.some((p) => p.id === m.id) ? { ...m, status: 'synced' } : m
          )
        );
      }
    });
  }, [syncQueue, isOffline, user?.id]);

  const showToast = useCallback(
    (message: string, undoAction?: () => void, type: 'success' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      setToast({ id, message, undoAction, type });
    },
    []
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Helper to switch user account data cleanly without leaking previous account data
  const switchAccountData = useCallback((targetUser: UserProfile) => {
    const uid = targetUser.id;
    localApi.setCurrentUserId(uid);
    localApi.saveUser(targetUser, uid);

    const loadedHabits = deduplicateHabits(localApi.getHabits(uid));
    const loadedCompletions = deduplicateCompletions(localApi.getCompletions(uid));
    const loadedSessions = localApi.getSessions(uid);
    const loadedQueue = localApi.getSyncQueue(uid);

    setUser(targetUser);
    setHabits(loadedHabits);
    setCompletions(loadedCompletions);
    setSessions(loadedSessions);
    setSyncQueue(loadedQueue);
    setIsAuthenticated(true);
    setActiveTab('home');

    // Fetch fresh habits & completions from server for this user
    Promise.all([
      localApi.fetchHabits(uid),
      localApi.fetchCompletions(uid),
    ]).then(([serverHabits, serverCompletions]) => {
      if (Array.isArray(serverHabits) && serverHabits.length > 0) {
        setHabits((prev) => deduplicateHabits([...prev, ...serverHabits]));
      }
      if (Array.isArray(serverCompletions) && serverCompletions.length > 0) {
        setCompletions((prev) => deduplicateCompletions([...prev, ...serverCompletions]));
      }
    }).catch(() => {});
  }, []);

  // Authentication Handlers (PRD Section 8.1)
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
        showToast(res.error || 'Authentication failed. Please check your password.', undefined, 'warning');
        return { success: false, error: res.error };
      }

      const uid = getUserIdFromEmail(cleanEmail);
      const existingUser = localApi.getUser(uid);
      const targetUser: UserProfile = res.user || (existingUser && existingUser.email ? existingUser : createDefaultUserProfile(cleanEmail.split('@')[0], cleanEmail));

      switchAccountData(targetUser);
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
      const chosenTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      if (!cleanEmail || !pass) {
        showToast('Please provide both email and password.', undefined, 'warning');
        return { success: false, error: 'Please provide both email and password.' };
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters.', undefined, 'warning');
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const res = await localApi.registerUser(cleanName, cleanEmail, pass);
      if (!res.success) {
        showToast(res.error || 'Registration failed.', undefined, 'warning');
        return { success: false, error: res.error };
      }

      const uid = getUserIdFromEmail(cleanEmail);
      const newUser: UserProfile = {
        ...(res.user || {}),
        id: uid,
        name: cleanName,
        email: cleanEmail,
        timezone: chosenTimezone,
        avatar: '',
        created_at: new Date().toISOString(),
      };

      // Clean initial state for new account
      localApi.setCurrentUserId(uid);
      localApi.saveUser(newUser, uid);
      localApi.saveHabits([], uid);
      localApi.saveCompletions([], uid);
      localApi.saveSyncQueue([], uid);

      setUser(newUser);
      setHabits([]);
      setCompletions([]);
      setSessions(localApi.getSessions(uid));
      setSyncQueue([]);
      setIsAuthenticated(true);
      setActiveTab('home');

      showToast(`Welcome, ${cleanName}! Account created.`, undefined, 'success');
      return { success: true };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    if (user?.id) {
      localApi.saveHabits(habits, user.id);
      localApi.saveCompletions(completions, user.id);
      localApi.saveUser(user, user.id);
    }
    setIsAuthenticated(false);
    setHabits([]);
    setCompletions([]);
    showToast('Signed out successfully', undefined, 'info');
  }, [habits, completions, user, showToast]);

  const biometricLogin = useCallback(() => {
    if (user && user.email) {
      switchAccountData(user);
    } else {
      const currentUid = localApi.getCurrentUserId();
      const currentUser = localApi.getUser(currentUid);
      switchAccountData(currentUser);
    }
  }, [user, switchAccountData]);

  const socialLogin = useCallback(
    (provider: 'apple' | 'google') => {
      const isApple = provider === 'apple';
      const email = isApple ? 'user@privaterelay.appleid.com' : 'user@gmail.com';
      const name = isApple ? 'Apple User' : 'Google User';
      const uid = getUserIdFromEmail(email);

      const existingUser = localApi.getUser(uid);
      const targetUser: UserProfile = (existingUser && existingUser.email)
        ? existingUser
        : {
            id: uid,
            name,
            email,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
            avatar: '',
            created_at: new Date().toISOString(),
          };

      switchAccountData(targetUser);
      showToast(`Signed in with ${isApple ? 'Apple ID' : 'Google Account'}`, undefined, 'success');
    },
    [switchAccountData, showToast]
  );

  // Audio / Sound synthesizer for satisfying click & celebration chime
  const playClickSound = useCallback((isCompleting: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (isCompleting) {
        // Cheerful ascending arpeggio chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.16); // C6
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
      } else {
        // Subtle soft descending click for undo
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }, [soundEnabled]);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#FF4D6D', '#FFB800', '#8B5CF6', '#00C2FF', '#10B981'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const sendHabitReminder = useCallback(
    (habit: Habit) => {
      const habitTimeTitle = habit.name.toLowerCase().endsWith('time')
        ? habit.name
        : `${habit.name} Time`;

      const notif: InAppNotification = {
        id: `remind-${habit.id}-${Date.now()}`,
        habitId: habit.id,
        title: habitTimeTitle,
        body: habit.description || `It's time for your ${habit.name} habit. Tap to complete today's session!`,
        icon: habit.icon,
        color: habit.color,
        timestamp: new Date().toISOString(),
        reminderTime: habit.reminder_time || '08:00',
        type: 'reminder',
      };

      notificationService.sendNotification(notif, {
        soundEnabled,
        hapticsEnabled,
      });
    },
    [soundEnabled, hapticsEnabled]
  );

  const triggerTestNotification = useCallback(() => {
    const notif: InAppNotification = {
      id: `test-${Date.now()}`,
      title: 'HabitUp Notifications Active! 🔔',
      body: 'Your daily habit reminders and sound chimes are configured and working perfectly.',
      icon: 'Sparkles',
      color: '#7C5CFF',
      timestamp: new Date().toISOString(),
      reminderTime: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date()),
      type: 'system',
    };

    notificationService.sendNotification(notif, {
      soundEnabled,
      hapticsEnabled,
    });
    showToast('🔔 Test notification sent!', undefined, 'success');
  }, [soundEnabled, hapticsEnabled, showToast]);

  // Listen to external custom events (e.g. trigger-habit-reminder)
  useEffect(() => {
    const handleTriggerReminder = (e: Event) => {
      const customEvent = e as CustomEvent<{ habitId?: string }>;
      const habitId = customEvent.detail?.habitId;
      const targetHabit = habitId ? habits.find((h) => h.id === habitId) : habits[0];
      if (targetHabit) {
        sendHabitReminder(targetHabit);
      } else {
        triggerTestNotification();
      }
    };

    window.addEventListener('trigger-habit-reminder', handleTriggerReminder);
    return () => {
      window.removeEventListener('trigger-habit-reminder', handleTriggerReminder);
    };
  }, [habits, sendHabitReminder, triggerTestNotification]);

  // Background Reminder Scheduler - checks every 30 seconds
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayKey = formatDateKey(now);

      const activeHabits = habits.filter(
        (h) =>
          !h.archived_at &&
          !h.deleted_at &&
          !h.paused_at &&
          h.reminder_enabled &&
          h.reminder_time &&
          isHabitScheduledOnDate(h, now)
      );

      activeHabits.forEach((h) => {
        // If habit reminder time matches current minute and hasn't been notified today
        if (
          h.reminder_time === currentTimeStr &&
          !notificationService.hasBeenNotified(h.id, todayKey)
        ) {
          const isAlreadyCompleted = completions.some(
            (c) => c.habit_id === h.id && c.completion_date === todayKey
          );

          if (!isAlreadyCompleted) {
            notificationService.markAsNotified(h.id, todayKey);
            sendHabitReminder(h);
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [habits, completions, notificationsEnabled, sendHabitReminder]);

  // Auto clear toast after 4.5s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Streak & stats calculation for a specific habit
  const getHabitStats = useCallback(
    (habitId: string, refDate: Date = new Date(selectedDate + 'T12:00:00')): HabitCalculatedStats => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) {
        return {
          habitId,
          currentStreak: 0,
          longestStreak: 0,
          completionRate: 0,
          totalCompletions: 0,
          isCompletedToday: false,
          isScheduledToday: false,
          historyMap: {},
        };
      }
      return calculateHabitStats(habit, completions, refDate);
    },
    [habits, completions, selectedDate]
  );

  // Overall statistics aggregated across all active habits
  const overallStats = useMemo<OverallStats>(() => {
    const activeHabits = habits.filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at);
    const today = new Date(selectedDate + 'T12:00:00');
    
    let totalStreaksSum = 0;
    let currentBest = 0;
    let bestAllTime = 0;
    let totalRateSum = 0;

    activeHabits.forEach((h) => {
      const stats = calculateHabitStats(h, completions, today);
      totalStreaksSum += stats.currentStreak;
      if (stats.currentStreak > currentBest) currentBest = stats.currentStreak;
      if (stats.longestStreak > bestAllTime) bestAllTime = stats.longestStreak;
      totalRateSum += stats.completionRate;
    });

    const completionRate =
      activeHabits.length > 0 ? Math.round(totalRateSum / activeHabits.length) : 0;

    // Weekly activity for chart
    const week = getWeekDays(today);
    const weeklyActivity = week.map((w) => {
      let completedCount = 0;
      let totalDue = 0;

      activeHabits.forEach((h) => {
        if (isHabitScheduledOnDate(h, w.date)) {
          totalDue++;
          const isDone = completions.some(
            (c) => c.habit_id === h.id && c.completion_date === w.key
          );
          if (isDone) completedCount++;
        }
      });

      return {
        day: w.dayName,
        date: w.key,
        completedCount,
        totalDue,
      };
    });

    const plantStreak = calculatePlantStreak(habits, completions, today);

    return {
      completionRate,
      totalCompletionsCount: completions.length,
      activeHabitsCount: activeHabits.length,
      currentBestStreak: currentBest,
      bestAllTimeStreak: bestAllTime,
      weeklyActivity,
      plantStreak,
    };
  }, [habits, completions, selectedDate]);

  // Single-tap completion and undo with <50ms optimistic latency (PRD Section 8.3 & 11)
  const toggleCompletion = useCallback(
    (habitId: string, dateStr?: string) => {
      const targetDate = dateStr || selectedDate;
      const existingCompletion = completions.find(
        (c) => c.habit_id === habitId && c.completion_date === targetDate
      );
      const habit = habits.find((h) => h.id === habitId);
      const habitName = habit?.name || 'Habit';

      if (existingCompletion) {
        // Toggle OFF (Undo)
        setCompletions((prev) => prev.filter((c) => c.id !== existingCompletion.id));
        playClickSound(false);

        // Call backend API
        if (!isOffline) {
          localApi.toggleCompletion(habitId, targetDate).catch(() => {});
        }

        // Queue sync mutation
        const mutation: SyncMutation = {
          id: `mut-${Date.now()}`,
          endpoint: `/habits/${habitId}/completions/${targetDate}`,
          method: 'DELETE',
          payload: { habit_id: habitId, date: targetDate },
          timestamp: new Date().toISOString(),
          status: isOffline ? 'pending' : 'synced',
        };
        setSyncQueue((prev) => [mutation, ...prev.slice(0, 49)]);

        showToast(
          `Marked "${habitName}" as pending`,
          () => {
            // Undo the undo (Re-complete)
            setCompletions((prev) => [...prev, existingCompletion]);
            if (!isOffline) {
              localApi.toggleCompletion(habitId, targetDate).catch(() => {});
            }
          },
          'info'
        );
      } else {
        // Toggle ON (Complete)
        const newCompletion: HabitCompletion = {
          id: `c-${habitId}-${targetDate}`,
          habit_id: habitId,
          user_id: user.id,
          completion_date: targetDate,
          completed_at: new Date().toISOString(),
        };

        setCompletions((prev) => [...prev, newCompletion]);
        playClickSound(true);

        // Call backend API
        if (!isOffline) {
          localApi.toggleCompletion(habitId, targetDate).catch(() => {});
        }

        // Check if all active habits scheduled for today are completed for instant celebration
        const activeScheduled = habits.filter(
          (h) => !h.archived_at && !h.deleted_at && !h.paused_at && isHabitScheduledOnDate(h, new Date(targetDate + 'T12:00:00'))
        );
        const willBeAllDone = activeScheduled.every(
          (h) => h.id === habitId || completions.some((c) => c.habit_id === h.id && c.completion_date === targetDate)
        );

        if (willBeAllDone && activeScheduled.length > 0) {
          triggerCelebration();
          showToast(`🎉 Incredible! All habits completed for ${targetDate === formatDateKey(new Date()) ? 'today' : targetDate}!`, undefined, 'success');
        } else {
          // Calculate new streak
          const newStats = calculateHabitStats(
            habit || ({} as Habit),
            [...completions, newCompletion],
            new Date(targetDate + 'T12:00:00')
          );
          showToast(
            `Completed "${habitName}"! 🔥 ${newStats.currentStreak} day streak`,
            () => {
              // Undo completion
              setCompletions((prev) => prev.filter((c) => c.id !== newCompletion.id));
              if (!isOffline) {
                localApi.toggleCompletion(habitId, targetDate).catch(() => {});
              }
            },
            'success'
          );
        }

        // Queue sync mutation
        const mutation: SyncMutation = {
          id: `mut-${Date.now()}`,
          endpoint: `/habits/${habitId}/completions`,
          method: 'POST',
          payload: newCompletion,
          timestamp: new Date().toISOString(),
          status: isOffline ? 'pending' : 'synced',
        };
        setSyncQueue((prev) => [mutation, ...prev.slice(0, 49)]);
      }
    },
    [completions, habits, selectedDate, user.id, isOffline, playClickSound, showToast, triggerCelebration]
  );

  // Create Habit
  const createHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Habit => {
      const newHabit: Habit = {
        ...habitData,
        id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setHabits((prev) => deduplicateHabits([newHabit, ...prev.filter(h => h.id !== newHabit.id)]));

      const mutation: SyncMutation = {
        id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        endpoint: '/habits',
        method: 'POST',
        payload: newHabit,
        timestamp: new Date().toISOString(),
        status: isOffline ? 'pending' : 'synced',
      };
      setSyncQueue((prev) => [mutation, ...prev.slice(0, 49)]);
      showToast(`Created habit "${newHabit.name}"`, undefined, 'success');

      return newHabit;
    },
    [user.id, isOffline, showToast]
  );

  // Update Habit
  const updateHabit = useCallback(
    (habitId: string, updates: Partial<Habit>) => {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, ...updates, updated_at: new Date().toISOString() }
            : h
        )
      );

      const mutation: SyncMutation = {
        id: `mut-${Date.now()}`,
        endpoint: `/habits/${habitId}`,
        method: 'PATCH',
        payload: updates,
        timestamp: new Date().toISOString(),
        status: isOffline ? 'pending' : 'synced',
      };
      setSyncQueue((prev) => [mutation, ...prev.slice(0, 49)]);
      showToast('Habit updated successfully', undefined, 'success');
    },
    [isOffline, showToast]
  );

  // Pause Habit (PRD Section 8.5)
  const pauseHabit = useCallback(
    (habitId: string) => {
      updateHabit(habitId, { paused_at: new Date().toISOString() });
      showToast('Habit paused. Streak preserved.', undefined, 'info');
    },
    [updateHabit, showToast]
  );

  // Resume Habit
  const resumeHabit = useCallback(
    (habitId: string) => {
      updateHabit(habitId, { paused_at: null });
      showToast('Habit resumed and back on schedule!', undefined, 'success');
    },
    [updateHabit, showToast]
  );

  // Archive Habit
  const archiveHabit = useCallback(
    (habitId: string) => {
      updateHabit(habitId, { archived_at: new Date().toISOString() });
      showToast('Habit moved to Archive. Historical stats preserved.', undefined, 'info');
    },
    [updateHabit, showToast]
  );

  // Unarchive Habit
  const unarchiveHabit = useCallback(
    (habitId: string) => {
      updateHabit(habitId, { archived_at: null });
      showToast('Habit restored from archive.', undefined, 'success');
    },
    [updateHabit, showToast]
  );

  // Delete Habit (Soft-delete PRD Section 8.5)
  const deleteHabit = useCallback(
    (habitId: string) => {
      const habitToDelete = habits.find((h) => h.id === habitId);
      updateHabit(habitId, { deleted_at: new Date().toISOString() });
      
      showToast(
        `Deleted "${habitToDelete?.name || 'Habit'}"`,
        () => {
          // Restore
          updateHabit(habitId, { deleted_at: null });
        },
        'warning'
      );
    },
    [habits, updateHabit, showToast]
  );

  // User profile
  const updateUser = useCallback(
    (updates: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...updates }));
      showToast('Profile updated', undefined, 'success');
    },
    [showToast]
  );

  // Sessions management (PRD Section 8.1)
  const revokeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, revoked_at: new Date().toISOString() } : s
        )
      );
      showToast('Session revoked', undefined, 'info');
    },
    [showToast]
  );

  const revokeAllOtherSessions = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) =>
        !s.is_current ? { ...s, revoked_at: new Date().toISOString() } : s
      )
    );
    showToast('Logged out of all other devices', undefined, 'success');
  }, [showToast]);

  // Reset to default seed data
  const resetAllData = useCallback(() => {
    if (user?.id) {
      localApi.resetAllData(user.id);
    }
    setHabits([]);
    setCompletions([]);
    setSessions(localApi.getSessions(user?.id));
    setSyncQueue([]);
    showToast('App reset to fresh initial data for this account', undefined, 'info');
  }, [user?.id, showToast]);

  // Export JSON (for easy migration to backend / PostgreSQL database)
  const exportJsonData = useCallback((): string => {
    const bundle = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user,
      habits: habits.filter((h) => !h.deleted_at),
      completions,
      sessions,
    };
    return JSON.stringify(bundle, null, 2);
  }, [user, habits, completions, sessions]);

  // Import JSON
  const importJsonData = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          setHabits(parsed.habits);
          if (parsed.completions && Array.isArray(parsed.completions)) {
            setCompletions(parsed.completions);
          }
          if (parsed.user) {
            setUser(parsed.user);
          }
          showToast('Data imported successfully!', undefined, 'success');
          return true;
        }
        showToast('Invalid backup format', undefined, 'warning');
        return false;
      } catch (e) {
        showToast('Failed to parse JSON backup file', undefined, 'warning');
        return false;
      }
    },
    [showToast]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
        login,
        register,
        logout,
        biometricLogin,
        socialLogin,
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
        getHabitStats,
        overallStats,
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
