import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import {
  getMonthCalendarDays,
  formatDateKey,
  isHabitScheduledOnDate,
} from '../../utils/streakCalculator';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Pause,
  Play,
  Archive,
  Trash2,
  AlertTriangle,
  X,
  Bell,
  Clock,
} from 'lucide-react';
import { AVAILABLE_ICONS, HABIT_COLORS } from '../../constants/templates';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitDetailModal: React.FC = () => {
  const {
    selectedHabitForDetail,
    setSelectedHabitForDetail,
    completions,
    toggleCompletion,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    updateHabit,
    setActiveTab,
    sendHabitReminder,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';

  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2024, 5, 1)); // Default June 2024 matching screenshot or current
  const [isEditing, setIsEditing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editFrequency, setEditFrequency] = useState<'daily' | 'custom_days'>('daily');
  const [editScheduleDays, setEditScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [editReminderEnabled, setEditReminderEnabled] = useState<boolean>(true);
  const [editReminderTime, setEditReminderTime] = useState<string>('08:00');

  if (!selectedHabitForDetail) return null;

  const habit = selectedHabitForDetail;
  const stats = getHabitStats(habit.id);
  const isPaused = Boolean(habit.paused_at);
  const isArchived = Boolean(habit.archived_at);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getMonthCalendarDays(year, month);

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(calendarDate);

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCalendarDate(next);
  };

  const todayKey = formatDateKey(new Date());

  const handleStartEdit = () => {
    setEditName(habit.name);
    setEditDesc(habit.description || '30 minutes • Every Day');
    setEditColor(habit.color || '#FF5A79');
    setEditIcon(habit.icon || 'Dumbbell');
    setEditFrequency(habit.frequency_type === 'daily' ? 'daily' : 'custom_days');
    setEditScheduleDays(habit.scheduled_days || [0, 1, 2, 3, 4, 5, 6]);
    setEditReminderEnabled(habit.reminder_enabled ?? true);
    setEditReminderTime(habit.reminder_time || '08:00');
    setShowOptionsMenu(false);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateHabit(habit.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
      icon: editIcon,
      frequency_type: editFrequency,
      scheduled_days: editFrequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : editScheduleDays,
      reminder_enabled: editReminderEnabled,
      reminder_time: editReminderEnabled ? editReminderTime : undefined,
    });

    setSelectedHabitForDetail({
      ...habit,
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
      icon: editIcon,
      frequency_type: editFrequency,
      scheduled_days: editFrequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : editScheduleDays,
      reminder_enabled: editReminderEnabled,
      reminder_time: editReminderEnabled ? editReminderTime : undefined,
    });

    setIsEditing(false);
    showToast('Habit updated successfully!', undefined, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-3">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className={`w-full max-w-[390px] h-full sm:h-[844px] rounded-none sm:rounded-[44px] shadow-2xl overflow-hidden flex flex-col relative select-none ${
          isDark ? 'bg-[#0B1120] text-white' : 'bg-[#F8FAFC] text-neutral-900'
        }`}
      >
        {/* Top Bar matching Screen 1 */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-20">
          <button
            onClick={() => {
              if (isEditing) setIsEditing(false);
              else setSelectedHabitForDetail(null);
            }}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
            }`}
            title="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h2 className="text-[17px] font-bold font-display tracking-tight">
            {isEditing ? 'Edit Habit' : 'Habit Details'}
          </h2>

          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
              }`}
              title="Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Options Dropdown */}
            <AnimatePresence>
              {showOptionsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  className={`absolute right-0 top-10 w-44 rounded-2xl border shadow-xl z-50 p-1.5 ${
                    isDark ? 'bg-[#162032] border-slate-750 text-white' : 'bg-white border-slate-200 text-neutral-900'
                  }`}
                >
                  <button
                    onClick={handleStartEdit}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 text-purple-400" />
                    <span>Edit Habit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isPaused) resumeHabit(habit.id);
                      else pauseHabit(habit.id);
                      setShowOptionsMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>Resume Habit</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-amber-400" />
                        <span>Pause Habit</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      archiveHabit(habit.id);
                      setShowOptionsMenu(false);
                      setSelectedHabitForDetail(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Archive className="w-4 h-4 text-cyan-400" />
                    <span>Archive Habit</span>
                  </button>

                  <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Habit</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
          {isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-400">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#7C5CFF] ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-neutral-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-400">
                  Subtitle / Frequency
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="e.g. 30 minutes • Every Day"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#7C5CFF] ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-neutral-900'
                  }`}
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-400">
                  Color Theme
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setEditColor(c.hex)}
                      className={`w-7 h-7 rounded-xl shrink-0 transition-transform ${
                        editColor === c.hex ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-400">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-28 overflow-y-auto p-1">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setEditIcon(ic)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        editIcon === ic
                          ? 'bg-[#7C5CFF] text-white shadow-md'
                          : isDark ? 'bg-slate-800 text-neutral-400' : 'bg-slate-100 text-neutral-600'
                      }`}
                    >
                      <IconRenderer name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Settings in Edit Form */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#7C5CFF]" />
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {editName.trim() ? `${editName.trim()} Time` : 'Habit Time'}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Alert & chime at this time
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditReminderEnabled(!editReminderEnabled)}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                      editReminderEnabled ? 'bg-[#7C5CFF]' : 'bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        editReminderEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {editReminderEnabled && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <input
                      type="time"
                      value={editReminderTime}
                      onChange={(e) => setEditReminderTime(e.target.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-neutral-900'
                      }`}
                    />
                    <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Daily scheduled time
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs ${
                    isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#7C5CFF] text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE matching Screen 1 */
            <>
              {/* Hero Icon Block & Title */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <div
                  className="w-20 h-20 rounded-[24px] flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 mb-3"
                  style={{ backgroundColor: habit.color || '#FF5A79' }}
                >
                  <IconRenderer name={habit.icon} className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-xl font-bold font-display tracking-tight text-center">
                  {habit.name}
                </h3>
                <p className={`text-xs mt-1 text-center ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {habit.description || (habit.frequency_type === 'daily' ? '30 minutes • Every Day' : 'Weekly Goal')}
                </p>

                {/* Scheduled Time Badge & Quick Test */}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                      habit.reminder_enabled
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : isDark
                        ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-purple-400" />
                    {habit.reminder_enabled
                      ? `${habit.name.toLowerCase().endsWith('time') ? habit.name : `${habit.name} Time`}: ${habit.reminder_time || '08:00'}`
                      : 'No scheduled time'}
                  </span>

                  <button
                    type="button"
                    onClick={() => sendHabitReminder(habit)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-neutral-300 border border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-neutral-700 border border-slate-200'
                    }`}
                    title="Send chime and alert"
                  >
                    <Bell className="w-3 h-3 text-[#7C5CFF]" />
                    Test Alert
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards in 2x2 Grid matching Screen 1 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Current Streak Card (Clickable to view Streaks!) */}
                <div
                  onClick={() => {
                    setSelectedHabitForDetail(null);
                    setActiveTab('streaks');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform ${
                    isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[#FF8A00]">
                    <span className="text-base">🔥</span>
                    <span className="text-2xl font-black font-display text-[#FF8A00]">
                      {stats.currentStreak}
                    </span>
                  </div>
                  <span className={`text-xs font-medium mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Current Streak
                  </span>
                </div>

                {/* 2. Best Streak Card */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <span className={`text-2xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {stats.longestStreak}
                  </span>
                  <span className={`text-xs font-semibold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Best Streak
                  </span>
                </div>

                {/* 3. Completion Rate Card */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <span className={`text-2xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {stats.completionRate}%
                  </span>
                  <span className={`text-xs font-semibold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Completion Rate
                  </span>
                </div>

                {/* 4. Total Completions Card */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <span className={`text-2xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {stats.totalCompletions}
                  </span>
                  <span className={`text-xs font-semibold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Total Completions
                  </span>
                </div>
              </div>

              {/* Calendar Section matching Screen 1 */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#162032]/70 border-slate-800/70 text-white' : 'bg-white border-slate-200 text-neutral-900 shadow-sm'
              }`}>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold font-display">Calendar</h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {monthName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeMonth(-1)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-slate-800' : 'text-neutral-500 hover:text-neutral-900 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-slate-800' : 'text-neutral-500 hover:text-neutral-900 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Labels (M T W T F S S) */}
                <div className={`grid grid-cols-7 gap-1 text-center text-[11px] font-bold mb-2 ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  {DAY_LABELS.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>

                {/* Days Grid with Circular Node Chips */}
                <div className="grid grid-cols-7 gap-1.5">
                  {daysInMonth.map((item) => {
                    const isScheduled = isHabitScheduledOnDate(habit, item.date);
                    const isDone = completions.some(
                      (c) => c.habit_id === habit.id && c.completion_date === item.key
                    );
                    const isCurrentToday = item.key === todayKey;
                    const isPast = item.key < todayKey;
                    const isMissed = !isDone && isScheduled && isPast;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleCompletion(habit.id, item.key)}
                        disabled={!item.isCurrentMonth}
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold transition-all relative ${
                          !item.isCurrentMonth
                            ? 'opacity-25 text-neutral-600'
                            : isDone
                            ? isCurrentToday
                              ? 'bg-[#22D3A8] text-white shadow-md ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0B1120] font-bold'
                              : 'bg-[#22D3A8] text-white shadow-sm font-bold'
                            : isMissed
                            ? 'bg-[#FF5A79] text-white shadow-sm font-bold'
                            : isCurrentToday
                            ? isDark
                              ? 'bg-[#162032] text-white ring-2 ring-[#7C5CFF] font-bold'
                              : 'bg-white text-neutral-900 ring-2 ring-[#7C5CFF] font-bold'
                            : isDark
                            ? 'bg-[#1E293B] text-neutral-400 hover:text-white'
                            : 'bg-slate-100 text-neutral-600 hover:bg-slate-200'
                        }`}
                        title={`${item.key}: ${isDone ? 'Completed' : isMissed ? 'Missed' : 'Pending'}`}
                      >
                        {item.dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
            <div className={`w-full p-5 rounded-2xl border ${isDark ? 'bg-[#162032] border-slate-700 text-white' : 'bg-white border-slate-200 text-neutral-900'}`}>
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Delete Habit?</h4>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                This will delete "{habit.name}" and all of its logged history. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteHabit(habit.id);
                    setSelectedHabitForDetail(null);
                  }}
                  className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
