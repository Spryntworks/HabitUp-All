import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlantStageInfo } from '../../types';
import { PlantIllustration } from './PlantIllustration';
import { Sparkles, Droplets } from 'lucide-react';
import { useHabit } from '../../context/HabitContext';

interface PlantVisualizerProps {
  stage: PlantStageInfo;
  streak: number;
  hydrationPercent: number;
  isWateredToday: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const PlantVisualizer: React.FC<PlantVisualizerProps> = ({
  stage,
  streak,
  hydrationPercent,
  isWateredToday,
  size = 'md',
  interactive = true,
}) => {
  const { theme } = useHabit();
  const isDark = theme === 'dark';
  const isHealthy = hydrationPercent > 0 || isWateredToday;

  // Dimensions based on size
  const dim = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-52 h-52 sm:w-60 sm:h-60' : 'w-28 h-28';

  return (
    <div className={`relative flex items-center justify-center ${dim} select-none`}>
      {/* Background radial glow */}
      <motion.div
        animate={{
          scale: isWateredToday ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isWateredToday ? (isDark ? [0.35, 0.65, 0.35] : [0.2, 0.45, 0.2]) : (isDark ? [0.15, 0.25, 0.15] : [0.08, 0.18, 0.08]),
        }}
        transition={{ repeat: Infinity, duration: isWateredToday ? 3 : 5, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
        style={{
          backgroundColor: stage.accentColor,
        }}
      />

      {/* Decorative Aura Ring */}
      <div
        className={`absolute rounded-full border ${
          size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-48 h-48 sm:w-56 sm:h-56' : 'w-24 h-24'
        } ${
          isWateredToday
            ? 'border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
            : hydrationPercent > 0
            ? isDark
              ? 'border-sky-400/30 bg-sky-500/10'
              : 'border-sky-300/60 bg-sky-50/60'
            : isDark
            ? 'border-neutral-800 bg-neutral-850/40'
            : 'border-slate-200/80 bg-slate-100/50'
        } transition-all duration-700 flex items-center justify-center pointer-events-none`}
      />

      {/* Dynamic Animated Vector Plant with Growth Keying */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`plant-level-${stage.level}`}
          initial={{ scale: 0.7, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={interactive ? { scale: 1.08 } : undefined}
          whileTap={interactive ? { scale: 0.94 } : undefined}
          className="relative z-10 flex items-center justify-center cursor-pointer"
        >
          <PlantIllustration
            level={stage.level}
            hydrationPercent={hydrationPercent}
            isWateredToday={isWateredToday}
            size={size}
          />
        </motion.div>
      </AnimatePresence>

      {/* Sparkles / Watered Status indicators */}
      {isWateredToday && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-0 right-1 z-20 pointer-events-none"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '7s' }} />
        </motion.div>
      )}

      {/* Floating droplets indicator when watering in progress */}
      {hydrationPercent > 0 && !isWateredToday && (
        <motion.div
          animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-0 left-1 z-20 pointer-events-none"
        >
          <Droplets className="w-4 h-4 text-sky-400 fill-sky-400" />
        </motion.div>
      )}

      {/* Growth Celebration Floater */}
      {isWateredToday && (
        <motion.div
          animate={{
            y: [-4, -14, -4],
            opacity: [0, 1, 0],
          }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
          className="absolute -top-3 text-[11px] text-emerald-300 font-extrabold pointer-events-none tracking-wide"
        >
          🌱 Growing!
        </motion.div>
      )}
    </div>
  );
};

