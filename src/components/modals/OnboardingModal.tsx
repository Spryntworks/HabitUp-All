import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { QUICK_START_TEMPLATES } from '../../constants/templates';
import { IconRenderer } from '../common/IconRenderer';
import { Check, Sparkles, X, ArrowRight, Flame } from 'lucide-react';
import { HabitUpLogo } from '../common/HabitUpLogo';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    createHabit,
    showToast,
    triggerCelebration,
  } = useHabit();

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([
    'tpl-exercise',
    'tpl-read',
    'tpl-meditate',
    'tpl-drink-water',
  ]);

  if (!isOnboardingModalOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedTemplateIds.includes(id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter((t) => t !== id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, id]);
    }
  };

  const handleStartWithTemplates = () => {
    const selected = QUICK_START_TEMPLATES.filter((t) =>
      selectedTemplateIds.includes(t.id)
    );

    selected.forEach((tpl) => {
      createHabit({
        name: tpl.name,
        description: tpl.description,
        icon: tpl.icon,
        color: tpl.color,
        frequency_type: tpl.frequency_type,
        scheduled_days: tpl.scheduled_days,
        reminder_enabled: true,
        reminder_time: tpl.defaultTime,
      });
    });

    setIsOnboardingModalOpen(false);
    triggerCelebration();
    showToast(`Added ${selected.length} starter habits to your routine!`, undefined, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 pb-2 text-center relative">
          <button
            onClick={() => setIsOnboardingModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <HabitUpLogo size="sm" showSubtitle={true} />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight font-display">
            Quick-Start Habits
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Pick from 8 proven foundational habits to build momentum:
          </p>
        </div>

        {/* 8 Template Habits Grid */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_START_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateIds.includes(tpl.id);
              return (
                <button
                  key={tpl.id}
                  onClick={() => toggleSelect(tpl.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-neutral-800 border-rose-500/60 shadow-md scale-[1.01]'
                      : 'bg-neutral-850/60 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: tpl.color }}
                  >
                    <IconRenderer name={tpl.icon} className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-white block truncate">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {tpl.description}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-neutral-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2.5">
          <button
            onClick={() => setIsOnboardingModalOpen(false)}
            className="flex-1 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs transition-colors"
          >
            Skip to Dashboard
          </button>

          <button
            onClick={handleStartWithTemplates}
            disabled={selectedTemplateIds.length === 0}
            className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span>Start with {selectedTemplateIds.length} Habits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
