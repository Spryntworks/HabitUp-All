import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { PLANT_STAGES } from '../../utils/streakCalculator';
import { PlantVisualizer } from '../mobile/PlantVisualizer';
import {
  X,
  Sprout,
  Droplets,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

export const PlantGardenModal: React.FC = () => {
  const {
    isPlantGardenModalOpen,
    setIsPlantGardenModalOpen,
    overallStats,
    habits,
    completions,
    selectedDate,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const plant = overallStats.plantStreak;
  const [selectedStagePreview, setSelectedStagePreview] = useState<number | null>(null);

  if (!isPlantGardenModalOpen || !plant) return null;

  const {
    currentStreak,
    bestStreak,
    isWateredToday,
    waterDropsToday,
    totalWaterDropsNeeded,
    hydrationPercent,
    stage,
    nextStage,
    daysToNextStage,
  } = plant;

  const activePreviewStage =
    selectedStagePreview !== null
      ? PLANT_STAGES.find((s) => s.level === selectedStagePreview) || stage
      : stage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className={`w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border transition-colors ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm transition-colors ${
            isDark
              ? 'border-neutral-800 bg-neutral-900/95 text-white'
              : 'border-slate-100 bg-white/95 text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isDark
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Living Habit Garden
              </h2>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Your discipline waters and grows your plant
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPlantGardenModalOpen(false)}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Main Plant Stage Spotlight */}
          <div
            className={`p-6 rounded-3xl border relative overflow-hidden text-center flex flex-col items-center justify-center transition-colors ${
              isDark ? 'border-neutral-800' : 'border-emerald-100 shadow-inner'
            }`}
            style={{
              background: isDark
                ? `radial-gradient(circle at 50% 30%, ${activePreviewStage.accentColor}25, #171717 75%)`
                : `radial-gradient(circle at 50% 30%, #ECFDF5 0%, #FFFFFF 85%)`,
            }}
          >
            {/* Stage Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-xs border ${
                isDark
                  ? 'bg-neutral-950/80 border-neutral-700/60 text-neutral-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>{activePreviewStage.badge}</span>
              {currentStreak >= activePreviewStage.minStreak ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <Lock className={`w-3 h-3 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
              )}
            </div>

            {/* Visualizer Large */}
            <PlantVisualizer
              stage={activePreviewStage}
              streak={currentStreak}
              hydrationPercent={hydrationPercent}
              isWateredToday={isWateredToday}
              size="lg"
            />

            {/* Plant Stage Title & Description */}
            <h3 className={`text-xl font-black mt-3 font-display ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {activePreviewStage.name}
            </h3>
            <p className={`text-xs max-w-sm mt-1 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600 font-medium'}`}>
              {activePreviewStage.description}
            </p>

            {/* Current Streak Stat Pills */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-4 max-w-xs">
              <div
                className={`rounded-2xl p-2.5 flex flex-col items-center border ${
                  isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Current Streak
                </span>
                <span className={`text-lg font-extrabold mt-0.5 flex items-center gap-1 font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div
                className={`rounded-2xl p-2.5 flex flex-col items-center border ${
                  isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Best Streak
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-display">
                  <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Hydration Status Card */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-neutral-850 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'
                  }`}
                >
                  <Droplets className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wide ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
                    Today's Hydration (Water Drops)
                  </h4>
                  <p className={`text-[11px] font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {waterDropsToday} of {totalWaterDropsNeeded} habits finished today
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isWateredToday
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isDark
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-sky-100 text-sky-800 border-sky-200'
                }`}
              >
                {hydrationPercent}% Hydrated
              </span>
            </div>

            {/* Hydration Bar */}
            <div
              className={`h-3 w-full rounded-full overflow-hidden p-0.5 border ${
                isDark ? 'bg-neutral-900 border-neutral-750' : 'bg-slate-200 border-slate-300'
              }`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${hydrationPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isWateredToday
                    ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'bg-gradient-to-r from-sky-500 to-blue-500'
                }`}
              />
            </div>

            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {isWateredToday ? (
                <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Your plant has been fully watered for today! Your overall streak increases.
                </span>
              ) : (
                <span>
                  Each habit you check off sends a fresh droplet 💧 to nourish the plant. Complete 100% of today's work to keep the streak growing!
                </span>
              )}
            </p>
          </div>

          {/* Plant Growth Stages Roadmap */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h4 className={`text-xs font-extrabold uppercase tracking-wide font-display ${isDark ? 'text-neutral-300' : 'text-slate-900'}`}>
                Evolution Stages Roadmap
              </h4>
              <span className={`text-[10px] font-semibold ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                Tap to preview
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLANT_STAGES.map((s) => {
                const isUnlocked = currentStreak >= s.minStreak;
                const isCurrent = stage.level === s.level;
                const isSelected = activePreviewStage.level === s.level;

                return (
                  <button
                    key={s.level}
                    onClick={() => setSelectedStagePreview(s.level)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? isDark
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                          : 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/50 shadow-xs'
                        : isUnlocked
                        ? isDark
                          ? 'border-neutral-800 bg-neutral-850 hover:bg-neutral-800'
                          : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'
                        : isDark
                        ? 'border-neutral-800/60 bg-neutral-900/60 opacity-60 hover:opacity-80'
                        : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center border p-1 overflow-hidden"
                        style={{
                          borderColor: `${s.accentColor}40`,
                          backgroundColor: `${s.accentColor}15`,
                        }}
                      >
                        <PlantVisualizer
                          stage={s}
                          streak={s.minStreak}
                          hydrationPercent={isUnlocked ? 100 : 0}
                          isWateredToday={isUnlocked}
                          size="sm"
                          interactive={false}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {s.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500 text-black">
                              Current
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                          Requires {s.minStreak}d streak
                        </span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How It Works Explainer */}
          <div
            className={`p-3.5 rounded-2xl border text-[11px] space-y-1.5 ${
              isDark ? 'bg-neutral-950/80 border-neutral-800 text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-neutral-300' : 'text-slate-900'}`}>
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span>How the Plant Streak Works</span>
            </div>
            <ul className={`space-y-1 pl-4 list-disc text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              <li>Every habit you check off provides fresh water droplets.</li>
              <li>Completing 100% of all scheduled habits waters the plant for that day.</li>
              <li>Consecutive watered days evolve the plant from a tiny Sprout 🌱 all the way to a Golden Orchard 🍎.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex justify-end transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <button
            onClick={() => setIsPlantGardenModalOpen(false)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Back to Habits</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
