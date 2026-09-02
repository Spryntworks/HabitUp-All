import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { isHabitScheduledOnDate, formatTo12Hour } from '../../utils/streakCalculator';
import { notificationService } from '../../services/notificationService';
import {
  Bell,
  Clock,
  CheckCircle2,
  Volume2,
  X,
} from 'lucide-react-native';

export const NotificationCenterModal: React.FC = () => {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    habits,
    completions,
    selectedDate,
    theme,
    notificationsEnabled,
    setNotificationsEnabled,
    soundEnabled,
    setSoundEnabled,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);

  useEffect(() => {
    notificationService.checkPermission().then((granted) => {
      setPermissionGranted(granted);
    });
  }, [isNotificationModalOpen]);

  if (!isNotificationModalOpen) return null;

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const todayHabits = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateTime)
  );

  const handleAllowNotifications = async () => {
    setNotificationsEnabled(true);
    showToast('Notifications enabled!', undefined, 'success');
    try {
      await notificationService.requestPermission();
    } catch {}
  };

  return (
    <Modal visible={isNotificationModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#080E1A' : '#FFFFFF' },
          ]}
        >
          {/* Header matching Image 1 & 2 */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Bell size={18} color="#C084FC" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Notification Center
                </Text>
                <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Habit reminders & alerts
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsNotificationModalOpen(false)}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Preferences Card: Habit Reminders & Sound */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#131C2E' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              {/* Habit Reminders Toggle */}
              <View style={styles.preferenceRow}>
                <View>
                  <Text style={[styles.prefName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Habit Reminders
                  </Text>
                  <Text style={[styles.prefDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Send alerts at scheduled times
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(val) => {
                    setNotificationsEnabled(val);
                    if (val && !permissionGranted) {
                      handleAllowNotifications();
                    }
                  }}
                  trackColor={{ false: isDark ? '#475569' : '#CBD5E1', true: '#7C5CFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

              {/* Notification Sound Toggle */}
              <View style={styles.preferenceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Volume2 size={18} color="#10B981" />
                  <View>
                    <Text style={[styles.prefName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      Notification Sound
                    </Text>
                    <Text style={[styles.prefDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Play melodic chime on reminder
                    </Text>
                  </View>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: isDark ? '#475569' : '#CBD5E1', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Section: TODAY'S HABIT TIMES */}
            <Text style={[styles.sectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              TODAY'S HABIT TIMES ({todayHabits.length})
            </Text>

            <View style={styles.habitsTimesList}>
              {todayHabits.map((h, idx) => {
                const isDone = completions.some(
                  (c) => c.habit_id === h.id && c.completion_date === selectedDate
                );
                const habitTime = h.reminder_time || (idx === 0 ? '07:00' : '08:00');

                return (
                  <View
                    key={h.id}
                    style={[
                      styles.habitTimeCard,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    {/* Left Icon */}
                    <View
                      style={[
                        styles.habitTimeIconBox,
                        { backgroundColor: h.color || '#7C5CFF' },
                      ]}
                    >
                      <IconRenderer name={h.icon} size={18} color="#FFFFFF" />
                    </View>

                    {/* Middle Info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.habitTimeName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                          {h.name}
                        </Text>
                        {isDone && (
                          <View style={styles.doneBadge}>
                            <CheckCircle2 size={12} color="#10B981" />
                            <Text style={styles.doneBadgeText}>Done</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.timeRow}>
                        <Clock size={12} color="#C084FC" />
                        <Text style={styles.timeRowText}>
                          {h.name} Time: {formatTo12Hour(habitTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {todayHabits.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    No habits configured for today yet.
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Done Button */}
            <TouchableOpacity
              style={styles.bottomDoneBtn}
              onPress={() => setIsNotificationModalOpen(false)}
            >
              <Text style={styles.bottomDoneBtnText}>Done</Text>
            </TouchableOpacity>
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
    height: '88%',
    maxHeight: '92%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
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
    gap: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 36,
  },
  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefName: {
    fontSize: 14,
    fontWeight: '800',
  },
  prefDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  habitsTimesList: {
    gap: 10,
    marginBottom: 20,
  },
  habitTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  habitTimeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTimeName: {
    fontSize: 14,
    fontWeight: '800',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  doneBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timeRowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  bottomDoneBtn: {
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
