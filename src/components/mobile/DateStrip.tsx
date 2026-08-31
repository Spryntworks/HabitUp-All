import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { getWeekDays, formatDateKey } from '../../utils/streakCalculator';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export const DateStrip: React.FC = () => {
  const { selectedDate, setSelectedDate, completions, habits, theme } = useHabit();
  const isDark = theme === 'dark';

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const todayKey = formatDateKey(new Date());
  const weekDays = getWeekDays(selectedDateTime);

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const changeWeek = (offsetDays: number) => {
    const nextDate = new Date(selectedDateTime);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    setSelectedDate(formatDateKey(nextDate));
  };

  const jumpToToday = () => {
    setSelectedDate(todayKey);
  };

  const monthYearLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(selectedDateTime);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.monthGroup}>
          <Text style={[styles.monthText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {monthYearLabel}
          </Text>
          {selectedDate !== todayKey && (
            <TouchableOpacity onPress={jumpToToday} style={styles.todayPill}>
              <Text style={styles.todayPillText}>Back to Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.navGroup}>
          <TouchableOpacity onPress={() => changeWeek(-7)} style={styles.navBtn}>
            <ChevronLeft size={16} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeWeek(7)} style={styles.navBtn}>
            <ChevronRight size={16} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7 Days Row */}
      <View style={styles.daysRow}>
        {weekDays.map((item) => {
          const isSelected = item.key === selectedDate;
          const isToday = item.isToday;

          const dateCompletions = completions.filter(
            (c) => (c.completion_date || '').split('T')[0] === item.key
          );
          const hasCompletions = dateCompletions.length > 0;
          const isAllDone =
            activeHabits.length > 0 &&
            activeHabits.every((h) =>
              completions.some(
                (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === item.key
              )
            );

          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setSelectedDate(item.key)}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? '#7C5CFF'
                    : isToday
                    ? isDark
                      ? '#1E293B'
                      : '#EDE9FE'
                    : isDark
                    ? '#0F172A'
                    : '#FFFFFF',
                  borderColor: isSelected
                    ? '#7C5CFF'
                    : isToday
                    ? '#7C5CFF'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {item.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                      ? '#7C5CFF'
                      : isDark
                      ? '#F8FAFC'
                      : '#0F172A',
                  },
                ]}
              >
                {item.dayNumber}
              </Text>

              {/* Status indicator dot */}
              <View style={styles.dotContainer}>
                {isAllDone ? (
                  <View style={[styles.dot, { backgroundColor: isSelected ? '#FFFFFF' : '#10B981' }]} />
                ) : hasCompletions ? (
                  <View style={[styles.dot, { backgroundColor: isSelected ? '#FFFFFF' : '#F59E0B' }]} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayPill: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C5CFF',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    padding: 4,
    borderRadius: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  dotContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
