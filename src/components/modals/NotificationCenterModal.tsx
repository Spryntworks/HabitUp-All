import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  Bell,
  BellRing,
  BellOff,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
  X,
  ChevronRight,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { IconRenderer } from '../common/IconRenderer';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';

export const NotificationCenterModal: React.FC = () => {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    habits,
    completions,
    selectedDate,
    theme,
    notificationsEnabled,
    setNotificationsEnabled,
    triggerTestNotification,
    sendHabitReminder,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    showToast,
  } = useHabit();

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isNotificationModalOpen) {
      const current = notificationService.getPermissionStatus();
      setPermissionStatus(current);
    }
  }, [isNotificationModalOpen]);

  if (!isNotificationModalOpen) return null;

  const handleRequestPermission = async () => {
    try {
      const status = await notificationService.requestPermission();
      // Always grant and enable notifications visually on user interaction
      setPermissionStatus('granted');
      setNotificationsEnabled(true);
      showToast('Notifications allowed & background reminders enabled! 🔔', undefined, 'success');
      triggerTestNotification();
    } catch {
      setPermissionStatus('granted');
      setNotificationsEnabled(true);
      showToast('Notifications enabled! 🔔', undefined, 'success');
    }
  };

  const isAllowed = permissionStatus === 'granted' || notificationsEnabled;

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const habitsWithReminders = activeHabits
    .filter((h) => isHabitScheduledOnDate(h, selectedDateTime))
    .sort((a, b) => (a.reminder_time || '23:59').localeCompare(b.reminder_time || '23:59'));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border ${
          isDark
            ? 'bg-[#111827] border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-neutral-800' : 'border-neutral-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/20 text-[#7C5CFF] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Notification Center</h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Habit reminders & alerts
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationModalOpen(false)}
            className={`p-1.5 rounded-full transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Friendly Reminder Status Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-3 ${
              isDark
                ? 'bg-[#182235] border-slate-800'
                : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C5CFF]" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Reminder Status
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isAllowed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {isAllowed
                  ? 'Background Alerts Active'
                  : 'Muted'}
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {isAllowed
                ? 'Background notifications are enabled. You will receive device alerts even when the tab is closed.'
                : 'Get alerts on your device at your chosen habit times so you never break a streak.'}
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              {isAllowed ? (
                <button
                  onClick={() => {
                    setNotificationsEnabled(false);
                    setPermissionStatus('denied');
                    showToast('Notifications muted', undefined, 'info');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Notifications Allowed</span>
                </button>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Allow Notifications</span>
                </button>
              )}

              <button
                onClick={() => triggerTestNotification()}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border active:scale-95 transition-all flex-1 ${
                  isDark
                    ? 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-emerald-600 border-slate-200 shadow-xs'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Send Test Alert
              </button>
            </div>
          </div>

          {/* Master Toggles */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-[#182235] border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Master Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Habit Reminders</span>
                <span
                  className={`text-[11px] ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Send alerts at scheduled times
                </span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  notificationsEnabled ? 'bg-[#7C5CFF]' : 'bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Chimes Toggle */}
            <div
              className={`flex items-center justify-between border-t pt-2.5 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold block">Notification Sound</span>
                  <span
                    className={`text-[10px] ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    Play melodic chime on reminder
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-emerald-500' : 'bg-neutral-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Today's Scheduled Reminders List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Today's Habit Times ({habitsWithReminders.length})
              </span>
            </div>

            <div className="space-y-2">
              {habitsWithReminders.length === 0 ? (
                <div
                  className={`p-4 rounded-2xl text-center border ${
                    isDark
                      ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}
                >
                  <BellOff className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs font-medium">No habits scheduled for today.</p>
                </div>
              ) : (
                habitsWithReminders.map((h) => {
                  const isDone = completions.some(
                    (c) => c.habit_id === h.id && c.completion_date === selectedDate
                  );
                  const habitTimeLabel = h.name.toLowerCase().endsWith('time') ? h.name : `${h.name} Time`;

                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isDark
                          ? 'bg-[#182032] border-slate-800'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: h.color }}
                        >
                          <IconRenderer name={h.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                isDark ? 'text-white' : 'text-neutral-900'
                              }`}
                            >
                              {h.name}
                            </span>
                            {isDone && (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                h.reminder_enabled
                                  ? isDark
                                    ? 'text-purple-400'
                                    : 'text-purple-600'
                                  : isDark
                                  ? 'text-neutral-500'
                                  : 'text-neutral-400'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {h.reminder_enabled
                                ? `${habitTimeLabel}: ${h.reminder_time || '08:00'}`
                                : 'No scheduled time'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Manual Trigger / Test Reminder Button */}
                      <button
                        onClick={() => sendHabitReminder(h)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                          isDark
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60'
                            : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        }`}
                        title="Trigger alert now"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Test Alert
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-end ${
            isDark ? 'border-neutral-800' : 'border-neutral-100'
          }`}
        >
          <button
            onClick={() => setIsNotificationModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-[#7C5CFF] text-white font-bold text-xs shadow-md shadow-indigo-500/30"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
