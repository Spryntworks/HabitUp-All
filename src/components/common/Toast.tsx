import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { RotateCcw, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useHabit();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/95 dark:bg-neutral-800/95 text-white shadow-2xl border border-neutral-700/60 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <p className="text-xs font-semibold text-neutral-100 truncate">
              {toast.message}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  clearToast();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Undo
              </button>
            )}
            <button
              onClick={clearToast}
              className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
