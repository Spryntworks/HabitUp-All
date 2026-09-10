import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Habit } from '../../types';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { formatTo12Hour } from '../../utils/streakCalculator';
import { Check, Flame, MoreVertical, Calendar, Pause, Play, Archive, Trash2, X } from 'lucide-react-native';

interface HabitCardProps {
  habit: Habit;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const {
    selectedDate,
    completions,
    toggleCompletion,
    setSelectedHabitForDetail,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
    theme,
  } = useHabit();

  const [showMenu, setShowMenu] = useState(false);
  const isDark = theme === 'dark';

  const stats = getHabitStats(habit.id);
  const isCompleted = completions.some(
    (c) => c.habit_id === habit.id && (c.completion_date || '').split('T')[0] === selectedDate
  );

  const isPaused = Boolean(habit.paused_at);
  const isArchived = Boolean(habit.archived_at);

  const handleCheckClick = () => {
    toggleCompletion(habit.id, selectedDate);
  };

  const getSubtitle = () => {
    const parts: string[] = [];
    if (habit.description) {
      parts.push(habit.description);
    } else {
      if (habit.frequency_type === 'daily') parts.push('Daily');
      else if (habit.frequency_type === 'custom_days') {
        const days = habit.scheduled_days || [];
        if (days.length === 5 && days.includes(0) && days.includes(4)) parts.push('Weekdays');
        else parts.push(`${days.length} days/wk`);
      }
    }
    if (habit.reminder_enabled && habit.reminder_time) {
      parts.push(formatTo12Hour(habit.reminder_time));
    }
    return parts.join(' • ');
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isCompleted
            ? isDark
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(236, 253, 245, 0.95)'
            : isDark
            ? '#121B2D'
            : '#FFFFFF',
          borderColor: isCompleted
            ? isDark
              ? 'rgba(16, 185, 129, 0.28)'
              : 'rgba(16, 185, 129, 0.35)'
            : isDark
            ? 'rgba(255, 255, 255, 0.07)'
            : '#E2E8F0',
        },
      ]}
      onPress={() => setSelectedHabitForDetail(habit)}
      activeOpacity={0.88}
    >
      <View style={styles.contentRow}>
        {/* Habit Icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: habit.color || '#7C5CFF',
              opacity: isCompleted ? 0.9 : 1,
            },
          ]}
        >
          <IconRenderer name={habit.icon} size={20} color="#FFFFFF" />
        </View>

        {/* Title & Stats */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: isCompleted
                    ? isDark
                      ? '#94A3B8'
                      : '#475569'
                    : isDark
                    ? '#FFFFFF'
                    : '#0F172A',
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {stats.currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                <Flame size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.streakCount}>{stats.currentStreak}d</Text>
              </View>
            )}
            {isPaused && (
              <View style={styles.badgePaused}>
                <Text style={styles.badgePausedText}>PAUSED</Text>
              </View>
            )}
            {isArchived && (
              <View style={styles.badgeArchived}>
                <Text style={styles.badgeArchivedText}>ARCHIVED</Text>
              </View>
            )}
            {habit.is_shared && (
              <View style={styles.badgeBuddy}>
                <Text style={styles.badgeBuddyText}>
                  {habit.buddy_avatar || '🤝'} {habit.buddy_name || 'Buddy'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.subRow}>
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? '#64748B' : '#94A3B8' },
              ]}
              numberOfLines={1}
            >
              {getSubtitle()}
            </Text>
          </View>
        </View>

        {/* Options Button & Checkbox */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setShowMenu(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MoreVertical size={16} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.checkbox,
              isCompleted
                ? styles.checkboxChecked
                : isDark
                ? styles.checkboxUncheckedDark
                : styles.checkboxUncheckedLight,
            ]}
            onPress={handleCheckClick}
            activeOpacity={0.7}
          >
            {isCompleted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menuBox,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setSelectedHabitForDetail(habit);
              }}
            >
              <Calendar size={16} color="#38BDF8" />
              <Text style={[styles.menuText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                View Details & Stats
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                if (isPaused) resumeHabit(habit.id);
                else pauseHabit(habit.id);
              }}
            >
              {isPaused ? <Play size={16} color="#34D399" /> : <Pause size={16} color="#FBBF24" />}
              <Text style={[styles.menuText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {isPaused ? 'Resume Habit' : 'Pause Habit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                archiveHabit(habit.id);
              }}
            >
              <Archive size={16} color="#C084FC" />
              <Text style={[styles.menuText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                Archive Habit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                deleteHabit(habit.id);
              }}
            >
              <Trash2 size={16} color="#F43F5E" />
              <Text style={[styles.menuText, { color: '#F43F5E' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  badgePaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePausedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F59E0B',
  },
  badgeArchived: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeArchivedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  badgeBuddy: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderColor: 'rgba(124, 92, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeBuddyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C5CFF',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  streakCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moreBtn: {
    padding: 8,
    borderRadius: 8,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxUncheckedDark: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkboxUncheckedLight: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  menuBox: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
