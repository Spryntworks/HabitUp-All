import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Habit } from '../../types';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { Check, Flame, MoreVertical, Calendar, Pause, Archive, Trash2 } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const {
    selectedDate,
    completions,
    toggleCompletion,
    setSelectedHabitForDetail,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    theme,
  } = useHabit();

  const [showMenu, setShowMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDark = theme === 'dark';

  const stats = getHabitStats(habit.id);
  const isCompleted = completions.some(
    (c) => c.habit_id === habit.id && c.completion_date === selectedDate
  );

  const isPaused = Boolean(habit.paused_at);
  const isArchived = Boolean(habit.archived_at);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If there's less than 190px below the button, flip upwards
      setOpenUpwards(spaceBelow < 190);
    }
    setShowMenu(!showMenu);
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompletion(habit.id, selectedDate);
  };

  const getSubtitle = () => {
    const parts: string[] = [];
    if (habit.description) {
      parts.push(habit.description);
    } else {
      if (habit.frequency_type === 'daily') parts.push('Daily');
      else if (habit.frequency_type === 'custom_days') {
        const days = habit.scheduled_days || [];
        if (days.length === 5 && days.includes(0) && days.includes(4)) parts.push('Weekdays');
        else parts.push(`${days.length} days/wk`);
      }
    }
    if (habit.reminder_enabled && habit.reminder_time) {
      parts.push(habit.reminder_time);
    }
    return parts.join(' • ');
  };

  return (
    <div
      onClick={() => setSelectedHabitForDetail(habit)}
      className={`group relative mx-5 landscape:mx-2 my-2 landscape:my-1 p-3 landscape:p-2 sm:p-3.5 rounded-2xl landscape:rounded-xl transition-all duration-200 cursor-pointer border ${
        showMenu ? 'z-40' : 'z-10'
      } ${
        isDark
          ? 'bg-[#162032] border-slate-800/80 hover:border-slate-700/80 shadow-sm'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Habit Icon & Details */}
        <div className="flex items-center gap-3 landscape:gap-2.5 min-w-0 flex-1">
          {/* Circular Glowing Icon matching Image */}
          <div
            className="w-11 h-11 landscape:w-8 landscape:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 relative"
            style={{
              backgroundColor: habit.color || '#FF5A79',
              boxShadow: isDark
                ? `0 0 16px ${habit.color}40, 0 2px 6px rgba(0,0,0,0.3)`
                : `0 4px 10px ${habit.color}35`,
            }}
          >
            <IconRenderer name={habit.icon} className="w-5 h-5 landscape:w-4 landscape:h-4 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3
                className={`text-[15px] landscape:text-xs font-bold tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {habit.name}
              </h3>

              {isPaused && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Paused
                </span>
              )}

              {isArchived && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300">
                  Archived
                </span>
              )}
            </div>

            {/* Subtitle / Schedule details with Flame Streak */}
            <div className={`flex items-center flex-wrap gap-x-1 mt-0.5 text-xs landscape:text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="truncate max-w-[140px] landscape:max-w-[120px]">{getSubtitle()}</span>
              
              {/* Streak badge */}
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-500 ml-1">
                <Flame className="w-3.5 h-3.5 landscape:w-3 landscape:h-3 fill-current text-amber-500" />
                <span>{stats.currentStreak}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Circular Checkbox */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick options menu trigger */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={handleToggleMenu}
              className={`p-1.5 rounded-lg transition-colors opacity-60 group-hover:opacity-100 ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 ${
                    openUpwards ? 'bottom-9 mb-0.5' : 'top-8'
                  } z-50 w-44 rounded-xl border p-1.5 shadow-2xl space-y-0.5 text-xs animate-scale-in origin-top-right ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-800 shadow-2xl'
                  }`}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setSelectedHabitForDetail(habit);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left font-medium ${
                      isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    View Details & Calendar
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (isPaused) resumeHabit(habit.id);
                      else pauseHabit(habit.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left font-medium ${
                      isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    {isPaused ? 'Resume Habit' : 'Pause Habit'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      archiveHabit(habit.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left font-medium ${
                      isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5 text-purple-400" />
                    Archive Habit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      deleteHabit(habit.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Single-Tap Circular Checkbox matching image */}
          <button
            onClick={handleCheckClick}
            aria-label={`Toggle completion for ${habit.name}`}
            className={`w-7 h-7 landscape:w-6 landscape:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              isCompleted
                ? 'bg-[#22D3A8] text-white shadow-sm'
                : isDark
                ? 'bg-transparent border-2 border-neutral-500 hover:border-neutral-300'
                : 'bg-transparent border-2 border-neutral-300 hover:border-neutral-400'
            }`}
          >
            {isCompleted && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-4 h-4 landscape:w-3.5 landscape:h-3.5 stroke-[3]" />
              </motion.div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

