import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  getMonthCalendarDays,
  formatDateKey,
  isHabitScheduledOnDate,
} from '../../utils/streakCalculator';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Calendar as CalendarIcon,
  Sparkles,
  Flame,
} from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const CalendarView: React.FC = () => {
  const {
    habits,
    completions,
    toggleCompletion,
    setActiveTab,
    setIsCreateModalOpen,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const todayKey = formatDateKey(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(todayKey);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthDays = getMonthCalendarDays(year, month);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonthDate);

  const changeMonth = (offset: number) => {
    setCurrentMonthDate(new Date(year, month + offset, 1));
  };

  const activeHabits = habits.filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at);

  // Selected day parsing
  const selectedDateObj = new Date(selectedCalendarDay + 'T12:00:00');
  const isSelectedToday = selectedCalendarDay === todayKey;
  const selectedDayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(selectedDateObj);

  // Habits for selected date
  const scheduledForSelectedDay = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateObj)
  );
  // Show either scheduled habits or all active habits if none scheduled
  const displayHabitsForDay =
    scheduledForSelectedDay.length > 0 ? scheduledForSelectedDay : activeHabits;

  const completedForSelectedDay = displayHabitsForDay.filter((h) =>
    completions.some((c) => c.habit_id === h.id && c.completion_date === selectedCalendarDay)
  );

  const selectedDayProgress =
    displayHabitsForDay.length > 0
      ? Math.round((completedForSelectedDay.length / displayHabitsForDay.length) * 100)
      : 0;

  return (
    <div
      className={`flex flex-col flex-1 px-5 pt-2 pb-6 justify-between select-none ${
        isDark ? 'text-white' : 'text-neutral-900'
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between py-1 mb-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-slate-800'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-slate-100'
            }`}
            title="Back to Home"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h1 className="text-lg font-bold font-display tracking-tight text-center flex-1 pr-8">
            Calendar
          </h1>
        </div>

        {/* Responsive Grid for Calendar & Selected Day Details in Landscape */}
        <div className="landscape:grid landscape:grid-cols-12 landscape:gap-4 md:grid md:grid-cols-12 md:gap-4">
          {/* Left Column in Landscape: Month Selector, Grid and Legend */}
          <div className="landscape:col-span-6 md:col-span-6">
            {/* Month Selector: <  Month Year  > */}
            <div className="flex items-center justify-between px-4 py-2">
              <button
                onClick={() => changeMonth(-1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#162032] text-neutral-300 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-neutral-600 hover:text-neutral-900'
                }`}
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#7C5CFF]" />
                <span className="text-sm font-bold font-display tracking-tight">
                  {monthLabel}
                </span>
              </div>

              <button
                onClick={() => changeMonth(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#162032] text-neutral-300 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-neutral-600 hover:text-neutral-900'
                }`}
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header Row (M T W T F S S) */}
            <div
              className={`grid grid-cols-7 gap-1 text-center text-xs font-semibold my-0.5 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="py-0.5">
                  {d}
                </span>
              ))}
            </div>

            {/* Monthly Grid of Circular Days */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center py-1">
              {monthDays.map((item) => {
                const isToday = item.key === todayKey;
                const isPast = item.key < todayKey;
                const isSelected = item.key === selectedCalendarDay;

                // Calculate dynamic completion status and progress percentage for this day
                const scheduledForDay = activeHabits.filter((h) =>
                  isHabitScheduledOnDate(h, item.date)
                );
                const totalScheduled = scheduledForDay.length > 0 ? scheduledForDay.length : activeHabits.length;
                const completedForDay = activeHabits.filter((h) =>
                  completions.some(
                    (c) => c.habit_id === h.id && c.completion_date === item.key
                  )
                );
                const totalCompleted = completedForDay.length;
                const dayProgress = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

                // Exact Dual-Tone Green & Red Shade from user reference image
                let circleBackground = '';
                let textClass = 'text-white font-bold';
                let shadowClass = '';

                if (dayProgress === 100 && totalCompleted > 0) {
                  // 100% Complete: Fully Green Shade
                  circleBackground = 'radial-gradient(circle at 35% 35%, #4ADE80 0%, #22C55E 55%, #15803D 100%)';
                  textClass = 'text-white font-black';
                  shadowClass = 'shadow-md shadow-emerald-500/25';
                } else if (dayProgress > 0 && dayProgress < 100) {
                  // Partial Completion: Direct Red & Green Shade (Green portion + Red shade based on progress %)
                  const greenPercent = dayProgress;
                  circleBackground = `linear-gradient(135deg, #22C55E 0%, #16A34A ${greenPercent}%, #E11D48 ${greenPercent + 15}%, #F43F5E 100%)`;
                  textClass = 'text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]';
                  shadowClass = 'shadow-sm';
                } else if (isPast && totalScheduled > 0) {
                  // 0% Missed: Fully Red / Coral Shade
                  circleBackground = 'radial-gradient(circle at 35% 35%, #FB7185 0%, #F43F5E 60%, #BE123C 100%)';
                  textClass = 'text-white font-black';
                  shadowClass = 'shadow-md shadow-rose-500/25';
                } else if (isToday) {
                  // Today pending: Subtle dark slate with purple tint
                  circleBackground = isDark
                    ? 'radial-gradient(circle at 35% 35%, #334155 0%, #1E293B 100%)'
                    : 'radial-gradient(circle at 35% 35%, #F1F5F9 0%, #E2E8F0 100%)';
                  textClass = isDark ? 'text-white font-bold' : 'text-neutral-900 font-bold';
                } else {
                  // Future pending: Dark charcoal slate circle
                  circleBackground = isDark ? '#1E293B' : '#CBD5E1';
                  textClass = isDark ? 'text-neutral-300 font-semibold' : 'text-neutral-700 font-semibold';
                }

                return (
                  <div key={item.key} className="relative flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarDay(item.key)}
                      disabled={!item.isCurrentMonth}
                      style={item.isCurrentMonth ? { background: circleBackground } : undefined}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all relative ${
                        !item.isCurrentMonth
                          ? 'opacity-0 pointer-events-none'
                          : `${textClass} ${shadowClass}`
                      } ${
                        isSelected
                          ? 'ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0B1120] scale-105 z-10'
                          : isToday && dayProgress === 0
                          ? 'ring-2 ring-[#7C5CFF]'
                          : ''
                      }`}
                      title={`${item.key}: ${totalCompleted}/${totalScheduled} completed (${dayProgress}%)`}
                    >
                      <span className="relative z-10">{item.dayNumber}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Legend Row matching reference */}
            <div
              className={`flex items-center justify-between px-2 text-[10px] font-medium pt-2 pb-2 border-b ${
                isDark ? 'text-neutral-300 border-slate-800' : 'text-neutral-600 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm" />
                <span>Completed</span>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{
                    background: 'conic-gradient(#10B981 0deg 220deg, #F43F5E 220deg 360deg)',
                  }}
                />
                <span>Partial</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-sm" />
                <span>Missed</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] border border-slate-600" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Right Column in Landscape: Selected Day Interactive Habits Checklist */}
          <div className="landscape:col-span-6 md:col-span-6 mt-2 landscape:mt-0">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold font-display">
                    {selectedDayLabel}
                  </h2>
                  {isSelectedToday && (
                    <span className="px-2 py-0.5 rounded-full bg-[#7C5CFF]/20 text-[#7C5CFF] text-[10px] font-bold">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  {completedForSelectedDay.length} of {displayHabitsForDay.length} habits completed ({selectedDayProgress}%)
                </p>
              </div>

              {selectedDayProgress === 100 && displayHabitsForDay.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#22D3A8] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" /> Perfect Day
                </span>
              )}
            </div>

            {/* Progress Bar with Dynamic Red-to-Green Gradient */}
            <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden mb-2.5 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  selectedDayProgress === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-[#10B981]'
                    : selectedDayProgress >= 65
                    ? 'bg-gradient-to-r from-yellow-400 to-emerald-400'
                    : selectedDayProgress >= 35
                    ? 'bg-gradient-to-r from-orange-400 to-yellow-400'
                    : selectedDayProgress > 0
                    ? 'bg-gradient-to-r from-red-500 to-orange-400'
                    : 'bg-red-500/40'
                }`}
                style={{ width: `${Math.max(selectedDayProgress, 4)}%` }}
              />
            </div>

            {/* Habits List for Selected Day */}
            <div className="space-y-1.5 max-h-[170px] landscape:max-h-[190px] overflow-y-auto pr-1">
              {displayHabitsForDay.map((habit) => {
                const isDone = completions.some(
                  (c) => c.habit_id === habit.id && c.completion_date === selectedCalendarDay
                );

                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleCompletion(habit.id, selectedCalendarDay)}
                    className={`w-full p-2 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isDone
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-white'
                          : 'bg-emerald-50 border-emerald-200 text-neutral-900'
                        : isDark
                        ? 'bg-[#162032] border-slate-800 hover:border-slate-700 text-neutral-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: habit.color }}
                      >
                        <IconRenderer name={habit.icon} className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0 text-left">
                        <h3
                          className={`text-xs font-bold truncate ${
                            isDone ? 'line-through opacity-70' : ''
                          }`}
                        >
                          {habit.name}
                        </h3>
                        <p className="text-[9px] text-neutral-400 truncate">
                          {habit.frequency_type === 'daily' ? 'Daily' : 'Scheduled'}
                          {habit.target_time ? ` • ${habit.target_time}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompletion(habit.id, selectedCalendarDay);
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-[#22D3A8] text-neutral-950 shadow-md shadow-emerald-500/30'
                          : isDark
                          ? 'border border-slate-600 hover:border-slate-400'
                          : 'border border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </div>
                );
              })}

              {displayHabitsForDay.length === 0 && (
                <div className="text-center py-4 text-xs text-neutral-400">
                  No habits configured. Create your first habit!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="pt-3 flex gap-2">
        <button
          onClick={() => {
            setSelectedCalendarDay(todayKey);
            setShowAddMenu(true);
          }}
          className="flex-1 py-3 rounded-2xl bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Log</span>
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            isDark
              ? 'bg-[#162032] border-slate-700 hover:bg-slate-800 text-neutral-200'
              : 'bg-white border-slate-200 hover:bg-slate-100 text-neutral-700'
          }`}
          title="New Habit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Quick Habit Completion Sheet Modal */}
      <AnimatePresence>
        {showAddMenu && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl ${
                isDark
                  ? 'bg-[#162032] border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold font-display">
                  Quick Log
                </h3>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-400 mb-3">
                Tap habits to toggle completion for {selectedCalendarDay}:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {activeHabits.map((h) => {
                  const isDone = completions.some(
                    (c) => c.habit_id === h.id && c.completion_date === selectedCalendarDay
                  );

                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleCompletion(h.id, selectedCalendarDay)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isDone
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                          : isDark
                          ? 'bg-[#1E293B] border-slate-700 text-neutral-300'
                          : 'bg-slate-100 border-slate-200 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: h.color }}
                        >
                          <IconRenderer name={h.icon} className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-bold">{h.name}</span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isDone
                            ? 'bg-[#22D3A8] text-neutral-950 font-bold'
                            : 'border border-neutral-500'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setShowAddMenu(false);
                  showToast('Completions recorded!', undefined, 'success');
                }}
                className="w-full py-3 rounded-xl bg-[#7C5CFF] text-white font-bold text-xs shadow-md"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
