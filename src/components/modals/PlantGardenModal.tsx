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
  STREAK_REALMS,
  getActiveRealmProgress,
  StreakRealmId,
} from '../../utils/realmStreakData';
import { StreakRealmIllustration } from '../mobile/StreakRealmIllustration';
import {
  X,
  Check,
  Lock,
  Info,
  ArrowRight,
} from 'lucide-react-native';

export const PlantGardenModal: React.FC = () => {
  const {
    isPlantGardenModalOpen,
    setIsPlantGardenModalOpen,
    overallStats,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const plant = overallStats.plantStreak;

  const currentStreak = plant?.currentStreak || 0;
  const bestStreak = plant?.bestStreak || overallStats.bestAllTimeStreak || currentStreak || 0;
  const isWateredToday = plant?.isWateredToday || false;

  // Calculate user's naturally active realm
  const naturalProgress = getActiveRealmProgress(currentStreak);

  // Selected Realm state for previewing all 6 worlds
  const [selectedRealmId, setSelectedRealmId] = useState<StreakRealmId>(
    naturalProgress.activeRealm.id
  );
  // Selected Stage level for previewing
  const [selectedStageLevel, setSelectedStageLevel] = useState<number | null>(null);

  if (!isPlantGardenModalOpen) return null;

  const activeRealm =
    STREAK_REALMS.find((r) => r.id === selectedRealmId) ||
    naturalProgress.activeRealm;

  const activeStage =
    selectedStageLevel !== null
      ? activeRealm.stages.find((s) => s.level === selectedStageLevel) || activeRealm.stages[0]
      : selectedRealmId === naturalProgress.activeRealm.id
      ? naturalProgress.stage
      : activeRealm.stages[0];

  const isCurrentActiveRealm = activeRealm.id === naturalProgress.activeRealm.id;

  return (
    <Modal visible={isPlantGardenModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#0D1117' : '#FFFFFF' },
          ]}
        >
          {/* 1. Modal Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1C2128' : '#F1F5F9' }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.sproutBadgeCircle,
                  {
                    backgroundColor: `${activeRealm.primaryColor}18`,
                    borderColor: `${activeRealm.primaryColor}40`,
                  },
                ]}
              >
                <Text style={{ fontSize: 18 }}>{activeRealm.emoji}</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  numberOfLines={1}
                >
                  {activeRealm.name}
                </Text>
                <Text
                  style={[styles.headerSub, { color: isDark ? '#8B949E' : '#64748B' }]}
                  numberOfLines={1}
                >
                  {activeRealm.tagline}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsPlantGardenModalOpen(false)}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* 2. Top Realm Horizontal Switcher (6 Months Realms) */}
          <View
            style={[
              styles.realmSwitcherContainer,
              {
                backgroundColor: isDark ? '#0A0E17' : '#F8FAFC',
                borderBottomColor: isDark ? '#1E2633' : '#E2E8F0',
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.realmSwitcherContent}
            >
              {STREAK_REALMS.map((r) => {
                const isSelected = r.id === activeRealm.id;
                const isUnlocked = currentStreak >= r.requiredStreak;

                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.realmPill,
                      {
                        backgroundColor: isDark ? '#121824' : '#FFFFFF',
                        borderColor: isSelected
                          ? r.primaryColor
                          : isDark
                          ? '#1E2633'
                          : '#E2E8F0',
                      },
                      isSelected && {
                        backgroundColor: isDark
                          ? `${r.primaryColor}18`
                          : `${r.primaryColor}14`,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRealmId(r.id);
                      setSelectedStageLevel(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.realmPillEmoji}>{r.emoji}</Text>
                    <View>
                      <Text
                        style={[
                          styles.realmPillTitle,
                          {
                            color: isSelected
                              ? r.primaryColor
                              : isDark
                              ? '#E2E8F0'
                              : '#1E293B',
                          },
                        ]}
                      >
                        {r.name}
                      </Text>
                      <Text style={[styles.realmPillSub, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                        Month {r.monthNumber} ({r.requiredStreak}d+)
                      </Text>
                    </View>

                    {!isUnlocked && (
                      <Lock size={12} color={isDark ? '#64748B' : '#94A3B8'} style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* 3. Main Hero Visualizer Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark
                    ? activeRealm.bgColor
                    : activeRealm.lightBgColor || '#F0FDF4',
                  borderColor: isDark
                    ? `${activeRealm.primaryColor}30`
                    : `${activeRealm.primaryColor}45`,
                },
              ]}
            >
              {/* Clean Single Thin Circle Portal Outline */}
              <View
                style={[
                  styles.glowRingOuter,
                  {
                    borderColor: isDark
                      ? `${activeRealm.primaryColor}22`
                      : `${activeRealm.primaryColor}35`,
                  },
                ]}
              />

              {/* Stage Pill */}
              <View
                style={[
                  styles.stagePill,
                  {
                    backgroundColor: isDark ? '#0F261C' : '#DCFCE7',
                    borderColor: isDark ? '#194935' : '#86EFAC',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stagePillText,
                    { color: isDark ? '#FFFFFF' : '#065F46' },
                  ]}
                >
                  Stage {activeStage.level} • {activeStage.name}
                </Text>
                <View
                  style={[
                    styles.stagePillDot,
                    { backgroundColor: activeRealm.primaryColor },
                  ]}
                />
              </View>

              {/* Animated Vector Mascot */}
              <View style={styles.plantContainer}>
                <StreakRealmIllustration
                  realmId={activeRealm.id}
                  level={activeStage.level}
                  isWateredToday={isWateredToday}
                  size="lg"
                  isAnimated={true}
                />
              </View>

              {/* Plant / Mascot Title & Lore Description */}
              <Text
                style={[
                  styles.plantHeroTitle,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
              >
                {activeStage.name}
              </Text>
              <Text
                style={[
                  styles.plantHeroDesc,
                  { color: isDark ? '#94A3B8' : '#475569' },
                ]}
              >
                {activeStage.description}
              </Text>

              {/* Current & Best Streak Cards */}
              <View style={styles.streakStatsRow}>
                <View
                  style={[
                    styles.streakStatBox,
                    {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.streakStatLabel, { color: isDark ? '#8B949E' : '#64748B' }]}>
                    CURRENT STREAK
                  </Text>
                  <View style={styles.streakStatValRow}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text
                      style={[
                        styles.streakNumWhite,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      {currentStreak} days
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.streakStatBox,
                    {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.streakStatLabel, { color: isDark ? '#8B949E' : '#64748B' }]}>
                    BEST STREAK
                  </Text>
                  <View style={styles.streakStatValRow}>
                    <Text style={styles.streakEmoji}>🏆</Text>
                    <Text
                      style={[
                        styles.streakNumGreen,
                        { color: activeRealm.primaryColor },
                      ]}
                    >
                      {bestStreak} days
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. EVOLUTION STAGES ROADMAP (Stages 1-6) */}
            <View style={styles.roadmapHeaderRow}>
              <Text
                style={[
                  styles.roadmapHeading,
                  { color: isDark ? '#E2E8F0' : '#0F172A' },
                ]}
              >
                {activeRealm.name.toUpperCase()} STAGES
              </Text>
              <Text style={[styles.roadmapSub, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                Tap to preview
              </Text>
            </View>

            <View style={styles.stagesList}>
              {activeRealm.stages.map((s) => {
                const fullStreakRequired = activeRealm.requiredStreak + s.minStreak;
                const isUnlocked = currentStreak >= fullStreakRequired;
                const isSelected = activeStage.level === s.level;
                const isThisCurrent =
                  isCurrentActiveRealm && naturalProgress.stage.level === s.level;

                return (
                  <TouchableOpacity
                    key={s.level}
                    style={[
                      styles.stageCard,
                      {
                        backgroundColor: isDark ? '#121820' : '#FFFFFF',
                        borderColor: isDark ? '#1E2633' : '#E2E8F0',
                      },
                      isSelected && [
                        styles.stageCardSelected,
                        {
                          borderColor: activeRealm.primaryColor,
                          backgroundColor: isDark
                            ? `${activeRealm.primaryColor}14`
                            : `${activeRealm.primaryColor}10`,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedStageLevel(s.level)}
                    activeOpacity={0.8}
                  >
                    {/* Stage Thumbnail */}
                    <View
                      style={[
                        styles.stageThumbnail,
                        {
                          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : '#F1F5F9',
                        },
                        isSelected && {
                          borderColor: `${activeRealm.primaryColor}40`,
                          borderWidth: 1,
                          backgroundColor: isDark
                            ? `${activeRealm.primaryColor}10`
                            : `${activeRealm.primaryColor}15`,
                        },
                      ]}
                    >
                      <StreakRealmIllustration
                        realmId={activeRealm.id}
                        level={s.level}
                        size="sm"
                        isAnimated={false}
                      />
                    </View>

                    {/* Stage Info */}
                    <View style={styles.stageInfoCol}>
                      <View style={styles.stageTitleRow}>
                        <Text
                          style={[
                            styles.stageNameText,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                          ]}
                        >
                          {s.name}
                        </Text>
                        {isThisCurrent && (
                          <View
                            style={[
                              styles.currentBadge,
                              { backgroundColor: activeRealm.primaryColor },
                            ]}
                          >
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.stageStreakReqText, { color: isDark ? '#8B949E' : '#64748B' }]}>
                        Requires {s.minStreak}d realm streak ({fullStreakRequired}d total)
                      </Text>
                    </View>

                    {/* Status Icon */}
                    <View style={styles.stageStatusCol}>
                      {isUnlocked ? (
                        <View
                          style={[
                            styles.checkCircle,
                            {
                              borderColor: activeRealm.primaryColor,
                              backgroundColor: `${activeRealm.primaryColor}15`,
                            },
                          ]}
                        >
                          <Check size={14} color={activeRealm.primaryColor} strokeWidth={2.5} />
                        </View>
                      ) : (
                        <Lock size={16} color={isDark ? '#6E7681' : '#94A3B8'} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. 30-Day Realm System Info Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#121820' : '#F8FAFC',
                  borderColor: isDark ? '#1E2633' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.infoHeaderRow}>
                <Info size={18} color="#0EA5E9" />
                <Text
                  style={[
                    styles.infoTitle,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  How 30-Day Monthly Realms Work
                </Text>
              </View>

              <View style={styles.infoBulletsList}>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDark ? '#94A3B8' : '#64748B' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Every 30-day streak milestone completes a realm and awards a permanent mastery trophy!
                  </Text>
                </View>

                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDark ? '#94A3B8' : '#64748B' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Month 1 unlocks 🌱 Living Garden, Month 2 awakens 🔥 Cosmic Flame, Month 3 hatches 🐉 Dragon Hatchery, and beyond.
                  </Text>
                </View>

                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: isDark ? '#94A3B8' : '#64748B' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    100% daily habit completion fuels your active mascot with life and unlocks new animations.
                  </Text>
                </View>
              </View>
            </View>

            {/* 6. Back to Habits CTA Button */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                { backgroundColor: activeRealm.primaryColor },
              ]}
              onPress={() => setIsPlantGardenModalOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaButtonText}>Back to Habits</Text>
              <ArrowRight size={18} color="#080E1A" strokeWidth={2.5} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    height: '88%',
    maxHeight: '92%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sproutBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realmSwitcherContainer: {
    borderBottomWidth: 1,
  },
  realmSwitcherContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  realmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
  },
  realmPillEmoji: {
    fontSize: 16,
  },
  realmPillTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  realmPillSub: {
    fontSize: 10,
  },
  bodyScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowRingOuter: {
    position: 'absolute',
    top: 45,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stagePillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  plantContainer: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  plantHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  plantHeroDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  streakStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  streakStatBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  streakStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakStatValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakNumWhite: {
    fontSize: 16,
    fontWeight: '900',
  },
  streakNumGreen: {
    fontSize: 16,
    fontWeight: '900',
  },
  roadmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  roadmapHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roadmapSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  stagesList: {
    gap: 10,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    gap: 14,
  },
  stageCardSelected: {
    borderWidth: 1.5,
  },
  stageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageInfoCol: {
    flex: 1,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#080E1A',
    fontSize: 9,
    fontWeight: '900',
  },
  stageStreakReqText: {
    fontSize: 12,
    marginTop: 3,
  },
  stageStatusCol: {
    paddingRight: 4,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoBulletsList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  ctaButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#080E1A',
    fontSize: 15,
    fontWeight: '900',
  },
});
