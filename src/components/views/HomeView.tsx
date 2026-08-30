import React, { useState } from 'react';
import { useHabit } from '../../context/HabitContext';
import { HomeHero } from '../mobile/HomeHero';
import { TodayProgressCard } from '../mobile/TodayProgressCard';
import { HabitCard } from '../mobile/HabitCard';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';
import {
  Plus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    habits,
    completions,
    selectedDate,
    theme,
    setIsCreateModalOpen,
    setIsOnboardingModalOpen,
    setIsPlantGardenModalOpen,
  } = useHabit();

  const isDark = theme === 'dark';
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  // Habits scheduled on selected date
  const scheduledHabits = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateTime)
  );

  // Filter based on completion status
  const filteredHabits = scheduledHabits.filter((h) => {
    const isDone = completions.some(
      (c) => c.habit_id === h.id && c.completion_date === selectedDate
    );
    if (filterMode === 'pending') return !isDone;
    if (filterMode === 'completed') return isDone;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 pb-4 min-h-0">
      <div className="landscape:grid landscape:grid-cols-12 landscape:gap-2 md:grid md:grid-cols-12 md:gap-4 flex-1 min-h-0">
        {/* Left Column in Landscape: Hero + Today's Progress Card */}
        <div className="landscape:col-span-5 md:col-span-5 flex flex-col justify-start shrink-0">
          {/* Unified Hero Header & 3D Mountain / Sun Mascot (matching Image 2) */}
          <HomeHero onMascotClick={() => setIsPlantGardenModalOpen(true)} />

          {/* Today Progress Card with Radial Circle Progress Ring */}
          <TodayProgressCard />
        </div>

        {/* Right Column in Landscape: Today's Habits List */}
        <div className="landscape:col-span-7 md:col-span-7 flex flex-col pt-1 landscape:pt-0 min-h-0">
          {/* Section Header: Today's Habits */}
          <div className="px-5 landscape:px-2 pt-2 landscape:pt-1 pb-1 flex items-center justify-between shrink-0">
            <h2 className={`text-base landscape:text-sm font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Today's Habits
            </h2>

            {/* Filter / Counter Badge */}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs landscape:text-[11px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>
                {filteredHabits.length} habits
              </span>
            </div>
          </div>

          {/* Habit Cards List */}
          <div className="flex-1 space-y-0.5 overflow-y-auto min-h-0 landscape:max-h-[calc(100vh-125px)] pr-0.5 pb-16 landscape:pb-4">
            {filteredHabits.length > 0 ? (
              filteredHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))
            ) : (
              <div className={`mx-5 landscape:mx-2 my-3 landscape:my-1 p-5 landscape:p-3 rounded-3xl landscape:rounded-xl text-center flex flex-col items-center justify-center border ${
                isDark ? 'bg-[#1F2937]/70 border-neutral-750 text-white' : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
              }`}>
                <div className="w-10 h-10 landscape:w-8 landscape:h-8 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 landscape:w-4 landscape:h-4" />
                </div>
                <h3 className="text-sm landscape:text-xs font-bold font-display">
                  {filterMode === 'completed'
                    ? 'No habits completed yet'
                    : 'All scheduled habits completed!'}
                </h3>
                <p className={`text-xs landscape:text-[11px] mt-0.5 max-w-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Great job maintaining consistency today!
                </p>

                <div className="flex items-center gap-2 mt-3 landscape:mt-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3.5 py-1.5 landscape:px-2.5 landscape:py-1 rounded-xl bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Habit
                  </button>
                  <button
                    onClick={() => setIsOnboardingModalOpen(true)}
                    className={`px-3.5 py-1.5 landscape:px-2.5 landscape:py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                      isDark
                        ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border-neutral-700'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
                    Templates
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

