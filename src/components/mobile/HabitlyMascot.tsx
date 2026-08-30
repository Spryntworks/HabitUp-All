import React from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';

interface HabitlyMascotProps {
  onClick?: () => void;
  className?: string;
}

export const HabitlyMascot: React.FC<HabitlyMascotProps> = ({ onClick, className = '' }) => {
  const { theme } = useHabit();
  const isDark = theme === 'dark';

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-36 flex items-center justify-center overflow-hidden cursor-pointer select-none ${className}`}
      title={isDark ? "Mountain Peak of Consistency" : "Radiant Sun of New Beginnings"}
    >
      {isDark ? (
        /* Dark Mode: Mountain Mascot with Red Flag & Twinkling Night Stars */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Night Sky Ambient Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#111827] to-transparent opacity-80" />

          {/* Twinkling Stars */}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-8 text-amber-300 text-sm"
          >
            ✦
          </motion.div>
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 0.7, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute top-8 left-20 text-cyan-300 text-xs"
          >
            ★
          </motion.div>
          <motion.div
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute top-3 right-12 text-amber-200 text-xs"
          >
            ✦
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute top-10 right-28 text-pink-300 text-[10px]"
          >
            ★
          </motion.div>

          {/* Mountain Mascot SVG */}
          <motion.div
            initial={{ scale: 0.9, y: 5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <svg width="220" height="135" viewBox="0 0 220 135" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Back Mountain Silhouette */}
              <path
                d="M30 130L85 45C88 40 95 40 98 45L150 130H30Z"
                fill="#1E293B"
                opacity="0.7"
              />
              <path
                d="M110 130L155 60C158 55 165 55 168 60L205 130H110Z"
                fill="#0F766E"
                opacity="0.4"
              />

              {/* Main Mountain Body */}
              <defs>
                <linearGradient id="mountainGrad" x1="110" y1="20" x2="110" y2="135" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="40%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="snowGrad" x1="110" y1="18" x2="110" y2="55" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id="flagGrad" x1="110" y1="0" x2="135" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF4D6D" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
              </defs>

              {/* Main Peak Pyramid with rounded apex */}
              <path
                d="M50 135L103 26C106.5 20 113.5 20 117 26L170 135C171 137 169.5 139 167 139H53C50.5 139 49 137 50 135Z"
                fill="url(#mountainGrad)"
              />

              {/* Snow Cap with Cute Scalloped Edge */}
              <path
                d="M103 26C106.5 20 113.5 20 117 26L135 55C132 58 128 56 124 58C120 60 116 57 110 59C104 57 100 60 96 58C92 56 88 58 85 55L103 26Z"
                fill="url(#snowGrad)"
              />

              {/* Red Flag Pole on the Peak */}
              <line x1="110" y1="20" x2="110" y2="0" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
              {/* Triangular Red Flag */}
              <motion.path
                animate={{
                  d: [
                    "M110 1L135 7L110 14Z",
                    "M110 1L137 9L110 15Z",
                    "M110 1L135 7L110 14Z",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                fill="url(#flagGrad)"
              />
              <circle cx="110" cy="1" r="2" fill="#FBBF24" />

              {/* Mountain Cute Eyes */}
              <circle cx="102" cy="78" r="3.5" fill="#064E3B" />
              <circle cx="103" cy="76.5" r="1.2" fill="#FFFFFF" />

              <circle cx="118" cy="78" r="3.5" fill="#064E3B" />
              <circle cx="119" cy="76.5" r="1.2" fill="#FFFFFF" />

              {/* Rosy Cheeks */}
              <ellipse cx="96" cy="83" rx="3" ry="2" fill="#F43F5E" opacity="0.6" />
              <ellipse cx="124" cy="83" rx="3" ry="2" fill="#F43F5E" opacity="0.6" />

              {/* Happy Smile */}
              <path
                d="M106 84C108 87 112 87 114 84"
                stroke="#064E3B"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Fluffy Base Night Clouds */}
              <path
                d="M15 135C15 120 30 115 42 120C48 110 65 110 72 120C80 115 95 120 95 135H15Z"
                fill="#1E293B"
                opacity="0.85"
              />
              <path
                d="M125 135C125 118 140 115 152 120C160 112 178 112 186 122C195 118 208 122 208 135H125Z"
                fill="#1E293B"
                opacity="0.85"
              />
              <path
                d="M70 135C70 123 82 120 90 124C96 117 110 117 116 125C122 120 135 123 135 135H70Z"
                fill="#334155"
                opacity="0.9"
              />
            </svg>
          </motion.div>
        </div>
      ) : (
        /* Light Mode: 3D Smiling Orange Sun with Fluffy Clouds */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Light Sky Pastel Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/70 via-sky-50/50 to-transparent" />

          {/* Sun Character */}
          <motion.div
            initial={{ scale: 0.9, y: 5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <svg width="220" height="135" viewBox="0 0 220 135" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* 3D Sun Sphere Gradient */}
                <radialGradient id="sunSphere" cx="45%" cy="40%" r="55%" fx="40%" fy="35%">
                  <stop offset="0%" stopColor="#FFA07A" />
                  <stop offset="35%" stopColor="#FF7F50" />
                  <stop offset="75%" stopColor="#FF6347" />
                  <stop offset="100%" stopColor="#E03822" />
                </radialGradient>
                {/* Sun Ray Gradient */}
                <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
                {/* Cloud Gradients */}
                <linearGradient id="cloudFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id="cloudBack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Back Cloud with Warm Morning Tint */}
              <ellipse cx="140" cy="85" rx="45" ry="25" fill="url(#cloudBack)" />
              <ellipse cx="80" cy="90" rx="35" ry="20" fill="url(#cloudBack)" />

              {/* Sun Rays radiating outwards */}
              {/* Ray 1 */}
              <circle cx="110" cy="18" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 2 */}
              <circle cx="138" cy="25" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 3 */}
              <circle cx="82" cy="25" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 4 */}
              <circle cx="155" cy="45" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 5 */}
              <circle cx="65" cy="45" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 6 */}
              <circle cx="160" cy="70" r="4.5" fill="url(#rayGrad)" />
              {/* Ray 7 */}
              <circle cx="60" cy="70" r="4.5" fill="url(#rayGrad)" />

              {/* Main 3D Sun Sphere */}
              <circle cx="110" cy="65" r="38" fill="url(#sunSphere)" />

              {/* Highlight Shimmer on Top Left */}
              <ellipse cx="98" cy="48" rx="12" ry="7" transform="rotate(-30 98 48)" fill="#FFFFFF" opacity="0.35" />

              {/* Sun Cute Black Eyes */}
              <circle cx="101" cy="62" r="3.5" fill="#1F2937" />
              <circle cx="102" cy="60.5" r="1.2" fill="#FFFFFF" />

              <circle cx="119" cy="62" r="3.5" fill="#1F2937" />
              <circle cx="120" cy="60.5" r="1.2" fill="#FFFFFF" />

              {/* Rosy Cheeks */}
              <ellipse cx="93" cy="69" rx="3.8" ry="2.2" fill="#BE123C" opacity="0.4" />
              <ellipse cx="127" cy="69" rx="3.8" ry="2.2" fill="#BE123C" opacity="0.4" />

              {/* Smile */}
              <path
                d="M106 69C108 73 112 73 114 69"
                stroke="#1F2937"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Fluffy Front Clouds in Light Mode */}
              <ellipse cx="60" cy="115" rx="38" ry="24" fill="url(#cloudFront)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
              <ellipse cx="110" cy="120" rx="55" ry="26" fill="url(#cloudFront)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
              <ellipse cx="160" cy="115" rx="38" ry="24" fill="url(#cloudFront)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
            </svg>
          </motion.div>
        </div>
      )}
    </div>
  );
};
