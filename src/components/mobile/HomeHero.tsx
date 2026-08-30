import React from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { Bell, Sun, Moon, WifiOff, Settings } from 'lucide-react';

interface HomeHeroProps {
  onMascotClick?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onMascotClick }) => {
  const {
    user,
    habits,
    theme,
    toggleTheme,
    isOffline,
    setIsOffline,
    setActiveTab,
    setIsNotificationModalOpen,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleNotificationClick = () => {
    setIsNotificationModalOpen(true);
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none transition-colors ${
        isDark
          ? 'bg-[#0B1120] text-white'
          : 'bg-[#F8FAFC] text-neutral-900'
      }`}
    >
      {/* Top Action Icons Row */}
      <div className="px-5 pt-3 pb-0.5 landscape:pt-1.5 landscape:pb-0 flex items-center justify-between relative z-20">
        {/* Greeting Line */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[13px] landscape:text-[11px] font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
            {getGreetingTime()}, {user.name.split(' ')[0]}! 👋
          </span>
        </div>

        {/* Quick Tools: Offline Toggle, Theme Switch, Notification Bell */}
        <div className="flex items-center gap-1">
          {/* Offline indicator if active */}
          {isOffline && (
            <button
              onClick={() => {
                setIsOffline(false);
                showToast('Back Online! Synchronized with storage', undefined, 'success');
              }}
              className="p-1.5 landscape:p-1 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold"
              title="Offline Mode Active (Click to go online)"
            >
              <WifiOff className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 landscape:p-1 rounded-xl transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notification Bell matching Image */}
          <button
            onClick={handleNotificationClick}
            className={`relative p-2 landscape:p-1 rounded-xl transition-colors ${
              isDark
                ? 'text-neutral-300 hover:text-white'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {isDark && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0B1120]" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 landscape:p-1 rounded-xl transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
            title="App Settings"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Hero Body: Left Catchphrase & Right 3D Mountain (Dark) / 3D Sun (Light) */}
      <div className="relative px-5 pt-1 pb-2 landscape:pb-0 flex items-start justify-between min-h-[155px] landscape:min-h-[75px]">
        {/* Left Headline matching Image */}
        <div className="relative z-20 pt-1.5 landscape:pt-0.5">
          <h1 className={`text-[28px] landscape:text-[18px] leading-[1.12] landscape:leading-tight font-black tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Let's <span className={isDark ? 'text-[#22D3A8]' : 'text-[#6D28D9]'}>crush</span>
            <br />
            today!
          </h1>
        </div>

        {/* Right 3D Mountain / Sun Artwork matching Image */}
        <div
          onClick={onMascotClick}
          className="absolute right-0 top-0 bottom-0 w-[240px] landscape:w-[130px] flex items-end justify-center cursor-pointer pointer-events-auto overflow-hidden"
          title="Click to view Living Plant Garden"
        >
          {isDark ? (
            /* DARK MODE: 3D Mountain with snowy peak, waving coral flag, clouds & twinkling stars */
            <div className="relative w-full h-full">
              {/* Twinkling Stars */}
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-5 landscape:top-1 landscape:left-2 text-pink-300 text-xs landscape:text-[9px] pointer-events-none"
              >
                ✦
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 0.7, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="absolute top-11 left-12 landscape:top-4 landscape:left-4 text-cyan-300 text-[10px] landscape:text-[8px] pointer-events-none"
              >
                ★
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                className="absolute top-5 right-6 landscape:top-1 landscape:right-2 text-amber-200 text-xs landscape:text-[9px] pointer-events-none"
              >
                ✦
              </motion.span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute top-14 right-2 landscape:hidden text-pink-300 text-[9px] pointer-events-none"
              >
                ✦
              </motion.span>

              {/* 3D Mountain SVG */}
              <motion.div
                initial={{ scale: 0.92, y: 4 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-full h-full flex items-end justify-center"
              >
                <svg
                  viewBox="0 0 230 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="overflow-visible w-[230px] h-[160px] landscape:w-[120px] landscape:h-[75px] transition-all"
                >
                  <defs>
                    <linearGradient id="deepHillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E3A5F" />
                      <stop offset="100%" stopColor="#0B1B33" />
                    </linearGradient>

                    <radialGradient id="mountain3D" cx="42%" cy="40%" r="58%" fx="35%" fy="32%">
                      <stop offset="0%" stopColor="#4ADE80" />
                      <stop offset="30%" stopColor="#22C55E" />
                      <stop offset="70%" stopColor="#16A34A" />
                      <stop offset="100%" stopColor="#0D6E35" />
                    </radialGradient>

                    <linearGradient id="frontHillLeft" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="frontHillRight" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22C55E" />
                      <stop offset="100%" stopColor="#0F766E" />
                    </linearGradient>

                    <linearGradient id="snowCapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="70%" stopColor="#F1F5F9" />
                      <stop offset="100%" stopColor="#CBD5E1" />
                    </linearGradient>

                    <linearGradient id="coralFlagGrad" x1="0" y1="0" x2="1" y2="0.8">
                      <stop offset="0%" stopColor="#FF6584" />
                      <stop offset="50%" stopColor="#FF4D6D" />
                      <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>

                    <radialGradient id="cloud3D" cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="65%" stopColor="#F8FAFC" />
                      <stop offset="100%" stopColor="#E2E8F0" />
                    </radialGradient>

                    <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* 1. Deep Midnight Background Foothills */}
                  <path
                    d="M10 160C10 120 40 105 70 115C95 100 135 100 160 120C180 108 215 118 225 160H10Z"
                    fill="url(#deepHillGrad)"
                    opacity="0.8"
                  />

                  {/* 2. Left Floating Cloud (behind peak) */}
                  <g filter="url(#cloudShadow)" opacity="0.95">
                    <ellipse cx="48" cy="85" rx="20" ry="12" fill="url(#cloud3D)" />
                    <circle cx="40" cy="80" r="10" fill="url(#cloud3D)" />
                    <circle cx="54" cy="78" r="13" fill="url(#cloud3D)" />
                  </g>

                  {/* 3. Main 3D Mountain Cone */}
                  <path
                    d="M62 160C62 145 72 120 90 85L122 28C126 21 134 21 138 28L170 85C188 120 198 145 198 160H62Z"
                    fill="url(#mountain3D)"
                  />

                  {/* 4. Snowy Mountain Peak with Scalloped Edge */}
                  <path
                    d="M122 28C126 21 134 21 138 28L152 56C148 59 144 57 140 59C136 61 132 58 128 60C124 58 120 61 116 59C112 57 108 59 106 56L122 28Z"
                    fill="url(#snowCapGrad)"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                  />

                  {/* 5. Flagpole atop the apex */}
                  <line
                    x1="130"
                    y1="24"
                    x2="130"
                    y2="2"
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="130" cy="2" r="2" fill="#FBBF24" />

                  {/* Coral-Red Triangular Waving Flag */}
                  <motion.path
                    animate={{
                      d: [
                        'M130 3L156 10C152 14 145 16 130 18Z',
                        'M130 3L158 12C150 16 142 17 130 19Z',
                        'M130 3L156 10C152 14 145 16 130 18Z',
                      ],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    fill="url(#coralFlagGrad)"
                    filter="drop-shadow(0 2px 3px rgba(225,29,72,0.4))"
                  />

                  {/* 6. Mountain Cute Eyes */}
                  <circle cx="120" cy="80" r="3.6" fill="#0A2F1D" />
                  <circle cx="121.2" cy="78.5" r="1.3" fill="#FFFFFF" />

                  <circle cx="138" cy="80" r="3.6" fill="#0A2F1D" />
                  <circle cx="139.2" cy="78.5" r="1.3" fill="#FFFFFF" />

                  {/* Rosy Blush Cheeks */}
                  <ellipse cx="113" cy="86" rx="3.5" ry="2.2" fill="#FB7185" opacity="0.8" />
                  <ellipse cx="145" cy="86" rx="3.5" ry="2.2" fill="#FB7185" opacity="0.8" />

                  {/* Cute Smile */}
                  <path
                    d="M125 86C127 89.5 131 89.5 133 86"
                    stroke="#0A2F1D"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* 7. Layered 3D Front Foothills */}
                  <path
                    d="M48 160C48 135 70 122 92 135C108 145 115 160 115 160H48Z"
                    fill="url(#frontHillLeft)"
                  />
                  <path
                    d="M140 160C140 138 162 125 185 136C202 145 212 160 212 160H140Z"
                    fill="url(#frontHillRight)"
                  />
                  <ellipse cx="130" cy="158" rx="42" ry="18" fill="#15803D" />

                  {/* 8. Right Fluffy Cloud */}
                  <g filter="url(#cloudShadow)" opacity="0.95">
                    <ellipse cx="188" cy="72" rx="18" ry="11" fill="url(#cloud3D)" />
                    <circle cx="180" cy="68" r="9" fill="url(#cloud3D)" />
                    <circle cx="194" cy="67" r="11" fill="url(#cloud3D)" />
                  </g>
                </svg>
              </motion.div>
            </div>
          ) : (
            /* LIGHT MODE: 3D Cute Radiant Coral-Pink Sun with golden ray pegs and pastel fluffy clouds matching Image 2 */
            <div className="relative w-full h-full">
              <motion.div
                initial={{ scale: 0.92, y: 4 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-full h-full flex items-end justify-center"
              >
                <svg
                  viewBox="0 0 230 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="overflow-visible w-[230px] h-[160px] landscape:w-[120px] landscape:h-[75px] transition-all"
                >
                  <defs>
                    {/* 3D Coral Sun Sphere Gradient */}
                    <radialGradient id="sun3DSphere" cx="35%" cy="30%" r="65%" fx="30%" fy="25%">
                      <stop offset="0%" stopColor="#FFA6A6" />
                      <stop offset="35%" stopColor="#FF7A85" />
                      <stop offset="70%" stopColor="#F43F5E" />
                      <stop offset="100%" stopColor="#BE123C" />
                    </radialGradient>

                    {/* Golden Ray Peg Gradient */}
                    <linearGradient id="sunRayPeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>

                    {/* Cloud Gradients */}
                    <linearGradient id="cloudBackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E0E7FF" />
                      <stop offset="100%" stopColor="#C7D2FE" />
                    </linearGradient>
                    <linearGradient id="cloudPinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDF2F8" />
                      <stop offset="100%" stopColor="#FCE7F3" />
                    </linearGradient>
                    <linearGradient id="cloudWhiteGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F1F5F9" />
                    </linearGradient>
                  </defs>

                  {/* 1. Back Soft Lavender Cloud */}
                  <ellipse cx="175" cy="85" rx="35" ry="18" fill="url(#cloudBackGrad)" opacity="0.6" />

                  {/* 2. Golden Ray Pegs around the Sun Head */}
                  {/* Top center ray */}
                  <rect x="137" y="10" width="6" height="14" rx="3" fill="url(#sunRayPeg)" />
                  {/* Top-right ray */}
                  <rect x="157" y="15" width="6" height="14" rx="3" transform="rotate(25 160 22)" fill="url(#sunRayPeg)" />
                  {/* Far-right-top ray */}
                  <rect x="172" y="28" width="6" height="14" rx="3" transform="rotate(50 175 35)" fill="url(#sunRayPeg)" />
                  {/* Top-left ray */}
                  <rect x="117" y="15" width="6" height="14" rx="3" transform="rotate(-25 120 22)" fill="url(#sunRayPeg)" />
                  {/* Far-left-top ray */}
                  <rect x="100" y="28" width="6" height="14" rx="3" transform="rotate(-50 103 35)" fill="url(#sunRayPeg)" />
                  {/* Left side ray */}
                  <rect x="90" y="48" width="6" height="13" rx="3" transform="rotate(-75 93 54)" fill="url(#sunRayPeg)" />

                  {/* 3. 3D Coral Sun Sphere Body */}
                  <circle
                    cx="140"
                    cy="62"
                    r="34"
                    fill="url(#sun3DSphere)"
                    filter="drop-shadow(0 4px 12px rgba(244,63,94,0.3))"
                  />

                  {/* Soft Sphere Highlight */}
                  <ellipse
                    cx="130"
                    cy="48"
                    rx="11"
                    ry="6"
                    transform="rotate(-30 130 48)"
                    fill="#FFFFFF"
                    opacity="0.45"
                  />

                  {/* Cute Sun Eyes */}
                  <circle cx="132" cy="58" r="2.8" fill="#1E1B4B" />
                  <circle cx="133" cy="57" r="0.9" fill="#FFFFFF" />

                  <circle cx="147" cy="58" r="2.8" fill="#1E1B4B" />
                  <circle cx="148" cy="57" r="0.9" fill="#FFFFFF" />

                  {/* Blush Cheeks */}
                  <ellipse cx="127" cy="63" rx="3" ry="1.8" fill="#BE123C" opacity="0.4" />
                  <ellipse cx="152" cy="63" rx="3" ry="1.8" fill="#BE123C" opacity="0.4" />

                  {/* Cute Smile */}
                  <path
                    d="M136 63C138 65.5 142 65.5 144 63"
                    stroke="#1E1B4B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* 4. Foreground Pastel Clouds */}
                  {/* Left Lavender Cloud */}
                  <ellipse cx="85" cy="88" rx="22" ry="12" fill="#DDD6FE" opacity="0.8" />

                  {/* Warm Pink Cloud Layer */}
                  <ellipse cx="125" cy="115" rx="55" ry="25" fill="url(#cloudPinkGrad)" />
                  <circle cx="105" cy="100" r="22" fill="url(#cloudPinkGrad)" />
                  <circle cx="145" cy="98" r="24" fill="url(#cloudPinkGrad)" />

                  {/* Crisp White Front Cloud Layer */}
                  <ellipse cx="160" cy="120" rx="48" ry="22" fill="url(#cloudWhiteGrad)" />
                  <circle cx="180" cy="108" r="20" fill="url(#cloudWhiteGrad)" />
                  <circle cx="145" cy="112" r="18" fill="url(#cloudWhiteGrad)" />
                </svg>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

