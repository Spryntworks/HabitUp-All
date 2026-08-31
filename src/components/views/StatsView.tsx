import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { formatDateKey, isHabitScheduledOnDate } from '../../utils/streakCalculator';
import { ChevronLeft, Flame, Trophy, CheckCircle2, TrendingUp } from 'lucide-react-native';

export const StatsView: React.FC = () => {
  const {
    habits,
    completions,
    getHabitStats,
    overallStats,
    setSelectedHabitForDetail,
    setActiveTab,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const analytics = useMemo(() => {
    const activeHabits = habits.filter(
      (h) => !h.archived_at && !h.deleted_at && !h.paused_at
    );

    let chartTitle = 'Weekly Activity';
    let donutLabel = 'Weekly Rate';
    let checkInsLabel = 'Week Check-ins';
    let streakLabel = 'Active Streak';
    let bars: {
      label: string;
      subLabel?: string;
      completedCount: number;
      totalDue: number;
      percent: number;
    }[] = [];

    let periodCompletionsCount = 0;
    let periodScheduledTotal = 0;
    let periodCompletedTotal = 0;
    let periodBestStreak = 0;

    const completionLookup = new Set<string>();
    completions.forEach((c) => {
      const dKey = (c.completion_date || '').split('T')[0];
      if (dKey) {
        completionLookup.add(`${c.habit_id}_${dKey}`);
      }
    });

    if (timeRange === 'week') {
      chartTitle = 'Weekly Activity (Daily)';
      donutLabel = 'Week Rate';
      checkInsLabel = 'Week Check-ins';
      streakLabel = 'Active Streak';

      const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon..6=Sun
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dStr = formatDateKey(d);

        let due = 0;
        let done = 0;

        activeHabits.forEach((h) => {
          if (isHabitScheduledOnDate(h, d)) {
            due++;
            if (completionLookup.has(`${h.id}_${dStr}`)) {
              done++;
            }
          }
        });

        periodScheduledTotal += due;
        periodCompletedTotal += done;

        completions.forEach((c) => {
          const cDate = (c.completion_date || '').split('T')[0];
          if (cDate === dStr) {
            periodCompletionsCount++;
          }
        });

        const percent = due > 0 ? Math.round((done / due) * 100) : 0;
        bars.push({
          label: dayLabels[i],
          completedCount: done,
          totalDue: due,
          percent,
        });
      }

      periodBestStreak = overallStats.currentBestStreak || 0;
    } else if (timeRange === 'month') {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      chartTitle = `${monthNames[currentMonth]} Activity (Weeks)`;
      donutLabel = 'Month Rate';
      checkInsLabel = 'Month Check-ins';
      streakLabel = 'Best Streak';

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const buckets: { start: number; end: number; label: string }[] = [
        { start: 1, end: 7, label: 'W1' },
        { start: 8, end: 14, label: 'W2' },
        { start: 15, end: 21, label: 'W3' },
        { start: 22, end: 28, label: 'W4' },
      ];
      if (daysInMonth > 28) {
        buckets.push({ start: 29, end: daysInMonth, label: 'W5' });
      }

      buckets.forEach((b) => {
        let bucketDue = 0;
        let bucketDone = 0;

        for (let day = b.start; day <= b.end; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dStr = formatDateKey(d);

          activeHabits.forEach((h) => {
            if (isHabitScheduledOnDate(h, d)) {
              bucketDue++;
              if (completionLookup.has(`${h.id}_${dStr}`)) {
                bucketDone++;
              }
            }
          });
        }

        periodScheduledTotal += bucketDue;
        periodCompletedTotal += bucketDone;

        const percent = bucketDue > 0 ? Math.round((bucketDone / bucketDue) * 100) : 0;
        bars.push({
          label: b.label,
          subLabel: `${b.start}-${b.end}`,
          completedCount: bucketDone,
          totalDue: bucketDue,
          percent,
        });
      });

      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      completions.forEach((c) => {
        const cDate = (c.completion_date || '').split('T')[0];
        if (cDate && cDate.startsWith(monthPrefix)) {
          periodCompletionsCount++;
        }
      });

      periodBestStreak = overallStats.currentBestStreak || 0;
    } else if (timeRange === 'year') {
      chartTitle = `${currentYear} Yearly Activity (Months)`;
      donutLabel = 'Year Rate';
      checkInsLabel = 'Year Check-ins';
      streakLabel = 'All-Time Best';

      const monthShortNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      for (let m = 0; m < 12; m++) {
        const daysInM = new Date(currentYear, m + 1, 0).getDate();
        let monthDue = 0;
        let monthDone = 0;

        for (let day = 1; day <= daysInM; day++) {
          const d = new Date(currentYear, m, day);
          const dStr = formatDateKey(d);

          activeHabits.forEach((h) => {
            if (isHabitScheduledOnDate(h, d)) {
              monthDue++;
              if (completionLookup.has(`${h.id}_${dStr}`)) {
                monthDone++;
              }
            }
          });
        }

        periodScheduledTotal += monthDue;
        periodCompletedTotal += monthDone;

        const percent = monthDue > 0 ? Math.round((monthDone / monthDue) * 100) : 0;
        bars.push({
          label: monthShortNames[m],
          completedCount: monthDone,
          totalDue: monthDue,
          percent,
        });
      }

      const yearPrefix = `${currentYear}-`;
      completions.forEach((c) => {
        const cDate = (c.completion_date || '').split('T')[0];
        if (cDate && cDate.startsWith(yearPrefix)) {
          periodCompletionsCount++;
        }
      });

      periodBestStreak = overallStats.bestAllTimeStreak || 0;
    }

    const overallSuccessRate =
      periodScheduledTotal > 0
        ? Math.round((periodCompletedTotal / periodScheduledTotal) * 100)
        : periodCompletedTotal > 0
        ? 100
        : 0;

    const habitBreakdown = activeHabits.map((h) => {
      let hDue = 0;
      let hDone = 0;

      if (timeRange === 'week') {
        const dayOfWeek = (now.getDay() + 6) % 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dStr = formatDateKey(d);
          if (isHabitScheduledOnDate(h, d)) {
            hDue++;
            if (completionLookup.has(`${h.id}_${dStr}`)) hDone++;
          }
        }
      } else if (timeRange === 'month') {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dStr = formatDateKey(d);
          if (isHabitScheduledOnDate(h, d)) {
            hDue++;
            if (completionLookup.has(`${h.id}_${dStr}`)) hDone++;
          }
        }
      } else if (timeRange === 'year') {
        for (let m = 0; m < 12; m++) {
          const daysInM = new Date(currentYear, m + 1, 0).getDate();
          for (let day = 1; day <= daysInM; day++) {
            const d = new Date(currentYear, m, day);
            const dStr = formatDateKey(d);
            if (isHabitScheduledOnDate(h, d)) {
              hDue++;
              if (completionLookup.has(`${h.id}_${dStr}`)) hDone++;
            }
          }
        }
      }

      const rate = hDue > 0 ? Math.round((hDone / hDue) * 100) : hDone > 0 ? 100 : 0;
      const stats = getHabitStats(h.id);

      return {
        habit: h,
        name: h.name,
        icon: h.icon,
        color: h.color || '#FF5A79',
        rate,
        streak: stats.currentStreak || 0,
      };
    });

    return {
      chartTitle,
      donutLabel,
      checkInsLabel,
      streakLabel,
      bars,
      periodCompletionsCount,
      periodBestStreak,
      overallSuccessRate,
      habitBreakdown,
    };
  }, [habits, completions, timeRange, overallStats, getHabitStats]);

  // Donut Gauge math
  const radius = 48;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (analytics.overallSuccessRate / 100) * circumference;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Header with Back Button: [ < ] Statistics */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? '#162032' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={isDark ? '#E2E8F0' : '#0F172A'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Statistics
        </Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Time Range Tabs */}
      <View style={[styles.tabs, { backgroundColor: isDark ? '#162032' : '#E2E8F0' }]}>
        {(['week', 'month', 'year'] as const).map((r) => {
          const isActive = timeRange === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.tabBtn, isActive && { backgroundColor: '#7C5CFF' }]}
              onPress={() => setTimeRange(r)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Donut Gauge Overview Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#162032' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.overviewRow}>
          {/* Circular Donut Gauge */}
          <View style={styles.donutContainer}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={isDark ? '#1E293B' : '#F1F5F9'}
                strokeWidth={strokeWidth}
              />
              <Circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#7C5CFF"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </Svg>
            <View style={styles.donutCenter}>
              <Text
                style={[styles.donutPercent, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              >
                {analytics.overallSuccessRate}%
              </Text>
              <Text
                style={[styles.donutLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}
              >
                {analytics.donutLabel}
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsCol}>
            <View style={styles.metricItem}>
              <Text
                style={[styles.metricLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}
              >
                {analytics.checkInsLabel}
              </Text>
              <Text
                style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              >
                {analytics.periodCompletionsCount}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text
                style={[styles.metricLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}
              >
                {analytics.streakLabel}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={18} color="#F59E0B" fill="#F59E0B" />
                <Text
                  style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                >
                  {analytics.periodBestStreak}{' '}
                  <Text style={{ fontSize: 13 }}>days</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Dynamic Activity Breakdown Card (Week, Month, Year) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#162032' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {analytics.chartTitle}
          </Text>
        </View>

        <View style={styles.barChartRow}>
          {analytics.bars.map((item, idx) => {
            return (
              <View key={idx} style={styles.barCol}>
                <View
                  style={[
                    styles.barTrack,
                    {
                      width: timeRange === 'year' ? 12 : 16,
                      backgroundColor: isDark ? '#0F172A' : '#E2E8F0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(8, item.percent)}%`,
                        backgroundColor:
                          item.percent === 100
                            ? '#10B981'
                            : item.percent > 0
                            ? '#7C5CFF'
                            : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barDayText,
                    {
                      fontSize: timeRange === 'year' ? 9 : 10,
                      color: isDark ? '#94A3B8' : '#64748B',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Individual Habits Performance */}
      <View style={styles.habitsSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Habits Breakdown ({timeRange.toUpperCase()})
        </Text>

        {analytics.habitBreakdown.map((item) => (
          <TouchableOpacity
            key={item.habit.id}
            style={[
              styles.habitRowCard,
              {
                backgroundColor: isDark ? '#162032' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
            onPress={() => setSelectedHabitForDetail(item.habit)}
          >
            <View style={[styles.habitIconCircle, { backgroundColor: item.color }]}>
              <IconRenderer name={item.icon} size={18} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.habitName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {item.name}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.rate}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.rateBadge}>
              <Text style={[styles.rateText, { color: item.color }]}>
                {item.rate}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  donutContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPercent: {
    fontSize: 22,
    fontWeight: '900',
  },
  donutLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricsCol: {
    gap: 14,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  barChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 6,
  },
  barCol: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 75,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  habitsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  habitRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  habitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitName: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  rateBadge: {
    paddingHorizontal: 8,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
