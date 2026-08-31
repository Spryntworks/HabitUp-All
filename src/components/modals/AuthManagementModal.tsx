import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  LogOut,
  MapPin,
  X,
} from 'lucide-react-native';

export const AuthManagementModal: React.FC = () => {
  const {
    isAuthSessionModalOpen,
    setIsAuthSessionModalOpen,
    user,
    sessions,
    revokeSession,
    revokeAllOtherSessions,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  if (!isAuthSessionModalOpen) return null;

  const getDeviceIcon = (devName: string) => {
    const l = devName.toLowerCase();
    if (l.includes('mac') || l.includes('pc') || l.includes('laptop')) {
      return <Laptop size={16} color="#38BDF8" />;
    }
    if (l.includes('tab') || l.includes('ipad')) {
      return <Tablet size={16} color="#C084FC" />;
    }
    return <Smartphone size={16} color="#7C5CFF" />;
  };

  return (
    <Modal visible={isAuthSessionModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <ShieldCheck size={18} color="#7C5CFF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Active Device Sessions
                </Text>
                <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  PRD Hardware Keychains & Auth
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsAuthSessionModalOpen(false)}
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.bodyScroll}>
            {/* Header Action */}
            <View style={styles.actionHeader}>
              <Text style={[styles.sessionSectionTitle, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                AUTHORIZED DEVICES ({sessions.length})
              </Text>
              <TouchableOpacity onPress={revokeAllOtherSessions}>
                <Text style={styles.revokeAllText}>Revoke Others</Text>
              </TouchableOpacity>
            </View>

            {/* Sessions List */}
            <View style={styles.sessionsList}>
              {sessions.map((sess) => {
                const isRevoked = Boolean(sess.revoked_at);
                return (
                  <View
                    key={sess.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: isDark ? '#162032' : '#F8FAFC',
                        borderColor: sess.is_current
                          ? '#7C5CFF'
                          : isDark
                          ? '#1E293B'
                          : '#E2E8F0',
                        opacity: isRevoked ? 0.4 : 1,
                      },
                    ]}
                  >
                    <View style={styles.deviceIconCircle}>
                      {getDeviceIcon(sess.device_name)}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.deviceName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                          {sess.device_name}
                        </Text>
                        {sess.is_current && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.ipRow}>
                        <MapPin size={10} color="#94A3B8" />
                        <Text style={[styles.ipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {sess.ip_address}
                        </Text>
                      </View>
                    </View>

                    {!sess.is_current && !isRevoked && (
                      <TouchableOpacity
                        style={styles.revokeBtn}
                        onPress={() => revokeSession(sess.id)}
                      >
                        <Text style={styles.revokeBtnText}>Revoke</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 30,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revokeAllText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '800',
  },
  currentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '900',
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ipText: {
    fontSize: 11,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  revokeBtnText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '700',
  },
});
