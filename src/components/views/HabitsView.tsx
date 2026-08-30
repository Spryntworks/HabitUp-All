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
  Plus,
} from 'lucide-react';
import { AVAILABLE_ICONS, HABIT_COLORS } from '../../constants/templates';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitsView: React.FC = () => {
  const {
    habits,
    completions,
    toggleCompletion,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    updateHabit,
    setActiveTab,
    setIsCreateModalOpen,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at
  );

  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    activeHabits[0]?.id || 'h-1'
  );

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
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

  const currentHabit =
    activeHabits.find((h) => h.id === selectedHabitId) ||
    activeHabits[0] || {
      id: 'h-1',
      name: 'Morning Workout',
      description: '30 minutes • Every Day',
      color: '#FF5A79',
      icon: 'Dumbbell',
      frequency_type: 'daily' as const,
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
    };

  const stats = getHabitStats(currentHabit.id);
  const isPaused = Boolean(currentHabit.paused_at);

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
    setEditName(currentHabit.name);
    setEditDesc(currentHabit.description || '30 minutes • Every Day');
    setEditColor(currentHabit.color || '#FF5A79');
    setEditIcon(currentHabit.icon || 'Dumbbell');
    setEditFrequency(currentHabit.frequency_type === 'daily' ? 'daily' : 'custom_days');
    setEditScheduleDays(currentHabit.scheduled_days || [0, 1, 2, 3, 4, 5, 6]);
    setShowOptionsMenu(false);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateHabit(currentHabit.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
      icon: editIcon,
      frequency_type: editFrequency,
      scheduled_days: editFrequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : editScheduleDays,
    });

    setIsEditing(false);
    showToast('Habit updated successfully!', undefined, 'success');
  };

  return (
    <div className={`flex flex-col flex-1 px-5 pt-2 pb-6 space-y-3 select-none ${
      isDark ? 'text-white' : 'text-neutral-900'
    }`}>
      {/* Top Header matching Habit Details Screen */}
      <div className="flex items-center justify-between py-1 relative">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-2 rounded-xl transition-colors ${
            isDark ? 'text-neutral-300 hover:text-white hover:bg-slate-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-slate-100'
          }`}
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-lg font-bold font-display tracking-tight text-center">
          {isEditing ? 'Edit Habit' : 'Habit Details'}
        </h1>

        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white hover:bg-slate-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-slate-100'
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
                    if (isPaused) resumeHabit(currentHabit.id);
                    else pauseHabit(currentHabit.id);
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
                    archiveHabit(currentHabit.id);
                    setShowOptionsMenu(false);
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

      {/* Habit Switcher Bar */}
      {activeHabits.length > 1 && !isEditing && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {activeHabits.map((h) => {
            const isSelected = h.id === currentHabit.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#7C5CFF] text-white shadow-md shadow-indigo-500/25'
                    : isDark
                    ? 'bg-[#162032] text-slate-300 hover:text-white border border-slate-800'
                    : 'bg-white text-slate-700 hover:text-slate-950 border border-slate-200 shadow-sm'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: h.color || '#FF5A79' }}
                />
                <span>{h.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Body */}
      {isEditing ? (
        /* Edit Form */
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
        /* Habit Details View matching Image */
        <div className="space-y-4 landscape:space-y-0 landscape:grid landscape:grid-cols-12 landscape:gap-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4">
          {/* Left Column in Landscape: Hero Icon + 4 Stats Cards */}
          <div className="landscape:col-span-6 md:col-span-6 space-y-3">
            {/* Hero Icon Block & Title */}
            <div className="flex flex-col items-center justify-center pt-1 pb-1">
              <div
                className="w-16 h-16 landscape:w-14 landscape:h-14 rounded-[22px] flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 mb-2"
                style={{ backgroundColor: currentHabit.color || '#FF5A79' }}
              >
                <IconRenderer name={currentHabit.icon} className="w-8 h-8 landscape:w-7 landscape:h-7 text-white" />
              </div>

              <h2 className={`text-lg landscape:text-base font-bold font-display tracking-tight text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentHabit.name}
              </h2>
              <p className={`text-xs mt-0.5 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentHabit.description || '30 minutes • Every Day'}
              </p>
            </div>

            {/* 4 Stat Cards in 2x2 Grid matching Image */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Current Streak Card (Tap to view Streaks Screen!) */}
              <div
                onClick={() => setActiveTab('streaks')}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform ${
                  isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[#FF8A00]">
                  <span className="text-sm">🔥</span>
                  <span className="text-xl font-black font-display text-[#FF8A00]">
                    {stats.currentStreak}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Current Streak
                </span>
              </div>

              {/* 2. Best Streak Card */}
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.longestStreak}
                </span>
                <span className={`text-[11px] font-semibold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Best Streak
                </span>
              </div>

              {/* 3. Completion Rate Card */}
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.completionRate}%
                </span>
                <span className={`text-[11px] font-semibold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Completion Rate
                </span>
              </div>

              {/* 4. Total Completions Card */}
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalCompletions}
                </span>
                <span className={`text-[11px] font-semibold mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Total Completions
                </span>
              </div>
            </div>
          </div>

          {/* Right Column in Landscape: Calendar Section */}
          <div className="landscape:col-span-6 md:col-span-6">
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#162032]/70 border-slate-800/70 text-white' : 'bg-white border-slate-200 text-neutral-900 shadow-sm'
            }`}>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold font-display">Calendar</h3>
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
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {DAY_LABELS.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>

            {/* Days Grid with Circular Node Chips */}
            <div className="grid grid-cols-7 gap-1.5">
              {daysInMonth.map((item) => {
                const isScheduled = isHabitScheduledOnDate(currentHabit, item.date);
                const isDone = completions.some(
                  (c) => c.habit_id === currentHabit.id && c.completion_date === item.key
                );
                const isCurrentToday = item.key === todayKey;
                const isPast = item.key < todayKey;
                const isMissed = !isDone && isScheduled && isPast;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleCompletion(currentHabit.id, item.key)}
                    disabled={!item.isCurrentMonth}
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold transition-all relative ${
                      !item.isCurrentMonth
                        ? 'opacity-25 text-neutral-400'
                        : isDone
                        ? isCurrentToday
                          ? 'bg-[#22D3A8] text-white shadow-md ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0B1120] font-bold'
                          : 'bg-[#22D3A8] text-white shadow-sm font-bold'
                        : isMissed
                        ? 'bg-[#FF5A79] text-white shadow-sm font-bold'
                        : isCurrentToday
                        ? isDark
                          ? 'bg-[#162032] text-white ring-2 ring-[#7C5CFF] font-bold'
                          : 'bg-white text-slate-900 ring-2 ring-[#7C5CFF] font-bold'
                        : isDark
                        ? 'bg-[#1E293B] text-slate-300 hover:text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                    title={`${item.key}: ${isDone ? 'Completed' : isMissed ? 'Missed' : 'Pending'}`}
                  >
                    {item.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className={`w-full max-w-sm p-5 rounded-2xl border ${isDark ? 'bg-[#162032] border-slate-700 text-white' : 'bg-white border-slate-200 text-neutral-900'}`}>
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Delete Habit?</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              This will delete "{currentHabit.name}" and all of its logged history. This cannot be undone.
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
                  deleteHabit(currentHabit.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
