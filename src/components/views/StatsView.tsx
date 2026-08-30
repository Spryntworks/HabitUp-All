import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { ChevronLeft, Plus } from 'lucide-react';

export const StatsView: React.FC = () => {
  const {
    habits,
    completions,
    getHabitStats,
    overallStats,
    setSelectedHabitForDetail,
    setActiveTab,
    setIsCreateModalOpen,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  // Map real habits to their calculated stats
  const habitItems = activeHabits.map((h) => {
    const stats = getHabitStats(h.id);
    return {
      habit: h,
      name: h.name,
      icon: h.icon,
      color: h.color || '#FF5A79',
      rate: stats.completionRate || 0,
    };
  });

  const totalCompletions = completions.length;
  const completionPercentage = activeHabits.length > 0 ? overallStats.completionRate : 0;

  // Donut Gauge math
  const radius = 48;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  const completedCount = totalCompletions;
  const missedCount = 0;

  return (
    <div className={`flex flex-col flex-1 px-5 pt-2 pb-6 space-y-4 select-none ${
      isDark ? 'text-white' : 'text-neutral-900'
    }`}>
      {/* Top Header matching Screen 2 */}
      <div className="flex items-center justify-between py-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-2 rounded-xl transition-colors ${
            isDark ? 'text-neutral-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className={`text-lg font-bold font-display tracking-tight text-center flex-1 pr-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Statistics
        </h1>
      </div>

      {/* Time Range Segmented Control: [ Week | Month | Year ] */}
      <div className={`p-1 rounded-2xl flex items-center justify-between border ${
        isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setTimeRange('week')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'week'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'month'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'year'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Year
        </button>
      </div>

      {/* Responsive 2-Column Grid in Landscape Mode */}
      <div className="landscape:grid landscape:grid-cols-12 landscape:gap-4 md:grid md:grid-cols-12 md:gap-4 flex-1">
        {/* Left Column in Landscape: Overview Section */}
        <div className="landscape:col-span-5 md:col-span-5 space-y-2">
          <h2 className={`text-sm font-bold font-display tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
            Overview
          </h2>

          <div className={`p-4 rounded-3xl border flex items-center justify-between ${
            isDark ? 'bg-[#162032] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Left Donut Gauge with Gradient */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="donutGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF5A79" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#00F0FF" />
                  </linearGradient>
                </defs>
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={isDark ? '#232D42' : '#EEF2F6'}
                  strokeWidth={strokeWidth}
                />
                {/* Animated Progress Ring */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="url(#donutGaugeGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Centered Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-[20px] font-black font-display tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {completionPercentage}%
                </span>
                <span className={`text-[8px] font-semibold mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Completion Rate
                </span>
              </div>
            </div>

            {/* Right Statistics: Completed & Missed */}
            <div className="flex flex-col gap-3 pl-3 flex-1">
              {/* Completed */}
              <div>
                <span className={`text-xl font-black font-display tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {completedCount}
                </span>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Completed
                </span>
              </div>

              {/* Missed */}
              <div>
                <span className={`text-xl font-black font-display tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {missedCount}
                </span>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Missed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column in Landscape: Habit Performance Section */}
        <div className="landscape:col-span-7 md:col-span-7 space-y-2 mt-3 landscape:mt-0">
          <h2 className={`text-sm font-bold font-display tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
            Habit Performance
          </h2>

          <div className="space-y-2 max-h-[60vh] landscape:max-h-[50vh] overflow-y-auto pr-1">
            {habitItems.length > 0 ? (
              habitItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => item.habit && setSelectedHabitForDetail(item.habit)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isDark ? 'bg-[#162032] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Habit Info & Percentage Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <IconRenderer name={item.icon} className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.name}
                      </span>
                    </div>

                    <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      {item.rate}%
                    </span>
                  </div>

                  {/* Sleek Horizontal Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-[#232D42]' : 'bg-slate-100'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-4 rounded-2xl border text-center ${
                isDark ? 'bg-[#162032]/60 border-slate-800/60 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}>
                <p className="text-xs font-medium">No habits tracked yet.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 text-xs font-bold text-[#7C5CFF] hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add your first habit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
