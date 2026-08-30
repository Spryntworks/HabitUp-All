import React from 'react';
import { useHabit } from '../../context/HabitContext';
import { Toast } from '../common/Toast';
import { BottomTabBar } from './BottomTabBar';
import { Smartphone } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const { theme, isAuthenticated } = useHabit();
  const isDark = theme === 'dark';

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center overflow-hidden ${
        isDark ? 'bg-[#050811] text-neutral-100' : 'bg-slate-900 text-neutral-900'
      } transition-colors select-none`}
    >
      {/* Fixed Portrait Device Frame - strictly restricted to phone vertical aspect ratio */}
      <div
        className={`relative w-full max-w-[430px] h-full sm:h-[94vh] sm:max-h-[890px] flex flex-col transition-all duration-200 overflow-hidden sm:rounded-[36px] sm:border-[4px] ${
          isDark
            ? 'bg-[#0B1120] text-white sm:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]'
            : 'bg-[#F8FAFC] text-neutral-900 sm:border-slate-700 shadow-2xl'
        }`}
        style={{
          aspectRatio: '9 / 19.5',
          maxWidth: '430px',
        }}
      >
        {/* Dynamic Island / Mobile Speaker Notch styling for realistic mobile preview */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-transparent z-40">
          <div className="w-24 h-4 bg-black/40 rounded-full flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black/60" />
            <div className="w-3 h-1 rounded-full bg-black/50" />
          </div>
        </div>

        {/* Main Content Area (Strictly Vertical Scrollable View) */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-2 ${
            isDark ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'
          }`}
        >
          {children}
        </main>

        {/* Floating Toast Notification */}
        <Toast />

        {/* Bottom Tab Navigation */}
        {isAuthenticated && <BottomTabBar />}

        {/* Mobile Home Bar Indicator */}
        <div className="hidden sm:flex justify-center py-1.5 bg-transparent">
          <div className={`w-28 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
        </div>
      </div>
    </div>
  );
};

