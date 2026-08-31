import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Fingerprint, CheckCircle2, ShieldCheck, X } from 'lucide-react-native';

export const BiometricScanModal: React.FC = () => {
  const {
    isBiometricModalOpen,
    setIsBiometricModalOpen,
    biometricLogin,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [scanState, setScanState] = useState<'scanning' | 'success'>('scanning');

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
        showToast('Biometric verified. Welcome back!', undefined, 'success');
      }, 700);
      return () => clearTimeout(completeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isBiometricModalOpen]);

  if (!isBiometricModalOpen) return null;

  return (
    <Modal visible={isBiometricModalOpen} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsBiometricModalOpen(false)}
          >
            <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            {scanState === 'success' ? (
              <CheckCircle2 size={40} color="#10B981" />
            ) : (
              <Fingerprint size={40} color="#7C5CFF" />
            )}
          </View>

          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {scanState === 'success' ? 'Authenticated' : 'Touch Biometric Sensor'}
          </Text>

          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {scanState === 'success'
              ? 'Logging in to your account...'
              : 'Hold your finger on the biometric sensor'}
          </Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <ShieldCheck size={14} color="#10B981" />
            <Text style={[styles.badgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Secure Enclave Protected
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
