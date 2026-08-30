import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  HABIT_COLORS,
  AVAILABLE_ICONS,
  DAYS_OF_WEEK,
  QUICK_START_TEMPLATES,
} from '../../constants/templates';
import { FrequencyType, QuickStartTemplate } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ArrowLeft, Sparkles, Clock, Calendar, Check, X, Bell } from 'lucide-react';

export const CreateHabitModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createHabit, theme } = useHabit();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Dumbbell');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('08:00');
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');

  const isDark = theme === 'dark';

  if (!isCreateModalOpen) return null;

  const handleApplyTemplate = (tpl: QuickStartTemplate) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setSelectedIcon(tpl.icon);
    setSelectedColor(tpl.color);
    setFrequencyType(tpl.frequency_type);
    setScheduledDays(tpl.scheduled_days);
    setReminderTime(tpl.defaultTime);
    setReminderEnabled(true);
    setActiveTab('custom');
  };

  const toggleDay = (dayIdx: number) => {
    if (scheduledDays.includes(dayIdx)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter((d) => d !== dayIdx));
      }
    } else {
      setScheduledDays([...scheduledDays, dayIdx].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: selectedIcon,
      color: selectedColor,
      frequency_type: frequencyType,
      scheduled_days: frequencyType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : scheduledDays,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    });

    setIsCreateModalOpen(false);
    setName('');
    setDescription('');
    setSelectedIcon('Dumbbell');
    setSelectedColor('#FF6B6B');
    setFrequencyType('daily');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border ${
          isDark
            ? 'bg-[#111827] border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Top Header matching Image 2 */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base font-bold tracking-tight">Create Habit</h2>

          <button
            type="button"
            onClick={handleSave}
            className="text-sm font-bold text-[#7C5CFF] hover:text-[#6C4BFA] px-2 py-1 transition-colors"
          >
            Save
          </button>
        </div>

        {/* Tab switcher: Custom vs Templates */}
        <div className={`px-5 pt-3 pb-1 flex gap-2 border-b ${isDark ? 'border-neutral-800/60' : 'border-neutral-100'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'custom'
                ? isDark
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Custom Habit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'templates'
                ? 'bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
            Templates
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'templates' ? (
            <div className="space-y-2.5">
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'} mb-2`}>
                Choose a pre-configured template to jumpstart your daily routine:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_START_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${
                      isDark
                        ? 'bg-[#1F2937] hover:bg-neutral-750 border-neutral-800'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: tpl.color }}
                    >
                      <IconRenderer name={tpl.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'} group-hover:text-[#7C5CFF] transition-colors`}>
                          {tpl.name}
                        </span>
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          <Clock className="w-3 h-3" /> {tpl.defaultTime}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {tpl.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Preview Icon with Sparkles matching Image 2 */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="relative">
                  {/* Decorative sparkles around the icon */}
                  <span className="absolute -top-2 -left-3 text-amber-400 text-sm animate-pulse">✦</span>
                  <span className="absolute -bottom-1 -right-3 text-amber-300 text-xs animate-pulse">✨</span>
                  <span className="absolute top-1 -right-4 text-purple-400 text-xs">✦</span>
                  
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105"
                    style={{
                      backgroundColor: selectedColor,
                      boxShadow: `0 8px 24px ${selectedColor}40`,
                    }}
                  >
                    <IconRenderer name={selectedIcon} className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Habit Name */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Morning Workout"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] border transition-all ${
                    isDark
                      ? 'bg-[#1F2937] border-neutral-750 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                />
              </div>

              {/* Description (optional) */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="30 minutes of exercise"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] border transition-all ${
                    isDark
                      ? 'bg-[#1F2937] border-neutral-750 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                />
              </div>

              {/* Choose Icon */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Choose Icon
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
                        selectedIcon === iconName
                          ? 'bg-[#7C5CFF] text-white shadow-md shadow-indigo-500/30 scale-105'
                          : isDark
                          ? 'bg-[#1F2937] text-neutral-400 hover:text-white border border-neutral-750'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                      }`}
                    >
                      <IconRenderer name={iconName} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Choose Color */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Choose Color
                </label>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-transform ${
                        selectedColor === c.hex
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Schedule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFrequencyType('daily');
                      setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      frequencyType === 'daily'
                        ? 'bg-[#7C5CFF] text-white shadow-md shadow-indigo-500/30'
                        : isDark
                        ? 'bg-[#1F2937] text-neutral-400 hover:text-white border border-neutral-750'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    Every Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFrequencyType('custom_days');
                      setScheduledDays([0, 1, 2, 3, 4]); // Mon-Fri
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      frequencyType === 'custom_days'
                        ? 'bg-[#7C5CFF] text-white shadow-md shadow-indigo-500/30'
                        : isDark
                        ? 'bg-[#1F2937] text-neutral-400 hover:text-white border border-neutral-750'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    Specific Days
                  </button>
                </div>

                {frequencyType === 'custom_days' && (
                  <div className="grid grid-cols-7 gap-1 mt-2.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = scheduledDays.includes(d.index);
                      return (
                        <button
                          key={d.index}
                          type="button"
                          onClick={() => toggleDay(d.index)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#7C5CFF] text-white shadow-sm'
                              : isDark
                              ? 'bg-[#1F2937] text-neutral-400 hover:text-white'
                              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reminder Time & Notification */}
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#1F2937] border-neutral-750' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#7C5CFF]" />
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {name.trim()
                          ? (name.trim().toLowerCase().endsWith('time') ? name.trim() : `${name.trim()} Time`)
                          : 'Scheduled Habit Time'}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Receive alert & chime at your chosen time
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                      reminderEnabled ? 'bg-[#7C5CFF]' : 'bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        reminderEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {reminderEnabled && (
                  <div className="space-y-2 pt-1 border-t border-neutral-700/40">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-[#7C5CFF] ${
                          isDark
                            ? 'bg-[#111827] border-neutral-700 text-white'
                            : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                      />
                      <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        (Local time)
                      </span>
                    </div>

                    {/* Quick Time Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { label: '07:00', name: 'Morning' },
                        { label: '12:00', name: 'Noon' },
                        { label: '18:00', name: 'Evening' },
                        { label: '21:00', name: 'Night' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setReminderTime(preset.label)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            reminderTime === preset.label
                              ? 'bg-[#7C5CFF] text-white border-[#7C5CFF]'
                              : isDark
                              ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                Create Habit
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

