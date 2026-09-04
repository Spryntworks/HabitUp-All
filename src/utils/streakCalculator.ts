import {
  Habit,
  HabitCompletion,
  HabitCalculatedStats,
  PlantStageInfo,
  OverallPlantStreak,
} from '../types';

/**
 * Format a Date object as YYYY-MM-DD in local timezone or given timezone offset
 */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a 24-hour time string ("HH:MM" or "HH:MM:SS") to 12-hour AM/PM format (e.g. "8:00 AM", "12:30 PM", "8:15 PM")
 */
export function formatTo12Hour(timeStr?: string | null): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (!clean) return '';

  // Check if it already contains AM or PM
  if (/am|pm/i.test(clean)) return clean;

  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${period}`;
  }

  if (clean.includes('T')) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours}:${minutes} ${period}`;
    }
  }

  return clean;
}

/**
 * Get day of week index where 0 = Monday, 1 = Tuesday, ..., 6 = Sunday (matching PRD)
 */
export function getDayOfWeekIndex(d: Date): number {
  const jsDay = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return (jsDay + 6) % 7; // converts 1(Mon)->0, 6(Sat)->5, 0(Sun)->6
}

/**
 * Checks if a habit is scheduled on a specific date based on frequency_type & scheduled_days
 */
export function isHabitScheduledOnDate(habit: Habit, date: Date): boolean {
  if (!habit) return false;
  if (!habit.frequency_type || habit.frequency_type === 'daily') {
    return true;
  }
  const days = habit.scheduled_days;
  if (!Array.isArray(days) || days.length === 0) {
    return true;
  }
  const dayIdx = getDayOfWeekIndex(date);
  const jsDay = date.getDay();
  return days.includes(dayIdx) || days.includes(jsDay);
}

/**
 * Deterministic streak calculation adhering strictly to PRD Section 8.4:
 * - Daily Habits: Every day is an evaluation day. Missing one scheduled day resets streak to 0.
 * - Scheduled Habits: Off-days do NOT break the streak.
 */
export function calculateHabitStats(
  habit: Habit,
  completions: HabitCompletion[],
  referenceDate: Date = new Date()
): HabitCalculatedStats {
  const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
  const completionSet = new Set(habitCompletions.map((c) => (c.completion_date || '').split('T')[0]));

  const historyMap: Record<string, boolean> = {};
  habitCompletions.forEach((c) => {
    const dKey = (c.completion_date || '').split('T')[0];
    if (dKey) historyMap[dKey] = true;
  });

  const todayKey = formatDateKey(referenceDate);
  const isCompletedToday = completionSet.has(todayKey);
  const isScheduledToday = isHabitScheduledOnDate(habit, referenceDate);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const cursor = new Date(referenceDate);

  // If completed on reference date (whether scheduled or bonus on off-day), start streak at 1
  if (isCompletedToday) {
    currentStreak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // Reference date not completed yet. Check if previous scheduled days were unbroken.
    cursor.setDate(cursor.getDate() - 1);
  }

  // Iterate backwards day-by-day (up to 365 days)
  let searchLimit = 365;
  let streakBroken = false;

  while (searchLimit > 0 && !streakBroken) {
    searchLimit--;
    const dateKey = formatDateKey(cursor);
    const scheduled = isHabitScheduledOnDate(habit, cursor);
    const completed = completionSet.has(dateKey);

    if (scheduled) {
      if (completed) {
        currentStreak++;
      } else {
        streakBroken = true;
        break;
      }
    } else {
      // Off-day: if completed, count as bonus; if not completed, do not break streak
      if (completed) {
        currentStreak++;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // 2. Calculate Longest Streak in history
  let longestStreak = currentStreak;
  let runningStreak = 0;

  // Scan over past 365 days in chronological order
  const chronoCursor = new Date(referenceDate);
  chronoCursor.setDate(chronoCursor.getDate() - 365);

  for (let i = 0; i <= 365; i++) {
    const key = formatDateKey(chronoCursor);
    const scheduled = isHabitScheduledOnDate(habit, chronoCursor);
    const completed = completionSet.has(key);

    if (scheduled) {
      if (completed) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    } else if (completed) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    }
    chronoCursor.setDate(chronoCursor.getDate() + 1);
  }

  // 3. Completion Rate over the last 30 days or since creation
  let scheduledDaysCount = 0;
  let completedDaysCount = 0;
  const rateCursor = new Date(referenceDate);
  rateCursor.setDate(rateCursor.getDate() - 29); // 30 day window

  const createdDate = new Date(habit.created_at || '2026-01-01');
  
  for (let i = 0; i < 30; i++) {
    if (rateCursor >= createdDate && rateCursor <= referenceDate) {
      const scheduled = isHabitScheduledOnDate(habit, rateCursor);
      if (scheduled) {
        scheduledDaysCount++;
        const key = formatDateKey(rateCursor);
        if (completionSet.has(key)) {
          completedDaysCount++;
        }
      }
    }
    rateCursor.setDate(rateCursor.getDate() + 1);
  }

  const completionRate =
    scheduledDaysCount > 0
      ? Math.round((completedDaysCount / scheduledDaysCount) * 100)
      : habitCompletions.length > 0
      ? 100
      : 0;

  return {
    habitId: habit.id,
    currentStreak,
    longestStreak,
    completionRate,
    totalCompletions: habitCompletions.length,
    isCompletedToday,
    isScheduledToday,
    historyMap,
  };
}

/**
 * Generate 7 days for the current active week
 */
export function getWeekDays(referenceDate: Date = new Date()): { date: Date; key: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const current = new Date(referenceDate);
  const dayIndex = getDayOfWeekIndex(current); // 0 = Mon
  
  const monday = new Date(current);
  monday.setDate(monday.getDate() - dayIndex);

  const todayKey = formatDateKey(new Date());
  const week = [];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = formatDateKey(d);
    week.push({
      date: d,
      key,
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      isToday: key === todayKey,
    });
  }

  return week;
}

/**
 * Get days for a month view calendar (e.g. June 2026 or current month)
 */
export function getMonthCalendarDays(year: number, month: number): { date: Date; key: string; dayNumber: number; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: { date: Date; key: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Pad beginning of week (Monday first)
  const startDayOfWeek = getDayOfWeekIndex(firstDay); // 0 = Mon
  for (let i = startDayOfWeek; i > 0; i--) {
    const padDate = new Date(year, month, 1 - i);
    days.push({
      date: padDate,
      key: formatDateKey(padDate),
      dayNumber: padDate.getDate(),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      key: formatDateKey(d),
      dayNumber: i,
      isCurrentMonth: true,
    });
  }

  // Pad to complete the final week (multiple of 7)
  let nextMonthDay = 1;
  while (days.length % 7 !== 0) {
    const padDate = new Date(year, month + 1, nextMonthDay++);
    days.push({
      date: padDate,
      key: formatDateKey(padDate),
      dayNumber: padDate.getDate(),
      isCurrentMonth: false,
    });
  }

  return days;
}

export const PLANT_STAGES: PlantStageInfo[] = [
  {
    level: 1,
    name: 'Little Sprout',
    emoji: '🌱',
    minStreak: 0,
    description: 'A delicate green sprout emerging from rich soil. Water it with daily habit check-ins!',
    accentColor: '#10b981', // emerald
    badge: 'Stage 1 • Sprout',
  },
  {
    level: 2,
    name: 'Growing Seedling',
    emoji: '🌿',
    minStreak: 3,
    description: 'Fresh leaves are unfolding with vitality as your consistent discipline builds momentum.',
    accentColor: '#14b8a6', // teal
    badge: 'Stage 2 • Seedling',
  },
  {
    level: 3,
    name: 'Budding Blossom',
    emoji: '🪴',
    minStreak: 7,
    description: 'A sturdy potted plant preparing to flower. 1 full week of perfect habits!',
    accentColor: '#06b6d4', // cyan
    badge: 'Stage 3 • Potted Bloom',
  },
  {
    level: 4,
    name: 'Flora in Bloom',
    emoji: '🌸',
    minStreak: 14,
    description: 'Vibrant blossoms flourish! Two weeks of continuous daily dedication.',
    accentColor: '#ec4899', // pink
    badge: 'Stage 4 • Blooming Flower',
  },
  {
    level: 5,
    name: 'Zen Bonsai Tree',
    emoji: '🌳',
    minStreak: 21,
    description: 'A magnificent, deeply-rooted bonsai symbolizing three weeks of disciplined mastery.',
    accentColor: '#8b5cf6', // purple
    badge: 'Stage 5 • Master Bonsai',
  },
  {
    level: 6,
    name: 'Golden Orchard',
    emoji: '🍎',
    minStreak: 30,
    description: 'An enchanted tree bearing golden fruits! An elite 30+ day perfect lifestyle streak.',
    accentColor: '#f59e0b', // amber
    badge: 'Stage 6 • Golden Orchard',
  },
];

/**
 * Calculates the overall streak based on "Perfect Days" (days where all scheduled habits were completed)
 * Your daily completed habits serve as water droplets for the growing habit plant.
 */
export function calculatePlantStreak(
  habits: Habit[],
  completions: HabitCompletion[],
  referenceDate: Date = new Date()
): OverallPlantStreak {
  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const completionSet = new Set(
    completions.map((c) => `${c.habit_id}_${c.completion_date}`)
  );

  if (activeHabits.length === 0) {
    const stage = PLANT_STAGES[0];
    return {
      currentStreak: 0,
      bestStreak: 0,
      isWateredToday: false,
      waterDropsToday: 0,
      totalWaterDropsNeeded: 0,
      hydrationPercent: 0,
      stage,
      nextStage: PLANT_STAGES[1],
      daysToNextStage: PLANT_STAGES[1].minStreak,
    };
  }

  const isDatePerfect = (date: Date): { isPerfect: boolean; scheduledCount: number; completedCount: number } => {
    const dateKey = formatDateKey(date);
    const scheduled = activeHabits.filter((h) => isHabitScheduledOnDate(h, date));
    if (scheduled.length === 0) {
      return { isPerfect: true, scheduledCount: 0, completedCount: 0 };
    }
    const completedCount = scheduled.filter((h) => completionSet.has(`${h.id}_${dateKey}`)).length;
    const isPerfect = completedCount === scheduled.length;
    return { isPerfect, scheduledCount: scheduled.length, completedCount };
  };

  // Check today's progress
  const todayProgress = isDatePerfect(referenceDate);
  const isWateredToday = todayProgress.scheduledCount > 0 && todayProgress.isPerfect;

  // 1. Calculate Current Streak (Perfect consecutive days)
  let currentStreak = 0;
  const cursor = new Date(referenceDate);

  if (isWateredToday) {
    currentStreak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // Today not yet fully completed -> check if yesterday backwards was unbroken
    cursor.setDate(cursor.getDate() - 1);
  }

  let searchLimit = 365;
  while (searchLimit > 0) {
    searchLimit--;
    const result = isDatePerfect(cursor);
    if (result.scheduledCount > 0) {
      if (result.isPerfect) {
        currentStreak++;
      } else {
        break; // Streak ends
      }
    }
    // If 0 habits were scheduled (pure rest day), continue without breaking
    cursor.setDate(cursor.getDate() - 1);
  }

  // 2. Calculate Longest Streak in history (Past 365 days)
  let longestStreak = currentStreak;
  let runningStreak = 0;
  const chronoCursor = new Date(referenceDate);
  chronoCursor.setDate(chronoCursor.getDate() - 365);

  for (let i = 0; i <= 365; i++) {
    const res = isDatePerfect(chronoCursor);
    if (res.scheduledCount > 0) {
      if (res.isPerfect) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
    chronoCursor.setDate(chronoCursor.getDate() + 1);
  }

  // 3. Determine Plant Stage
  let activeStageIndex = 0;
  for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
    if (currentStreak >= PLANT_STAGES[i].minStreak) {
      activeStageIndex = i;
      break;
    }
  }

  const stage = PLANT_STAGES[activeStageIndex];
  const nextStage = activeStageIndex < PLANT_STAGES.length - 1 ? PLANT_STAGES[activeStageIndex + 1] : null;
  const daysToNextStage = nextStage ? Math.max(0, nextStage.minStreak - currentStreak) : 0;

  const totalWaterDropsNeeded = todayProgress.scheduledCount;
  const waterDropsToday = todayProgress.completedCount;
  const hydrationPercent =
    totalWaterDropsNeeded > 0
      ? Math.round((waterDropsToday / totalWaterDropsNeeded) * 100)
      : 100;

  return {
    currentStreak,
    bestStreak: longestStreak,
    isWateredToday,
    waterDropsToday,
    totalWaterDropsNeeded,
    hydrationPercent,
    stage,
    nextStage,
    daysToNextStage,
  };
}

/**
 * Generates a unique, deterministic, and personalized invite code for every user.
 * Format: HABIT-<NAME_PREFIX_3><UNIQUE_4_DIGITS> (e.g. HABIT-CHE7842, HABIT-SAM9104, HABIT-ALE3581)
 */
export function getUserInviteCode(
  user?: { id?: string; email?: string; name?: string } | null
): string {
  if (!user) return 'HABIT-UP7700';

  const rawName = (user.name || (user.email ? user.email.split('@')[0] : 'UP')).trim();
  const cleanNameLetters = rawName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = (cleanNameLetters.slice(0, 3) || 'HAB').padEnd(3, 'X');

  // Compute a deterministic hash based on unique user ID and email to guarantee uniqueness per account
  const seed = `${user.id || ''}_${user.email || ''}_${rawName}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // 32-bit integer
  }

  // 4-digit positive unique number between 1000 and 9999
  const uniqueNum = (Math.abs(hash) % 9000) + 1000;

  return `HABIT-${prefix}${uniqueNum}`;
}

