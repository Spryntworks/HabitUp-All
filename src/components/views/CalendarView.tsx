import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  Calendar as CalendarIcon,
  Check,
  Plus,
  X,
} from 'lucide-react-native';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const CalendarView: React.FC = () => {
  const {
    habits,
    completions,
    toggleCompletion,
    setActiveTab,
    setIsCreateModalOpen,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const activeHabits = habits.filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const todayKey = formatDateKey(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>(todayKey);
  const [showQuickLogModal, setShowQuickLogModal] = useState<boolean>(false);

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

  const selectedDateObj = new Date(selectedCalendarDay + 'T12:00:00');
  const formattedSelectedHeader = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(selectedDateObj);

  const isSelectedToday = selectedCalendarDay === todayKey;

  // Habits scheduled on the selected day
  const displayHabitsForDay = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateObj)
  );

  const completedHabitsForDay = displayHabitsForDay.filter((h) =>
    completions.some(
      (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === selectedCalendarDay
    )
  );

  const totalDayCount = displayHabitsForDay.length;
  const completedDayCount = completedHabitsForDay.length;
  const dayProgressPercent =
    totalDayCount > 0 ? Math.round((completedDayCount / totalDayCount) * 100) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Header: [ < ] Calendar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={isDark ? '#E2E8F0' : '#0F172A'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Calendar
        </Text>

        <View style={{ width: 34 }} />
      </View>

      {/* Month Navigator Header */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          style={[styles.monthNavBtn, { backgroundColor: isDark ? '#131C2E' : '#F1F5F9' }]}
        >
          <ChevronLeft size={18} color={isDark ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <CalendarIcon size={18} color="#7C5CFF" />
          <Text style={[styles.monthTitleText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {monthName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => changeMonth(1)}
          style={[styles.monthNavBtn, { backgroundColor: isDark ? '#131C2E' : '#F1F5F9' }]}
        >
          <ChevronRight size={18} color={isDark ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={[styles.dayLabelText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Matrix Nodes Grid matching Image 3, 4 & Partial split */}
      <View style={styles.calGrid}>
        {daysInMonth.map((item, index) => {
          if (!item) {
            return <View key={`empty-${index}`} style={styles.calNodeWrapper} />;
          }

          const scheduledForDay = activeHabits.filter((h) =>
            isHabitScheduledOnDate(h, item.date)
          );
          const doneForDay = scheduledForDay.filter((h) =>
            completions.some(
              (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === item.key
            )
          );

          const isCurrentToday = item.key === todayKey;
          const isSelected = item.key === selectedCalendarDay;
          const isPast = item.key < todayKey;
          const totalDue = scheduledForDay.length;
          const doneCount = doneForDay.length;

          let nodeType: 'completed' | 'partial' | 'missed' | 'pending' = 'pending';
          if (item.isCurrentMonth && totalDue > 0) {
            if (doneCount === totalDue) {
              nodeType = 'completed';
            } else if (doneCount > 0) {
              nodeType = 'partial';
            } else if (isPast) {
              nodeType = 'missed';
            }
          }

          const nodeTextColor = !item.isCurrentMonth
            ? isDark
              ? '#475569'
              : '#94A3B8'
            : nodeType === 'completed' || nodeType === 'missed' || nodeType === 'partial'
            ? '#FFFFFF'
            : isCurrentToday
            ? isDark
              ? '#FFFFFF'
              : '#7C5CFF'
            : isDark
            ? '#FFFFFF'
            : '#0F172A';

          if (nodeType === 'partial') {
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => setSelectedCalendarDay(item.key)}
                style={[
                  styles.calNodeWrapper,
                  isCurrentToday && [
                    styles.todayRing,
                    { backgroundColor: isDark ? '#131C2E' : '#F5F3FF' },
                  ],
                  isSelected && !isCurrentToday && styles.selectedRing,
                ]}
              >
                <LinearGradient
                  colors={['#22D3A8', '#22D3A8', '#FF4D6D', '#FF4D6D']}
                  locations={[0, 0.5, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.calNode, styles.nodePartial]}
                >
                  <Text style={[styles.calNodeText, { color: '#FFFFFF', fontWeight: '900' }]}>
                    {item.dayNumber}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={[
                styles.calNodeWrapper,
                isCurrentToday && [
                  styles.todayRing,
                  { backgroundColor: isDark ? '#131C2E' : '#F5F3FF' },
                ],
                isSelected && !isCurrentToday && styles.selectedRing,
              ]}
              onPress={() => setSelectedCalendarDay(item.key)}
            >
              <View
                style={[
                  styles.calNode,
                  !item.isCurrentMonth && {
                    backgroundColor: 'transparent',
                  },
                  item.isCurrentMonth && nodeType === 'completed' && styles.nodeCompleted,
                  item.isCurrentMonth && nodeType === 'missed' && styles.nodeMissed,
                  item.isCurrentMonth &&
                    nodeType === 'pending' && {
                      backgroundColor: isDark ? '#162032' : '#F1F5F9',
                    },
                ]}
              >
                <Text
                  style={[
                    styles.calNodeText,
                    {
                      color: nodeTextColor,
                      fontWeight:
                        nodeType !== 'pending' || isCurrentToday || isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.dayNumber}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend Row matching Image */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22D3A8' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Completed
          </Text>
        </View>

        <View style={styles.legendItem}>
          <LinearGradient
            colors={['#22D3A8', '#22D3A8', '#FF4D6D', '#FF4D6D']}
            locations={[0, 0.5, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.legendDot}
          />
          <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Partial
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF4D6D' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Missed
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? '#1E293B' : '#CBD5E1' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Pending
          </Text>
        </View>
      </View>

      {/* Selected Day Header Section */}
      <View style={styles.selectedDaySection}>
        <View style={styles.selectedDayHeader}>
          <Text style={[styles.selectedDayTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {formattedSelectedHeader}
          </Text>
          {isSelectedToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>

        <Text style={[styles.selectedDaySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {completedDayCount} of {totalDayCount} habits completed ({dayProgressPercent}%)
        </Text>

        {/* Progress Bar with Dynamic Color */}
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${dayProgressPercent}%`,
                backgroundColor:
                  dayProgressPercent === 100
                    ? '#22D3A8'
                    : dayProgressPercent > 0
                    ? '#F59E0B'
                    : '#FF4D6D',
              },
            ]}
          />
        </View>
      </View>

      {/* Habits List for Selected Day */}
      <View style={styles.habitsListContainer}>
        {displayHabitsForDay.map((habit) => {
          const isDone = completions.some(
            (c) => c.habit_id === habit.id && c.completion_date === selectedCalendarDay
          );

          return (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitItemCard,
                {
                  backgroundColor: isDone
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5'
                    : isDark
                    ? '#131C2E'
                    : '#FFFFFF',
                  borderColor: isDone
                    ? isDark
                      ? 'rgba(34, 211, 168, 0.4)'
                      : '#A7F3D0'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                },
              ]}
              onPress={() => toggleCompletion(habit.id, selectedCalendarDay)}
              activeOpacity={0.8}
            >
              <View style={styles.habitItemLeft}>
                <View
                  style={[
                    styles.habitIconBox,
                    { backgroundColor: habit.color || '#7C5CFF' },
                  ]}
                >
                  <IconRenderer name={habit.icon} size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.habitItemName,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {habit.name}
                  </Text>
                  <Text style={[styles.habitItemFreq, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {habit.frequency_type === 'daily' ? 'Daily' : 'Scheduled'}
                  </Text>
                </View>
              </View>

              {/* Right Circular Checkbox */}
              <TouchableOpacity
                style={[
                  styles.checkboxCircle,
                  isDone
                    ? styles.checkboxChecked
                    : [
                        styles.checkboxUnchecked,
                        { borderColor: isDark ? '#334155' : '#CBD5E1' },
                      ],
                ]}
                onPress={() => toggleCompletion(habit.id, selectedCalendarDay)}
              >
                {isDone && <Check size={14} color="#0B1120" strokeWidth={3} />}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {displayHabitsForDay.length === 0 && (
          <View style={styles.emptyDayBox}>
            <Text style={[styles.emptyDayText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              No habits scheduled for this day.
            </Text>
          </View>
        )}
      </View>

      {/* Bottom CTA Buttons Row matching Image */}
      <View style={styles.bottomCtaRow}>
        <TouchableOpacity
          style={styles.quickLogBtn}
          onPress={() => setShowQuickLogModal(true)}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.quickLogBtnText}>Quick Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.newHabitBtn,
            {
              backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#CBD5E1',
            },
          ]}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} color={isDark ? '#E2E8F0' : '#0F172A'} strokeWidth={2.5} />
          <Text style={[styles.newHabitBtnText, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>
            New Habit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Log Modal */}
      <Modal visible={showQuickLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? '#131C2E' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Quick Log ({selectedCalendarDay})
              </Text>
              <TouchableOpacity onPress={() => setShowQuickLogModal(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }}>
              {activeHabits.map((h) => {
                const isDone = completions.some(
                  (c) => c.habit_id === h.id && c.completion_date === selectedCalendarDay
                );

                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[
                      styles.quickLogItem,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => toggleCompletion(h.id, selectedCalendarDay)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={[
                          styles.quickLogIcon,
                          { backgroundColor: h.color || '#7C5CFF' },
                        ]}
                      >
                        <IconRenderer name={h.icon} size={16} color="#FFFFFF" />
                      </View>
                      <Text
                        style={[
                          styles.quickLogName,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                        ]}
                      >
                        {h.name}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkboxCircle,
                        isDone
                          ? styles.checkboxChecked
                          : [
                              styles.checkboxUnchecked,
                              { borderColor: isDark ? '#475569' : '#CBD5E1' },
                            ],
                      ]}
                    >
                      {isDone && <Check size={14} color="#0B1120" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowQuickLogModal(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dayLabelText: {
    fontSize: 11,
    fontWeight: '800',
    width: 38,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    gap: 6,
  },
  calNodeWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2.5,
    borderColor: '#7C5CFF',
  },
  selectedRing: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  calNode: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeCompleted: {
    backgroundColor: '#22D3A8',
  },
  nodeMissed: {
    backgroundColor: '#FF4D6D',
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  nodePartial: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeInactiveMonth: {
    opacity: 0.2,
  },
  calNodeText: {
    fontSize: 13,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
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
    overflow: 'hidden',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectedDaySection: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  todayBadge: {
    backgroundColor: '#7C5CFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  selectedDaySub: {
    fontSize: 12,
    marginTop: 4,
  },
  progressBarBg: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  habitsListContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  habitItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  habitItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitItemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  habitItemFreq: {
    fontSize: 11,
    marginTop: 2,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderWidth: 1.5,
  },
  checkboxChecked: {
    backgroundColor: '#22D3A8',
    shadowColor: '#22D3A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyDayBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 12,
  },
  bottomCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickLogBtn: {
    flex: 1.2,
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  quickLogBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  newHabitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  newHabitBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickLogIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogName: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 12,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
