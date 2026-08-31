import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Circle,
} from 'react-native-svg';
import { useHabit } from '../../context/HabitContext';
import { PlantStreakCard } from '../mobile/PlantStreakCard';
import { Flame, Trophy, CheckCircle2, Zap, ChevronLeft } from 'lucide-react-native';

export const StreaksView: React.FC = () => {
  const { overallStats, setActiveTab, theme } = useHabit();
  const isDark = theme === 'dark';

  const plant = overallStats.plantStreak;
  const currentStreak = Math.max(plant?.currentStreak ?? 0, overallStats.currentBestStreak ?? 0);
  const bestStreak = Math.max(plant?.bestStreak ?? 0, overallStats.bestAllTimeStreak ?? 0);
  const totalCompletions = overallStats.totalCompletionsCount || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Header with Back Button: [ < ] Streaks & Momentum */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={[
            styles.backButton,
            { backgroundColor: isDark ? '#162032' : '#FFFFFF', borderColor: isDark ? '#1E293B' : '#E2E8F0' },
          ]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={isDark ? '#E2E8F0' : '#0F172A'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Streaks & Momentum
        </Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Hero Flame Mascot */}
      <View style={styles.heroFlameBox}>
        <Svg width={120} height={120} viewBox="0 0 160 160">
          <Defs>
            <LinearGradient id="flameMain" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFA07A" />
              <Stop offset="40%" stopColor="#FF6347" />
              <Stop offset="100%" stopColor="#DC2626" />
            </LinearGradient>
            <LinearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="50%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor="#F97316" />
            </LinearGradient>
          </Defs>

          {/* Outer Flame */}
          <Path
            d="M80 15C80 15 105 50 105 75C105 85 100 95 95 100C110 90 120 110 120 125C120 145 100 155 80 155C60 155 40 145 40 125C40 105 60 90 60 70C60 55 70 30 80 15Z"
            fill="url(#flameMain)"
          />
          {/* Inner Flame */}
          <Path
            d="M80 65C80 65 95 85 95 105C95 120 88 135 80 145C72 135 65 120 65 105C65 85 80 65 80 65Z"
            fill="url(#flameInner)"
          />
          {/* Flame Face */}
          <Circle cx="73" cy="115" r="3" fill="#1F2937" />
          <Circle cx="74" cy="113.5" r="1" fill="#FFFFFF" />
          <Circle cx="87" cy="115" r="3" fill="#1F2937" />
          <Circle cx="88" cy="113.5" r="1" fill="#FFFFFF" />
        </Svg>

        <Text style={[styles.streakHeroNumber, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          {currentStreak}
        </Text>
        <Text style={[styles.streakHeroUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          DAY STREAK
        </Text>
      </View>

      {/* Living Plant Garden Streak Card */}
      <PlantStreakCard />

      {/* Milestones & Summary Cards */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? '#162032' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.metricIconCircle}>
            <Trophy size={18} color="#10B981" />
          </View>
          <Text style={[styles.metricLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Longest Streak
          </Text>
          <Text style={[styles.metricNumber, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {bestStreak} <Text style={{ fontSize: 13 }}>days</Text>
          </Text>
        </View>

        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: isDark ? '#162032' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.metricIconCircle}>
            <CheckCircle2 size={18} color="#38BDF8" />
          </View>
          <Text style={[styles.metricLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Total Check-ins
          </Text>
          <Text style={[styles.metricNumber, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {totalCompletions}
          </Text>
        </View>
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
    paddingBottom: 4,
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
  heroFlameBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  streakHeroNumber: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: -1,
  },
  streakHeroUnit: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 6,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
});
