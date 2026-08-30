import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { InAppNotification } from '../../services/notificationService';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from './IconRenderer';

export const NotificationBanner: React.FC = () => {
  const { toggleCompletion, theme } = useHabit();
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<InAppNotification>;
      if (customEvent.detail) {
        setCurrentNotification(customEvent.detail);
      }
    };

    window.addEventListener('habitup-inapp-notification', handleNotification);
    return () => {
      window.removeEventListener('habitup-inapp-notification', handleNotification);
    };
  }, []);

  // Auto dismiss after 7 seconds
  useEffect(() => {
    if (!currentNotification) return;
    const timer = setTimeout(() => {
      setCurrentNotification(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentNotification]);

  if (!currentNotification) return null;

  const handleComplete = () => {
    if (currentNotification.habitId) {
      toggleCompletion(currentNotification.habitId);
    }
    setCurrentNotification(null);
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className={`w-full max-w-sm rounded-3xl p-3.5 shadow-2xl border pointer-events-auto backdrop-blur-md flex items-center gap-3 relative ${
              isDark
                ? 'bg-[#182032]/95 border-slate-700/80 text-white shadow-slate-950/60'
                : 'bg-white/95 border-slate-200/90 text-neutral-900 shadow-xl shadow-slate-300/60'
            }`}
          >
            {/* Left Habit / Notification Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{
                backgroundColor: currentNotification.color || '#7C5CFF',
              }}
            >
              {currentNotification.icon ? (
                <IconRenderer name={currentNotification.icon} className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Middle Title & Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black truncate font-display">
                  {currentNotification.title}
                </span>
                {currentNotification.reminderTime && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {currentNotification.reminderTime}
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 leading-snug ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {currentNotification.body}
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {currentNotification.habitId && (
                <button
                  onClick={handleComplete}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-emerald-500/30 active:scale-95 transition-all"
                  title="Mark habit completed"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Done
                </button>
              )}

              <button
                onClick={() => setCurrentNotification(null)}
                className={`p-1.5 rounded-xl transition-colors ${
                  isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-slate-800'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-slate-100'
                }`}
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
