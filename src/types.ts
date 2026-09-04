export type FrequencyType = 'daily' | 'custom_days';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  scheduled_days: number[]; // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday (matching PRD)
  target_per_week?: number;
  reminder_time?: string; // "07:00"
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
  paused_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  buddy_id?: string;
  buddy_name?: string;
  buddy_avatar?: string;
  is_shared?: boolean;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string; // "YYYY-MM-DD"
  completed_at: string; // ISO Timestamp
}

export interface UserSession {
  id: string;
  device_id: string;
  device_name: string;
  ip_address: string;
  last_used_at: string;
  created_at: string;
  is_current: boolean;
  revoked_at?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatar?: string;
  created_at: string;
}

export interface QuickStartTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'learning';
  icon: string;
  color: string;
  defaultTime: string;
  frequency_type: FrequencyType;
  scheduled_days: number[];
}

export interface HabitCalculatedStats {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage (0 - 100)
  totalCompletions: number;
  isCompletedToday: boolean;
  isScheduledToday: boolean;
  historyMap: Record<string, boolean>; // date string -> completed
}

export interface PlantStageInfo {
  level: number;
  name: string;
  emoji: string;
  minStreak: number;
  description: string;
  accentColor: string;
  badge: string;
}

export interface OverallPlantStreak {
  currentStreak: number;
  bestStreak: number;
  isWateredToday: boolean;
  waterDropsToday: number;
  totalWaterDropsNeeded: number;
  hydrationPercent: number;
  stage: PlantStageInfo;
  nextStage: PlantStageInfo | null;
  daysToNextStage: number;
}

export interface OverallStats {
  completionRate: number;
  totalCompletionsCount: number;
  activeHabitsCount: number;
  currentBestStreak: number;
  bestAllTimeStreak: number;
  weeklyActivity: { day: string; date: string; completedCount: number; totalDue: number }[];
  plantStreak?: OverallPlantStreak;
}

export interface SyncMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: unknown;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

export interface FriendPublicHabit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  scheduled_days: number[];
  reminder_time?: string;
  currentStreak: number;
  isCompletedToday: boolean;
  adoptersCount: number;
  weeklyHistory?: boolean[]; // last 7 days completions (e.g. Mon-Sun)
  lastNudgeTime?: string;
}

export interface FriendUser {
  id: string;
  name: string;
  username: string; // e.g. "@alex_runner"
  email: string;
  avatar: string; // emoji or avatar color
  bio?: string;
  plantStage: string; // e.g. "🌳 Grand Oak"
  currentStreak: number;
  totalCompletions: number;
  isFriend: boolean;
  requestStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  habits: FriendPublicHabit[];
}

export interface SocialFeedActivity {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  type: 'completed' | 'streak_milestone' | 'habit_adopted' | 'garden_level_up';
  streakCount?: number;
  timestamp: string;
  kudosCount: number;
  hasGivenKudos: boolean;
}

export type TabType = 'home' | 'friends' | 'habits' | 'calendar' | 'stats' | 'streaks' | 'settings';
export type DeviceFrameType = 'iphone' | 'android' | 'fullscreen';
export type ColorTheme = 'dark' | 'light';

