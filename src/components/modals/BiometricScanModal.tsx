import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import { ScanFace, Fingerprint, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const BiometricScanModal: React.FC = () => {
  const {
    isBiometricModalOpen,
    setIsBiometricModalOpen,
    deviceFrame,
    biometricLogin,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [scanState, setScanState] = useState<'scanning' | 'success' | 'failed'>('scanning');

  useEffect(() => {
    if (!isBiometricModalOpen) {
      setScanState('scanning');
      return;
    }

    setScanState('scanning');
    const timer = setTimeout(() => {
      setScanState('success');
      const completeTimer = setTimeout(() => {
        biometricLogin();
        setIsBiometricModalOpen(false);
        showToast(
          deviceFrame === 'android' ? 'Fingerprint verified. Welcome back!' : 'Face ID verified. Welcome back!',
          undefined,
          'success'
        );
      }, 700);
      return () => clearTimeout(completeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isBiometricModalOpen, deviceFrame]);

  if (!isBiometricModalOpen) return null;

  const isIos = deviceFrame === 'iphone';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-xs text-center p-6 rounded-3xl shadow-2xl flex flex-col items-center border ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        <div className="w-full flex justify-end">
          <button
            onClick={() => setIsBiometricModalOpen(false)}
            className={`p-1 rounded-full ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Biometric Icon animation */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              scanState === 'success'
                ? 'bg-emerald-500/15 text-emerald-500 ring-4 ring-emerald-500/30'
                : 'bg-rose-500/15 text-rose-500 ring-4 ring-rose-500/30 animate-pulse'
            }`}
          >
            {scanState === 'success' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : isIos ? (
              <ScanFace className="w-10 h-10 text-rose-500 animate-bounce" />
            ) : (
              <Fingerprint className="w-10 h-10 text-rose-500 animate-pulse" />
            )}
          </div>
        </div>

        <h3 className={`text-base font-extrabold mb-1 font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {scanState === 'success'
            ? 'Authenticated'
            : isIos
            ? 'Face ID for HabitUp'
            : 'Touch Fingerprint Sensor'}
        </h3>

        <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {scanState === 'success'
            ? 'Logging in to your account...'
            : isIos
            ? 'Double click side button or look directly into front TrueDepth camera'
            : 'Hold your finger on the optical sensor area'}
        </p>

        <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1 rounded-full border ${isDark ? 'text-slate-400 bg-slate-800/60 border-slate-700/50' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Hardware Secure Enclave Protected
        </div>
      </motion.div>
    </div>
  );
};

