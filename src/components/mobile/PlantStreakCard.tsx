import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { getActiveRealmProgress } from '../../utils/realmStreakData';
import { StreakRealmIllustration } from './StreakRealmIllustration';
import { Droplets, Sparkles, ChevronRight } from 'lucide-react-native';

interface PlantStreakCardProps {
  compact?: boolean;
}

export const PlantStreakCard: React.FC<PlantStreakCardProps> = ({ compact = false }) => {
  const { overallStats, setIsPlantGardenModalOpen, theme } = useHabit();
  const plant = overallStats.plantStreak;
  const isDark = theme === 'dark';

  if (!plant) return null;

  const {
    currentStreak,
    isWateredToday,
    waterDropsToday,
    totalWaterDropsNeeded,
    hydrationPercent,
  } = plant;

  // Active monthly realm
  const { activeRealm, stage } = getActiveRealmProgress(currentStreak);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? activeRealm.bgColor
            : activeRealm.lightBgColor || '#FFFFFF',
          borderColor: isDark
            ? `${activeRealm.primaryColor}30`
            : `${activeRealm.primaryColor}40`,
        },
      ]}
      onPress={() => setIsPlantGardenModalOpen(true)}
      activeOpacity={0.85}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <View
            style={[
              styles.plantTag,
              {
                backgroundColor: isDark
                  ? `${activeRealm.primaryColor}20`
                  : `${activeRealm.primaryColor}15`,
              },
            ]}
          >
            <Text style={{ fontSize: 12 }}>{activeRealm.emoji}</Text>
            <Text
              style={[
                styles.plantTagText,
                { color: isDark ? activeRealm.primaryColor : '#065F46' },
              ]}
            >
              {activeRealm.name}
            </Text>
          </View>
          {isWateredToday ? (
            <View style={styles.wateredTag}>
              <Sparkles size={10} color="#F59E0B" />
              <Text style={styles.wateredTagText}>Watered!</Text>
            </View>
          ) : (
            <View style={styles.needsWaterTag}>
              <Droplets size={10} color="#38BDF8" fill="#38BDF8" />
              <Text style={styles.needsWaterTagText}>Needs Water</Text>
            </View>
          )}
        </View>

        <View style={styles.gardenLink}>
          <Text style={[styles.gardenLinkText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Realms
          </Text>
          <ChevronRight size={14} color={isDark ? '#94A3B8' : '#64748B'} />
        </View>
      </View>

      {/* Main Body */}
      <View style={styles.bodyRow}>
        <View style={styles.infoCol}>
          <View style={styles.streakCountRow}>
            <Text style={[styles.streakNumber, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Day Overall Streak
            </Text>
          </View>

          <Text style={[styles.stageTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {stage.name} •{' '}
            <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Level {stage.level} of 6
            </Text>
          </Text>

          <Text
            style={[styles.hintText, { color: isDark ? '#94A3B8' : '#64748B' }]}
            numberOfLines={1}
          >
            {isWateredToday
              ? '✨ Mascot fueled! Keep up momentum!'
              : `Complete habits today to power up (${waterDropsToday}/${totalWaterDropsNeeded})`}
          </Text>
        </View>

        <View style={styles.plantCol}>
          <StreakRealmIllustration
            realmId={activeRealm.id}
            level={stage.level}
            hydrationPercent={hydrationPercent}
            isWateredToday={isWateredToday}
            size="md"
            isAnimated={true}
          />
        </View>
      </View>

      {/* Hydration / Energy Bar */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(100, hydrationPercent)}%`,
              backgroundColor: isWateredToday ? activeRealm.primaryColor : '#38BDF8',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  plantTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  wateredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wateredTagText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  needsWaterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  needsWaterTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  gardenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gardenLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 11,
    marginTop: 2,
  },
  plantCol: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
