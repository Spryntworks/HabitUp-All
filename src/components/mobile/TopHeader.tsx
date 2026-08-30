import React from 'react';
import { useHabit } from '../../context/HabitContext';
import { Bell, WifiOff, Sparkles, Moon, Sun } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    user,
    habits,
    theme,
    toggleTheme,
    isOffline,
    setIsOffline,
    setIsAuthSessionModalOpen,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="px-5 pt-3 pb-1 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[13px] font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
            {getGreetingTime()}, {user.name.split(' ')[0]}! 👋
          </span>
        </div>
        <h1 className={`text-2xl font-black tracking-tight font-display mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Let's <span className="text-[#7C5CFF]">crush</span> today!
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Offline status button */}
        <button
          onClick={() => {
            const nextOffline = !isOffline;
            setIsOffline(nextOffline);
            showToast(
              nextOffline
                ? 'Switched to Offline Mode (Mutations cached locally)'
                : 'Back Online! Synchronized with storage',
              undefined,
              nextOffline ? 'warning' : 'success'
            );
          }}
          className={`p-2 rounded-xl transition-all ${
            isOffline
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : isDark
              ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
          }`}
          title={isOffline ? 'Offline Mode active (Click to go online)' : 'Online (Click to simulate offline)'}
        >
          {isOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4 text-neutral-400" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-colors ${
            isDark
              ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => {
            const habitWithReminder = habits.find((h) => h.reminder_time && !h.archived_at && !h.deleted_at && !h.paused_at) || habits[0];
            if (habitWithReminder) {
              window.dispatchEvent(
                new CustomEvent('trigger-habit-reminder', {
                  detail: { habitId: habitWithReminder.id },
                })
              );
            } else {
              showToast('🔔 Daily reminders scheduled according to your habit times.', undefined, 'info');
            }
          }}
          className={`relative p-2 rounded-xl transition-colors ${
            isDark
              ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
          }`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-neutral-900" />
        </button>
      </div>
    </header>
  );
};

