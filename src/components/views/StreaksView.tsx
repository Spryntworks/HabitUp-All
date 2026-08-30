import React from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { ChevronLeft } from 'lucide-react';

export const StreaksView: React.FC = () => {
  const {
    overallStats,
    setActiveTab,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const plant = overallStats.plantStreak;
  const currentStreak = Math.max(plant?.currentStreak ?? 0, overallStats.currentBestStreak ?? 0);
  const bestStreak = Math.max(plant?.bestStreak ?? 0, overallStats.bestAllTimeStreak ?? 0);
  const totalCompletions = overallStats.totalCompletionsCount || 0;

  // 7-day activity data for the wave curve calculated dynamically from real activity
  const weekDays = overallStats.weeklyActivity.map((w) => w.day.charAt(0));
  const maxWeeklyCount = Math.max(...overallStats.weeklyActivity.map((w) => w.completedCount), 1);
  const dataPoints = overallStats.weeklyActivity.map((w, idx) => {
    const x = 30 + idx * 48;
    // Map completedCount to y (higher completion = smaller y)
    const ratio = w.completedCount / maxWeeklyCount;
    const y = totalCompletions === 0 ? 120 : 120 - Math.round(ratio * 85);
    return { x, y, val: w.completedCount };
  });

  // SVG smooth bezier path
  const pathD = `M ${dataPoints[0].x} ${dataPoints[0].y} 
    C 55 105, 60 92, ${dataPoints[1].x} ${dataPoints[1].y} 
    C 95 92, 105 100, ${dataPoints[2].x} ${dataPoints[2].y} 
    C 145 100, 155 70, ${dataPoints[3].x} ${dataPoints[3].y} 
    C 195 70, 205 55, ${dataPoints[4].x} ${dataPoints[4].y} 
    C 245 55, 255 48, ${dataPoints[5].x} ${dataPoints[5].y} 
    C 295 48, 305 25, ${dataPoints[6].x} ${dataPoints[6].y}`;

  const areaPathD = `${pathD} L ${dataPoints[6].x} 140 L ${dataPoints[0].x} 140 Z`;

  return (
    <div className={`flex flex-col flex-1 px-5 pt-2 pb-6 justify-between select-none ${
      isDark ? 'text-white' : 'text-neutral-900'
    }`}>
      {/* Top Bar matching Screen 4 */}
      <div className="flex items-center justify-between py-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-2 rounded-xl transition-colors ${
            isDark ? 'text-neutral-300 hover:text-white hover:bg-slate-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-slate-100'
          }`}
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

            <h1 className={`text-lg font-bold font-display tracking-tight text-center flex-1 pr-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Streaks
            </h1>
          </div>

      {/* Responsive Grid for Landscape Orientation */}
      <div className="landscape:grid landscape:grid-cols-12 landscape:gap-4 md:grid md:grid-cols-12 md:gap-4 flex-1">
        {/* Left Column in Landscape: Hero Flame Artwork & Streak Counter */}
        <div className="landscape:col-span-5 md:col-span-5 flex flex-col items-center justify-center my-1 relative">
          {/* Floating Twinkle Sparkles */}
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 left-6 text-amber-300 text-sm pointer-events-none"
          >
            ✦
          </motion.span>
          <motion.span
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="absolute top-4 right-6 text-pink-300 text-xs pointer-events-none"
          >
            ★
          </motion.span>

          {/* 3D Glowing Stylized Flame Artwork */}
          <motion.div
            animate={{
              y: [-2, 2, -2],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-32 h-32 landscape:w-28 landscape:h-28 flex items-center justify-center"
          >
            <svg
              width="130"
              height="130"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
            >
              <defs>
                {/* Outer Orange Flame Gradient */}
                <linearGradient id="outerFlameGrad" x1="80" y1="10" x2="80" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF7A00" />
                  <stop offset="60%" stopColor="#FF4D00" />
                  <stop offset="100%" stopColor="#D82600" />
                </linearGradient>

                {/* Inner Golden Yellow Core Gradient */}
                <linearGradient id="innerFlameGrad" x1="80" y1="40" x2="80" y2="145" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFDE59" />
                  <stop offset="50%" stopColor="#FF9F1C" />
                  <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>

                {/* Soft Radial Glow */}
                <radialGradient id="flameAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF4D00" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Glowing Aura Background */}
              <circle cx="80" cy="85" r="65" fill="url(#flameAura)" />

              {/* Outer Flame Spikes Layer */}
              <path
                d="M80 12C88 36 104 48 116 62C128 76 134 94 130 114C125 136 104 150 80 150C56 150 35 136 30 114C26 94 32 76 44 62C56 48 72 36 80 12Z"
                fill="url(#outerFlameGrad)"
              />

              {/* Left Flame Wing */}
              <path
                d="M48 68C36 78 30 94 32 110C34 122 42 134 54 140C44 128 42 110 46 96C48 88 52 80 58 74L48 68Z"
                fill="#FF6A00"
                opacity="0.8"
              />

              {/* Right Flame Wing */}
              <path
                d="M112 68C124 78 130 94 128 110C126 122 118 134 106 140C116 128 118 110 114 96C112 88 108 80 102 74L112 68Z"
                fill="#FF3B00"
                opacity="0.8"
              />

              {/* Inner Glowing Golden Flame Core */}
              <path
                d="M80 44C85 60 96 70 102 82C108 94 108 108 102 120C96 132 84 138 80 138C76 138 64 132 58 120C52 108 52 94 58 82C64 70 75 60 80 44Z"
                fill="url(#innerFlameGrad)"
              />

              {/* Bright Center White Core */}
              <path
                d="M80 75C82 86 88 92 90 100C92 108 90 116 86 122C83 126 77 126 74 122C70 116 68 108 70 100C72 92 78 86 80 75Z"
                fill="#FFFDF0"
                opacity="0.85"
              />
            </svg>
          </motion.div>

          {/* Large Bold Streak Number matching Screen 4 */}
          <div className="text-center mt-0.5">
            <span className="text-[44px] landscape:text-[38px] leading-none font-black font-display tracking-tight text-[#FF8A00]">
              {currentStreak}
            </span>
            <p className={`text-xs font-semibold tracking-wide ${
              isDark ? 'text-neutral-300' : 'text-neutral-700'
            }`}>
              day streak
            </p>
            <p className="text-[11px] font-semibold text-[#FF8A00] mt-1 flex items-center justify-center gap-1">
              Keep it going! 🔥
            </p>
          </div>
        </div>

        {/* Right Column in Landscape: 2 Stat Cards & Activity Wave Chart */}
        <div className="landscape:col-span-7 md:col-span-7 flex flex-col justify-center space-y-2">
          {/* 2 Stat Cards side-by-side matching Screen 4 */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Best Streak Card */}
            <div className={`p-3 rounded-2xl border flex flex-col justify-center ${
              isDark ? 'bg-[#162032] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Best Streak
              </span>
              <span className={`text-lg font-bold font-display mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {bestStreak} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>days</span>
              </span>
            </div>

            {/* Total Completions Card */}
            <div className={`p-3 rounded-2xl border flex flex-col justify-center ${
              isDark ? 'bg-[#162032] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Completions
              </span>
              <span className={`text-lg font-bold font-display mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalCompletions}
              </span>
            </div>
          </div>

          {/* Activity Wave Line Chart matching Screen 4 */}
          <div className={`pt-3 pb-2 px-2 rounded-2xl border ${
            isDark ? 'bg-[#162032]/60 border-slate-800/60' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="relative w-full h-[110px] landscape:h-[100px]">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 350 150"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Line Multi-Stop Gradient (Cyan to Purple to Coral Pink) */}
                  <linearGradient id="waveLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="45%" stopColor="#8B5CF6" />
                    <stop offset="80%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#FF5A79" />
                  </linearGradient>

                  {/* Area Gradient */}
                  <linearGradient id="waveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#EC4899" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#FF5A79" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Gradient Area Fill */}
                <path d={areaPathD} fill="url(#waveAreaGrad)" />

                {/* Glowing Smooth Wave Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#waveLineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Node Dots on the Curve */}
                {dataPoints.map((pt, idx) => (
                  <g key={idx}>
                    {/* Outer Glow Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5.5"
                      fill="#FFFFFF"
                      filter="drop-shadow(0 0 4px rgba(255,255,255,0.8))"
                    />
                    {/* Inner Colored Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="3.5"
                      fill={
                        idx === 0
                          ? '#00F0FF'
                          : idx < 3
                          ? '#8B5CF6'
                          : idx < 5
                          ? '#EC4899'
                          : '#FF5A79'
                      }
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Day of Week Labels Row (M T W T F S S) */}
            <div className={`flex justify-between px-3 pt-1 text-[11px] font-semibold ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              {weekDays.map((d, i) => (
                <span key={i} className="w-6 text-center">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
