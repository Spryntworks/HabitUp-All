import React, { useState } from 'react';
import { useHabit } from '../../context/HabitContext';
import {
  User,
  ShieldCheck,
  Bell,
  Volume2,
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Database,
  Moon,
  Sun,
  Code,
  LogOut,
  FileSpreadsheet,
  Camera,
  Sparkles,
} from 'lucide-react';
import {
  canInstallPwa,
  installPwaApp,
} from '../../services/notificationService';
import { HabitUpLogo } from '../common/HabitUpLogo';
import { TimezoneSelect } from '../common/TimezoneSelect';

export const SettingsView: React.FC = () => {
  const {
    habits,
    completions,
    user,
    updateUser,
    theme,
    toggleTheme,
    setActiveTab,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    triggerTestNotification,
    setIsNotificationModalOpen,
    isOffline,
    setIsOffline,
    syncQueue,
    setIsAuthSessionModalOpen,
    showToast,
    logout,
  } = useHabit();

  const isDark = theme === 'dark';

  const handleExportCSV = () => {
    const headers = [
      'Habit Name',
      'Completion Date',
      'Status',
      'Completed Timestamp',
      'Frequency Type',
      'Scheduled Days',
      'Reminder Time',
      'Notes/Description',
    ];

    const rows: string[][] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    habits.forEach((habit) => {
      const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
      const schedStr =
        habit.frequency_type === 'daily'
          ? 'Daily'
          : (habit.scheduled_days || []).map((d) => dayNames[d]).join('; ');

      if (habitCompletions.length === 0) {
        rows.push([
          habit.name,
          '',
          'Active (No check-ins yet)',
          '',
          habit.frequency_type,
          schedStr,
          habit.reminder_time || 'None',
          habit.description || '',
        ]);
      } else {
        habitCompletions.forEach((c) => {
          rows.push([
            habit.name,
            c.completion_date,
            'Completed',
            c.completed_at || '',
            habit.frequency_type,
            schedStr,
            habit.reminder_time || 'None',
            c.notes || habit.description || '',
          ]);
        });
      }
    });

    const escapeCsv = (val: string) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitup_habits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported habit data as CSV!', undefined, 'success');
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-3 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Settings
          </h1>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Preferences & Data
          </p>
        </div>

        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
            isDark
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs'
          }`}
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Account & Profile Card */}
      <div
        onClick={() => setIsAuthSessionModalOpen(true)}
        className={`p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#7C5CFF]/50 p-0.5 ${
                isDark ? 'bg-neutral-800' : 'bg-slate-100'
              }`}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-[#7C5CFF] to-pink-500 rounded-full">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7C5CFF] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-2.5 h-2.5" />
            </div>
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user.name}
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {user.email}
            </p>
            <span className="text-[10px] text-emerald-500 font-semibold">
              Timezone: {user.timezone}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
          <span className="text-xs font-semibold text-[#7C5CFF]">Edit DP</span>
          <ChevronRight className="w-4 h-4 text-[#7C5CFF]" />
        </div>
      </div>

      {/* Settings Grid: 2 Columns in Landscape / Desktop */}
      <div className="landscape:grid landscape:grid-cols-2 landscape:gap-4 md:grid md:grid-cols-2 md:gap-4 space-y-4 landscape:space-y-0 md:space-y-0">
        {/* App Preferences Section */}
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wider block ${
              isDark ? 'text-neutral-400' : 'text-slate-500'
            }`}
          >
            App Preferences
          </span>

          {/* Dark/Light Mode */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Theme Mode
                </span>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-750 text-white border-neutral-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>

          {/* Sound Effects */}
          <div
            className={`flex items-center justify-between py-1 border-t pt-2 ${
              isDark ? 'border-neutral-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sound Effects
                </span>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Play chime when habit is completed
                </span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-emerald-500' : isDark ? 'bg-neutral-700' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptics */}
          <div
            className={`flex items-center justify-between py-1 border-t pt-2 ${
              isDark ? 'border-neutral-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-rose-500" />
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Vibration Feedback
                </span>
                <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Vibrate gently on button tap
                </span>
              </div>
            </div>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                hapticsEnabled ? 'bg-rose-500' : isDark ? 'bg-neutral-700' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  hapticsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Timezone Selection */}
          <div
            className={`pt-2.5 border-t ${
              isDark ? 'border-neutral-800' : 'border-slate-100'
            }`}
          >
            <TimezoneSelect
              value={user.timezone}
              onChange={(newTz) => {
                updateUser({ timezone: newTz });
                showToast(`Timezone updated to ${newTz}`, undefined, 'success');
              }}
              label="Selected Timezone"
            />
          </div>
        </div>

        {/* Offline & Sync */}
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider block ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Offline & Sync
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
              }`}
            >
              {isOffline ? 'Offline' : 'Synced'}
            </span>
          </div>

          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Habits update instantly even without internet, and sync automatically when connected.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOffline(!isOffline);
                showToast(
                  !isOffline ? 'Switched to Offline Mode' : 'Switched to Online Mode',
                  undefined,
                  !isOffline ? 'warning' : 'success'
                );
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-750 text-white border-neutral-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              {isOffline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOffline ? 'Go Online' : 'Simulate Offline'}
            </button>

            <button
              onClick={() => showToast('All pending habit updates synced!', undefined, 'success')}
              className={`flex-1 py-2 rounded-xl text-sky-500 font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700'
                  : 'bg-sky-50 hover:bg-sky-100 border-sky-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Now ({syncQueue.length})
            </button>
          </div>
        </div>

        {/* Data Export */}
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wider block ${
              isDark ? 'text-neutral-400' : 'text-slate-500'
            }`}
          >
            Data Export
          </span>

          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Export all your habits, schedules, and check-in history as a spreadsheet CSV file.
          </p>

          <button
            onClick={handleExportCSV}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all shadow-sm ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-750 text-white border-neutral-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export CSV File
          </button>
        </div>

        {/* Account & Sign Out */}
        <div className="pt-2 pb-6 space-y-3">
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 text-sm font-bold flex items-center justify-center gap-2 border border-rose-500/30 transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <p className={`text-center text-xs ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            Signed in as <span className="font-semibold">{user?.email || 'User'}</span>
          </p>

          {/* HabitUp Brand Card */}
          <div className={`mt-6 pt-6 border-t ${isDark ? 'border-neutral-800/80' : 'border-slate-200'} flex flex-col items-center justify-center text-center space-y-2`}>
            <HabitUpLogo size="md" showSubtitle={true} />
            <p className={`text-[11px] font-medium ${isDark ? 'text-neutral-500' : 'text-slate-400'} pt-1`}>
              Version 2.4.0 • Build 2026.8
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
