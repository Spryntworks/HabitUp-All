import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { HomeHero } from '../mobile/HomeHero';
import { DateStrip } from '../mobile/DateStrip';
import { TodayProgressCard } from '../mobile/TodayProgressCard';
import { HabitCard } from '../mobile/HabitCard';
import { isHabitScheduledOnDate } from '../../utils/streakCalculator';
import { Plus, Sparkles, CheckCircle2 } from 'lucide-react-native';

export const HomeView: React.FC = () => {
  const {
    habits,
    completions,
    selectedDate,
    theme,
    setIsCreateModalOpen,
    setIsOnboardingModalOpen,
    setIsPlantGardenModalOpen,
  } = useHabit();

  const isDark = theme === 'dark';
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

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
    >
      <HomeHero onMascotClick={() => setIsPlantGardenModalOpen(true)} />
      <DateStrip />
      <TodayProgressCard />

      {/* Habits Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          {selectedDate === new Date().toISOString().split('T')[0]
            ? "Today's Habits"
            : `Habits for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(selectedDateTime)}`}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
          ]}
        >
          <Text style={[styles.badgeText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
            {filteredHabits.length} habits
          </Text>
        </View>
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
                backgroundColor: isDark ? '#162032' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
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
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={[styles.templateBtnText, { color: '#FFFFFF' }]}>
                  Browse Templates
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setIsCreateModalOpen(true)}
              >
                <Plus size={16} color={isDark ? '#F8FAFC' : '#0F172A'} />
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
                backgroundColor: isDark ? '#162032' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={24} color="#10B981" />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {filterMode === 'completed'
                ? 'No habits completed yet'
                : scheduledHabits.length === 0
                ? 'No habits scheduled for today'
                : 'All scheduled habits completed!'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {scheduledHabits.length === 0
                ? 'Enjoy your rest day or add a habit.'
                : 'Great job maintaining consistency today!'}
            </Text>

            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setIsCreateModalOpen(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Habit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.templateBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => setIsOnboardingModalOpen(true)}
              >
                <Sparkles size={16} color="#7C5CFF" />
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
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  addBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
