import React from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { PlantVisualizer } from './PlantVisualizer';
import { Droplets, Sparkles, Trophy, ChevronRight, Sprout, Flame } from 'lucide-react';

interface PlantStreakCardProps {
  compact?: boolean;
}

export const PlantStreakCard: React.FC<PlantStreakCardProps> = ({ compact = false }) => {
  const { overallStats, setIsPlantGardenModalOpen, selectedDate, theme } = useHabit();
  const plant = overallStats.plantStreak;
  const isDark = theme === 'dark';

  if (!plant) return null;

  const {
    currentStreak,
    isWateredToday,
    waterDropsToday,
    totalWaterDropsNeeded,
    hydrationPercent,
    stage,
    nextStage,
    daysToNextStage,
  } = plant;

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={() => setIsPlantGardenModalOpen(true)}
      className={`mx-5 my-3 p-4 md:p-5 rounded-3xl border shadow-lg relative overflow-hidden cursor-pointer group transition-all ${
        isDark
          ? 'bg-[#162032] border-slate-850 text-white hover:border-emerald-500/40'
          : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-400/60 shadow-sm'
      }`}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: stage.accentColor }}
      />
      <div className={`absolute bottom-0 left-6 w-32 h-32 rounded-full blur-2xl pointer-events-none ${isDark ? 'bg-sky-500/10' : 'bg-emerald-500/10'}`} />

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <Sprout className="w-3.5 h-3.5" />
            Living Plant Streak
          </span>
          {isWateredToday ? (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                : 'text-amber-800 bg-amber-50 border-amber-200'
            }`}>
              <Sparkles className="w-3 h-3" /> Fully Watered!
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'text-sky-300 bg-sky-500/10 border-sky-500/20'
                : 'text-sky-800 bg-sky-50 border-sky-200'
            }`}>
              <Droplets className="w-3 h-3 fill-current" /> Needs Water
            </span>
          )}
        </div>

        <div className={`flex items-center gap-1 text-xs transition-colors font-semibold ${
          isDark ? 'text-neutral-400 group-hover:text-emerald-300' : 'text-slate-600 group-hover:text-emerald-700'
        }`}>
          <span>Garden</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 flex items-center justify-between mt-3.5">
        <div className="flex-1 pr-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {currentStreak}
            </span>
            <span className={`text-sm font-bold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              Day Overall Streak
            </span>
          </div>

          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>{stage.name}</span>
            <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>•</span>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Level {stage.level} of 6</span>
          </p>

          <p className={`text-[11px] mt-1 line-clamp-1 font-medium ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            {isWateredToday
              ? '✨ Plant watered! Keep up the momentum tomorrow!'
              : totalWaterDropsNeeded === 0
              ? 'No habits scheduled for today — streak is safe!'
              : `Complete all habits today to water your plant (${waterDropsToday}/${totalWaterDropsNeeded} done)`}
          </p>
        </div>

        {/* Visualizer */}
        <div className="shrink-0">
          <PlantVisualizer
            stage={stage}
            streak={currentStreak}
            hydrationPercent={hydrationPercent}
            isWateredToday={isWateredToday}
            size="md"
          />
        </div>
      </div>

      {/* Hydration Bar (Water droplets meter) */}
      <div className={`relative z-10 mt-3 pt-3 border-t ${isDark ? 'border-neutral-800/80' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
          <div className={`flex items-center gap-1 ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
            <Droplets className="w-3.5 h-3.5 fill-current" />
            <span>Daily Hydration</span>
          </div>
          <div className={`font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            {waterDropsToday}/{totalWaterDropsNeeded} Water Drops ({hydrationPercent}%)
          </div>
        </div>

        {/* Animated fluid progress bar */}
        <div className={`h-2 w-full rounded-full overflow-hidden p-0.5 border ${
          isDark ? 'bg-neutral-800 border-neutral-700/50' : 'bg-slate-100 border-slate-200'
        }`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hydrationPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              isWateredToday
                ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                : 'bg-gradient-to-r from-sky-500 to-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
            }`}
          />
        </div>

        {nextStage && (
          <div className={`flex items-center justify-between mt-2 text-[10px] font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            <span>Next Evolution: <strong className={isDark ? 'text-neutral-200' : 'text-slate-900'}>{nextStage.name} ({nextStage.emoji})</strong></span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{daysToNextStage} perfect {daysToNextStage === 1 ? 'day' : 'days'} left</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
