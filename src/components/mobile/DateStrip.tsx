import React from 'react';
import { useHabit } from '../../context/HabitContext';
import { getWeekDays, formatDateKey } from '../../utils/streakCalculator';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const DateStrip: React.FC = () => {
  const { selectedDate, setSelectedDate, completions, habits } = useHabit();

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const todayKey = formatDateKey(new Date());
  const weekDays = getWeekDays(selectedDateTime);

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const changeWeek = (offsetDays: number) => {
    const nextDate = new Date(selectedDateTime);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    setSelectedDate(formatDateKey(nextDate));
  };

  const jumpToToday = () => {
    setSelectedDate(todayKey);
  };

  return (
    <div className="px-5 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDateTime)}
          </span>
          {selectedDate !== todayKey && (
            <button
              onClick={jumpToToday}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 transition-colors"
            >
              Back to Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changeWeek(-7)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => changeWeek(7)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Days Row */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((item) => {
          const isSelected = item.key === selectedDate;
          const isToday = item.isToday;

          // Check completions for this date
          const dateCompletions = completions.filter(
            (c) => c.completion_date === item.key
          );
          const hasCompletions = dateCompletions.length > 0;
          const isAllDone =
            activeHabits.length > 0 &&
            activeHabits.every((h) =>
              completions.some(
                (c) => c.habit_id === h.id && c.completion_date === item.key
              )
            );

          return (
            <button
              key={item.key}
              onClick={() => setSelectedDate(item.key)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/25 scale-[1.02]'
                  : isToday
                  ? 'bg-neutral-800 text-rose-400 border border-rose-500/40 hover:bg-neutral-750'
                  : 'bg-neutral-900/60 dark:bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800/80'
              }`}
            >
              <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                {item.dayName}
              </span>
              <span className={`text-base font-extrabold mt-0.5 ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                {item.dayNumber}
              </span>

              {/* Status indicator dot */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isAllDone ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                ) : hasCompletions ? (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-amber-400'}`} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
