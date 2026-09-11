import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { HomeHero } from '../mobile/HomeHero';
import { DateStrip } from '../mobile/DateStrip';
import { TodayProgressCard } from '../mobile/TodayProgressCard';
import { HabitCard } from '../mobile/HabitCard';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';
import { Plus, Sparkles, CheckCircle2, Check, Users } from 'lucide-react-native';

export const HomeView: React.FC = () => {
  const {
    habits,
    completions,
    selectedDate,
    theme,
    setIsCreateModalOpen,
    setIsOnboardingModalOpen,
    setIsPlantGardenModalOpen,
    incomingRequests,
    acceptFollowRequest,
    setActiveTab,
    user,
    syncFollowRequests,
    syncFriendsWithBackend,
  } = useHabit();

  const isDark = theme === 'dark';
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (user) {
        await Promise.all([
          syncFollowRequests(user),
          syncFriendsWithBackend(user),
        ]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedDateTime = new Date(selectedDate + 'T12:00:00');
  const activeHabits = habits.filter(
    (h) => !h.archived_at && !h.deleted_at && !h.paused_at
  );

  const scheduledHabits = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDateTime)
  );

  const filteredHabits = scheduledHabits.filter((h) => {
    const isDone = completions.some(
      (c) => c.habit_id === h.id && (c.completion_date || '').split('T')[0] === selectedDate
    );
    if (filterMode === 'pending') return !isDone;
    if (filterMode === 'completed') return isDone;
    return true;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#7C5CFF"
          colors={['#7C5CFF']}
        />
      }
    >
      <HomeHero onMascotClick={() => setIsPlantGardenModalOpen(true)} />
      <DateStrip />
      <TodayProgressCard />

      {/* Incoming Friend Request Alert Banner */}
      {incomingRequests && incomingRequests.length > 0 && (
        <TouchableOpacity
          style={[
            styles.incomingBanner,
            {
              backgroundColor: isDark ? 'rgba(124, 92, 255, 0.14)' : '#F0FDF4',
              borderColor: isDark ? 'rgba(124, 92, 255, 0.4)' : '#86EFAC',
            },
          ]}
          onPress={() => setActiveTab('friends')}
          activeOpacity={0.85}
        >
          <View style={styles.incomingBannerLeft}>
            <View style={[styles.incomingAvatarBadge, { backgroundColor: isDark ? '#2D1B69' : '#DCFCE7' }]}>
              <Text style={{ fontSize: 18 }}>{incomingRequests[0].fromAvatar || '🤝'}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.incomingBannerBadgeRow}>
                <Text style={[styles.incomingBannerBadgeText, { color: isDark ? '#C4B5FD' : '#16A34A' }]}>
                  NEW FRIEND REQUEST
                </Text>
              </View>
              <Text style={[styles.incomingBannerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
                {incomingRequests[0].fromName} ({incomingRequests[0].fromUsername})
              </Text>
              <Text style={[styles.incomingBannerSub, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
                Wants to be your habit buddy! Tap to view.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.incomingAcceptBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              acceptFollowRequest(incomingRequests[0].id, incomingRequests[0].fromUsername);
            }}
            activeOpacity={0.8}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.incomingAcceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Habits Section Header & Filter Tabs */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {selectedDate === new Date().toISOString().split('T')[0]
              ? "Today's Habits"
              : `Habits for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(selectedDateTime)}`}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: isDark ? 'rgba(124, 92, 255, 0.16)' : 'rgba(124, 92, 255, 0.1)' },
            ]}
          >
            <Text style={[styles.badgeText, { color: isDark ? '#A78BFA' : '#7C5CFF' }]}>
              {filteredHabits.length}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        {scheduledHabits.length > 0 && (
          <View style={styles.filterRow}>
            {(['all', 'pending', 'completed'] as const).map((mode) => {
              const isActive = filterMode === mode;
              const label = mode === 'all' ? 'All' : mode === 'pending' ? 'Pending' : 'Done';
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setFilterMode(mode)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? '#7C5CFF'
                          : '#7C5CFF'
                        : isDark
                        ? '#141D2E'
                        : '#F1F5F9',
                      borderColor: isActive
                        ? '#7C5CFF'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#E2E8F0',
                    },
                    isActive && styles.activeFilterChip,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isActive
                          ? '#FFFFFF'
                          : isDark
                          ? '#94A3B8'
                          : '#64748B',
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Habit List */}
      <View style={styles.listContainer}>
        {filteredHabits.length > 0 ? (
          filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))
        ) : activeHabits.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: isDark ? '#141D2E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(124, 92, 255, 0.15)' }]}>
              <Sparkles size={24} color="#7C5CFF" />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              No habits yet!
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Choose from popular templates or create a custom habit to start building your streak.
            </Text>

            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={[styles.templateBtn, { backgroundColor: '#7C5CFF', borderColor: '#7C5CFF' }]}
                onPress={() => setIsOnboardingModalOpen(true)}
                activeOpacity={0.8}
              >
                <Sparkles size={15} color="#FFFFFF" />
                <Text style={[styles.templateBtnText, { color: '#FFFFFF' }]}>
                  Browse Templates
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setIsCreateModalOpen(true)}
                activeOpacity={0.8}
              >
                <Plus size={15} color={isDark ? '#F8FAFC' : '#0F172A'} />
                <Text style={[styles.addBtnText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  Custom Habit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: isDark ? '#141D2E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={24} color="#10B981" />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {filterMode === 'completed'
                ? 'No habits completed yet'
                : filterMode === 'pending'
                ? 'All pending habits completed!'
                : scheduledHabits.length === 0
                ? 'No habits scheduled for today'
                : 'All scheduled habits completed!'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {scheduledHabits.length === 0
                ? 'Enjoy your rest day or add a new habit.'
                : 'Great job maintaining consistency today!'}
            </Text>

            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setIsCreateModalOpen(true)}
                activeOpacity={0.8}
              >
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Habit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.templateBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
                  },
                ]}
                onPress={() => setIsOnboardingModalOpen(true)}
                activeOpacity={0.8}
              >
                <Sparkles size={15} color="#7C5CFF" />
                <Text style={[styles.templateBtnText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  Templates
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeFilterChip: {
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyBox: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  emptyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  addBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  incomingBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  incomingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  incomingAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingBannerBadgeRow: {
    marginBottom: 2,
  },
  incomingBannerBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  incomingBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  incomingBannerSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  incomingAcceptBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  incomingAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
