import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useHabit } from '../../context/HabitContext';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';
import { PlantVisualizer } from './PlantVisualizer';
import { Sparkles, Sprout, ChevronRight } from 'lucide-react-native';

export const TodayProgressCard: React.FC = () => {
  const {
    habits,
    completions,
    selectedDate,
    theme,
    overallStats,
    setIsPlantGardenModalOpen,
  } = useHabit();

  const isDark = theme === 'dark';

  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');

  const scheduledToday = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateTime)
  );

  const completedToday = scheduledToday.filter((h) =>
    completions.some(
      (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === selectedDate
    )
  );

  const totalCount = scheduledToday.length;
  const completedCount = completedToday.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const plant = overallStats.plantStreak;
  const isPerfectDay = progressPercent === 100 && totalCount > 0;

  // SVG Circular Gauge
  const radius = 38;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#162032' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Stats Info */}
        <View style={styles.leftInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {selectedDate === new Date().toISOString().split('T')[0]
                ? "TODAY'S PROGRESS"
                : `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(selectedDateTime).toUpperCase()} PROGRESS`}
            </Text>
            {isPerfectDay && (
              <View style={styles.perfectBadge}>
                <Sparkles size={10} color="#10B981" />
                <Text style={styles.perfectText}>Perfect</Text>
              </View>
            )}
          </View>

          <View style={styles.countRow}>
            <Text style={[styles.countMain, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {completedCount}
              <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 20 }}>
                /{totalCount}
              </Text>
            </Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
          </View>

          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {totalCount === 0
              ? 'Ready to grow? 🌱 Add your first habit!'
              : totalCount - completedCount === 0
              ? 'All habits completed! 🌟'
              : `${totalCount - completedCount} habit${totalCount - completedCount === 1 ? '' : 's'} left`}
          </Text>

          {/* Plant Garden Button */}
          {plant && (
            <TouchableOpacity
              style={[
                styles.plantPill,
                {
                  backgroundColor: isDark ? 'rgba(6, 78, 59, 0.4)' : 'rgba(209, 250, 229, 0.8)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                },
              ]}
              onPress={() => setIsPlantGardenModalOpen(true)}
            >
              <Sprout size={12} color="#10B981" />
              <Text style={[styles.plantPillText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                {plant.stage.name} • Lvl {plant.stage.level}
              </Text>
              <ChevronRight size={12} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Circular Gauge with Plant */}
        <TouchableOpacity
          style={styles.gaugeContainer}
          onPress={() => setIsPlantGardenModalOpen(true)}
          activeOpacity={0.8}
        >
          <Svg width={90} height={90} viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <Circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={isDark ? '#1F293D' : '#F1F5F9'}
              strokeWidth={strokeWidth}
            />

            {/* Active Progress Circle */}
            <Circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>

          <View style={styles.plantCenter}>
            {plant ? (
              <PlantVisualizer
                stage={plant.stage}
                streak={plant.currentStreak}
                hydrationPercent={progressPercent}
                isWateredToday={completedCount > 0}
                size="sm"
                interactive={false}
              />
            ) : (
              <Sprout size={24} color="#10B981" />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  perfectText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  countMain: {
    fontSize: 28,
    fontWeight: '900',
  },
  percentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  plantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  plantPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gaugeContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plantCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
