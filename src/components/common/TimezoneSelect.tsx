import React from 'react';
import { Globe, Crosshair } from 'lucide-react';
import { POPULAR_TIMEZONES, getDetectedTimezone } from '../../constants/timezones';
import { useHabit } from '../../context/HabitContext';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
  showAutoDetect?: boolean;
  className?: string;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  label = 'Select Timezone',
  showAutoDetect = true,
  className = '',
}) => {
  const { theme, showToast } = useHabit();
  const isDark = theme === 'dark';

  const handleAutoDetect = (e: React.MouseEvent) => {
    e.preventDefault();
    const detected = getDetectedTimezone();
    onChange(detected);
    showToast(`Timezone set to ${detected}`, undefined, 'info');
  };

  // Group timezones
  const groupedTimezones: { [group: string]: typeof POPULAR_TIMEZONES } = {};
  POPULAR_TIMEZONES.forEach((item) => {
    if (!groupedTimezones[item.group]) {
      groupedTimezones[item.group] = [];
    }
    groupedTimezones[item.group].push(item);
  });

  // Ensure current value is in the list or represented
  const isCustom = !POPULAR_TIMEZONES.some(
    (t) => t.value === value || (value === 'Asia/Calcutta' && t.value === 'Asia/Kolkata')
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            className={`text-xs font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-rose-500" />
            <span>{label}</span>
          </label>
          {showAutoDetect && (
            <button
              type="button"
              onClick={handleAutoDetect}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="Detect device timezone automatically"
            >
              <Crosshair className="w-3 h-3" />
              <span>Auto-detect</span>
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-xs font-medium rounded-xl px-3 py-2.5 pr-8 border transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-200 focus:border-rose-500/50'
              : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500/50 shadow-xs'
          }`}
        >
          {isCustom && value && (
            <option value={value} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
              Current: {value}
            </option>
          )}

          {Object.entries(groupedTimezones).map(([groupName, tzList]) => (
            <optgroup
              key={groupName}
              label={groupName}
              className={isDark ? 'bg-slate-900 font-bold text-slate-400' : 'bg-slate-50 font-bold text-slate-500'}
            >
              {tzList.map((tz) => (
                <option
                  key={tz.value}
                  value={tz.value}
                  className={isDark ? 'bg-slate-800 text-slate-100 font-normal py-1' : 'bg-white text-slate-800 font-normal py-1'}
                >
                  [{tz.offset}] {tz.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
