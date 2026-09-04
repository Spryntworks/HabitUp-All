import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import {
  getMonthCalendarDays,
  formatDateKey,
  isHabitScheduledOnDate,
} from '../../utils/streakCalculator';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Pause,
  Play,
  Archive,
  Trash2,
  X,
  Flame,
  Trophy,
  CheckCircle2,
  Bell,
  Zap,
} from 'lucide-react-native';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitDetailModal: React.FC = () => {
  const {
    selectedHabitForDetail,
    setSelectedHabitForDetail,
    completions,
    toggleCompletion,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    updateHabit,
    nudgeFriend,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!selectedHabitForDetail) return null;

  const habit = selectedHabitForDetail;
  const stats = getHabitStats(habit.id);
  const isPaused = Boolean(habit.paused_at);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getMonthCalendarDays(year, month);

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(calendarDate);

  const changeMonth = (offset: number) => {
    setCalendarDate(new Date(year, month + offset, 1));
  };

  const todayKey = formatDateKey(new Date());

  const handleStartEdit = () => {
    setEditName(habit.name);
    setEditDesc(habit.description || '');
    setShowOptionsMenu(false);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    updateHabit(habit.id, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setSelectedHabitForDetail({
      ...habit,
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setIsEditing(false);
  };

  return (
    <Modal visible={Boolean(selectedHabitForDetail)} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
            <TouchableOpacity
              onPress={() => setSelectedHabitForDetail(null)}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Habit Overview
            </Text>
            <TouchableOpacity
              onPress={() => setShowOptionsMenu(true)}
              style={[
                styles.moreBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <MoreHorizontal size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Habit Hero Pill */}
            <View style={styles.habitHeroRow}>
              <View
                style={[
                  styles.habitIconCircle,
                  { backgroundColor: habit.color || '#7C5CFF' },
                ]}
              >
                <IconRenderer name={habit.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {habit.name}
                </Text>
                <Text style={[styles.habitSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {habit.description || 'Daily consistent habit'}
                </Text>
              </View>
            </View>

            {/* Metrics */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                <Flame size={16} color="#F59E0B" />
                <Text style={[styles.statNum, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {stats.currentStreak}
                </Text>
                <Text style={[styles.statLbl, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Current
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                <Trophy size={16} color="#10B981" />
                <Text style={[styles.statNum, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {stats.longestStreak}
                </Text>
                <Text style={[styles.statLbl, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Best
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                <CheckCircle2 size={16} color="#38BDF8" />
                <Text style={[styles.statNum, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {stats.completionRate}%
                </Text>
                <Text style={[styles.statLbl, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Rate
                </Text>
              </View>
            </View>

            {/* Habit Buddy Progress Banner (If Shared Habit) */}
            {habit.is_shared && (
              <View
                style={[
                  styles.buddyDetailCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.buddyDetailHeader}>
                  <View style={styles.buddyDetailLeft}>
                    <Text style={styles.buddyDetailAvatar}>
                      {habit.buddy_avatar || '🤝'}
                    </Text>
                    <View>
                      <Text
                        style={[
                          styles.buddyDetailName,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                        ]}
                      >
                        Habit Buddy: {habit.buddy_name || 'Friend'}
                      </Text>
                      <Text
                        style={[
                          styles.buddyDetailSub,
                          { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}
                      >
                        Shared routine • Mutual progress active
                      </Text>
                    </View>
                  </View>
                  <View style={styles.buddyDetailStreak}>
                    <Flame size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.buddyDetailStreakText}>
                      {stats.currentStreak}d Streak
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.buddyNudgeBtn}
                  onPress={() => nudgeFriend(habit.buddy_id || 'friend-1', habit.name)}
                >
                  <Bell size={13} color="#F59E0B" />
                  <Text style={styles.buddyNudgeBtnText}>
                    👋 Send a Friendly Reminder / Cheer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Calendar */}
            <View
              style={[
                styles.calendarSection,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.calHeader}>
                <Text style={[styles.calMonthText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {monthName}
                </Text>
                <View style={styles.calNav}>
                  <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <ChevronLeft size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <ChevronRight size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((d, i) => (
                  <Text key={i} style={[styles.dayLabelText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.calGrid}>
                {daysInMonth.map((dayItem, idx) => {
                  if (!dayItem) {
                    return <View key={`empty-${idx}`} style={styles.cell} />;
                  }

                  const isDone = completions.some(
                    (c) => c.habit_id === habit.id && (c.completion_date || '').split('T')[0] === dayItem.key
                  );
                  const isToday = dayItem.key === todayKey;
                  const isPast = dayItem.key < todayKey;
                  const isScheduled = isHabitScheduledOnDate(habit, dayItem.date);

                  let cellBg = 'transparent';
                  let cellBorder = 'transparent';
                  let textColor = isDark ? '#94A3B8' : '#475569';
                  let fontWeight: '900' | '800' | '700' | '500' = '500';

                  if (isDone) {
                    // Completed 100% -> GREEN
                    cellBg = '#10B981';
                    textColor = '#FFFFFF';
                    fontWeight = '900';
                  } else if (isScheduled && (isPast || isToday)) {
                    // Otherwise not completed -> RED
                    cellBg = '#EF4444';
                    textColor = '#FFFFFF';
                    fontWeight = '900';
                  } else if (isToday) {
                    cellBorder = '#7C5CFF';
                    textColor = isDark ? '#FFFFFF' : '#7C5CFF';
                    fontWeight = '800';
                  }

                  return (
                    <TouchableOpacity
                      key={dayItem.key}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: cellBg,
                          borderColor: cellBorder,
                          borderWidth: cellBorder !== 'transparent' ? 1.5 : 0,
                        },
                      ]}
                      onPress={() => toggleCompletion(habit.id, dayItem.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          {
                            color: textColor,
                            fontWeight,
                          },
                        ]}
                      >
                        {dayItem.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Status Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Completed (100%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Not Completed
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Menu */}
          <Modal visible={showOptionsMenu} transparent animationType="fade">
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setShowOptionsMenu(false)}
            >
              <View style={[styles.menuBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <TouchableOpacity style={styles.menuItem} onPress={handleStartEdit}>
                  <Edit3 size={18} color="#38BDF8" />
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Edit Habit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    if (isPaused) resumeHabit(habit.id);
                    else pauseHabit(habit.id);
                  }}
                >
                  {isPaused ? <Play size={18} color="#34D399" /> : <Pause size={18} color="#FBBF24" />}
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {isPaused ? 'Resume Habit' : 'Pause Habit'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    archiveHabit(habit.id);
                    setSelectedHabitForDetail(null);
                  }}
                >
                  <Archive size={18} color="#C084FC" />
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Archive Habit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    deleteHabit(habit.id);
                    setSelectedHabitForDetail(null);
                  }}
                >
                  <Trash2 size={18} color="#F43F5E" />
                  <Text style={[styles.menuItemText, { color: '#F43F5E' }]}>
                    Delete Habit
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Edit Modal */}
          <Modal visible={isEditing} transparent animationType="slide">
            <View style={styles.menuOverlay}>
              <View style={[styles.editBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <View style={styles.editHeader}>
                  <Text style={[styles.editTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Edit Habit
                  </Text>
                  <TouchableOpacity onPress={() => setIsEditing(false)}>
                    <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Habit Name"
                />

                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Description"
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 30,
  },
  habitHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  habitIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  habitSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '700',
  },
  calendarSection: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calMonthText: {
    fontSize: 14,
    fontWeight: '800',
  },
  calNav: {
    flexDirection: 'row',
    gap: 4,
  },
  navBtn: {
    padding: 4,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayLabelText: {
    fontSize: 10,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 4,
  },
  cell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  menuBox: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  buddyDetailCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 14,
    gap: 10,
  },
  buddyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buddyDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  buddyDetailAvatar: {
    fontSize: 22,
  },
  buddyDetailName: {
    fontSize: 14,
    fontWeight: '800',
  },
  buddyDetailSub: {
    fontSize: 10,
    marginTop: 1,
  },
  buddyDetailStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  buddyDetailStreakText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  buddyNudgeBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  buddyNudgeBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
});
