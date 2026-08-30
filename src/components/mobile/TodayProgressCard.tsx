import React from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';
import { PlantVisualizer } from './PlantVisualizer';
import {
  Sparkles,
  Sprout,
  ChevronRight,
  Flame,
  Droplets,
} from 'lucide-react';

export const TodayProgressCard: React.FC = () => {
  const { habits, completions, selectedDate, theme, overallStats, setIsPlantGardenModalOpen } = useHabit();

  const isDark = theme === 'dark';

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');

  const scheduledToday = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateTime)
  );

  const completedToday = scheduledToday.filter((h) =>
    completions.some(
      (c) => c.habit_id === h.id && c.completion_date === selectedDate
    )
  );

  const totalCount = scheduledToday.length;
  const completedCount = completedToday.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const plant = overallStats.plantStreak;
  const isPerfectDay = progressPercent === 100 && totalCount > 0;

  // SVG Circular Gauge parameters surrounding the Plant
  const radius = 42;
  const strokeWidth = 5.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={`mx-5 landscape:mx-3 my-2.5 landscape:my-1 p-4 landscape:p-2.5 sm:p-5 rounded-[28px] landscape:rounded-2xl transition-all duration-300 shadow-xl relative overflow-hidden shrink-0 ${
        isDark
          ? 'bg-[#182032] text-white border border-slate-800/90 shadow-slate-950/40'
          : 'bg-white text-neutral-900 shadow-lg shadow-neutral-200/70 border border-neutral-100'
      }`}
    >
      {/* Background Soft Glow matching current stage color */}
      <div
        className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: plant?.stage.accentColor || '#22D3A8' }}
      />

      <div className="flex items-center justify-between gap-2 relative z-10">
        {/* Left Stats & Growth Streak */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[12px] landscape:text-[9.5px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              Today's Progress
            </span>
            {isPerfectDay && (
              <span className="flex items-center gap-1 text-[10px] landscape:text-[8px] font-extrabold px-2 landscape:px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-[#059669] dark:text-[#22D3A8] border border-emerald-500/30 animate-pulse">
                <Sparkles className="w-2.5 h-2.5" /> Perfect
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-3xl landscape:text-xl font-black tracking-tight font-display ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              {completedCount}
              <span
                className={`text-2xl landscape:text-lg font-bold ml-1 mr-0.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                /
              </span>
              {totalCount}
            </span>
            <span
              className={`text-xs landscape:text-[10px] font-extrabold px-2 landscape:px-1.5 py-0.5 rounded-lg transition-colors border ${
                progressPercent === 100
                  ? 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          <p
            className={`text-xs landscape:text-[10px] mt-0.5 font-semibold truncate ${
              isDark ? 'text-slate-400' : 'text-slate-700'
            }`}
          >
            {totalCount - completedCount === 0
              ? 'All habits completed!'
              : `${totalCount - completedCount} habit${totalCount - completedCount === 1 ? '' : 's'} left`}
          </p>

          {/* Interactive Living Garden Pill */}
          {plant && (
            <button
              onClick={() => setIsPlantGardenModalOpen(true)}
              className={`inline-flex items-center gap-1 mt-2 landscape:mt-1 text-[11px] landscape:text-[9px] font-bold px-2.5 landscape:px-2 py-0.5 rounded-full transition-all active:scale-95 group ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shadow-sm'
              }`}
              title="Open Living Plant Garden"
            >
              <Sprout className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">
                {plant.stage.name} • Lvl {plant.stage.level}
              </span>
              <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Right Circular Gauge with Living Animated Plant Mascot in the Center */}
        <div
          onClick={() => setIsPlantGardenModalOpen(true)}
          className="relative w-24 h-24 landscape:w-14 landscape:h-14 flex items-center justify-center shrink-0 cursor-pointer group"
          title="Tap to care for your plant in the Garden"
        >
          {/* Circular Progress Gauge */}
          <svg className="w-24 h-24 landscape:w-14 landscape:h-14 -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="plantRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={isDark ? '#1F293D' : '#EEF2F6'}
              strokeWidth={strokeWidth}
            />

            {/* Animated Active Progress Circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#plantRingGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>

          {/* Plant Visualizer in Center of the Progress Ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
            {plant ? (
              <PlantVisualizer
                stage={plant.stage}
                streak={plant.currentStreak}
                hydrationPercent={progressPercent}
                isWateredToday={completedCount > 0}
                size="sm"
                interactive={false}
              />
            ) : (
              <div className="w-10 h-10 landscape:w-7 landscape:h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Sprout className="w-5 h-5 landscape:w-4 landscape:h-4 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Floating Water / Sparkle Badge when growing */}
          {completedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md shadow-emerald-500/40"
            >
              <Droplets className="w-3.5 h-3.5 fill-current" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
