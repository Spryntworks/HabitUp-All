import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
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
  MoreHorizontal,
  Edit3,
  Pause,
  Play,
  Archive,
  ArchiveRestore,
  Trash2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react-native';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitsView: React.FC = () => {
  const {
    habits,
    completions,
    toggleCompletion,
    getHabitStats,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    unarchiveHabit,
    deleteHabit,
    updateHabit,
    setActiveTab,
    setIsCreateModalOpen,
    setIsOnboardingModalOpen,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [filterTab, setFilterTab] = useState<'active' | 'paused' | 'archived'>('active');

  const activeHabits = habits.filter((h) => !h.archived_at && !h.deleted_at && !h.paused_at);
  const pausedHabits = habits.filter((h) => Boolean(h.paused_at) && !h.archived_at && !h.deleted_at);
  const archivedHabits = habits.filter((h) => Boolean(h.archived_at) && !h.deleted_at);

  const displayedHabits =
    filterTab === 'active'
      ? activeHabits
      : filterTab === 'paused'
      ? pausedHabits
      : archivedHabits;

  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    displayedHabits[0]?.id || ''
  );
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const currentHabit =
    displayedHabits.find((h) => h.id === selectedHabitId) ||
    displayedHabits[0] ||
    null;

  const stats = currentHabit ? getHabitStats(currentHabit.id) : null;
  const isPaused = Boolean(currentHabit?.paused_at);
  const isArchived = Boolean(currentHabit?.archived_at);

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

  const todayKey = formatDateKey(new Date());

  const handleStartEdit = () => {
    if (!currentHabit) return;
    setEditName(currentHabit.name);
    setEditDesc(currentHabit.description || '');
    setEditColor(currentHabit.color || '#7C5CFF');
    setEditIcon(currentHabit.icon || 'Sparkles');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!currentHabit || !editName.trim()) return;
    updateHabit(currentHabit.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      color: editColor,
      icon: editIcon,
    });
    setIsEditing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Header matching Image 1: [ < ] Habit Details [ ••• ] */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={styles.headerIconButton}
        >
          <ChevronLeft size={22} color={isDark ? '#E2E8F0' : '#0F172A'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Habit Details
        </Text>

        <TouchableOpacity
          onPress={() => setShowOptionsMenu(true)}
          style={styles.headerIconButton}
          disabled={!currentHabit}
        >
          <MoreHorizontal size={22} color={isDark ? '#E2E8F0' : '#0F172A'} />
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Bar: Active / Paused / Archived */}
      <View style={[styles.filterBar, { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterTab === 'active' && [
              styles.filterTabActive,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ],
          ]}
          onPress={() => {
            setFilterTab('active');
            if (activeHabits[0]) setSelectedHabitId(activeHabits[0].id);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color:
                  filterTab === 'active'
                    ? '#7C5CFF'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
              },
            ]}
          >
            Active ({activeHabits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filterTab === 'paused' && [
              styles.filterTabActive,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ],
          ]}
          onPress={() => {
            setFilterTab('paused');
            if (pausedHabits[0]) setSelectedHabitId(pausedHabits[0].id);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color:
                  filterTab === 'paused'
                    ? '#F59E0B'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
              },
            ]}
          >
            Paused ({pausedHabits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filterTab === 'archived' && [
              styles.filterTabActive,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ],
          ]}
          onPress={() => {
            setFilterTab('archived');
            if (archivedHabits[0]) setSelectedHabitId(archivedHabits[0].id);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              {
                color:
                  filterTab === 'archived'
                    ? '#38BDF8'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
              },
            ]}
          >
            Archived ({archivedHabits.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. ARCHIVED HABITS LIST VIEW */}
      {filterTab === 'archived' && (
        <View style={styles.archivedSection}>
          {archivedHabits.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Archive size={28} color="#38BDF8" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                No Archived Habits
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Habits you archive will be stored safely here. You can unarchive or restore them anytime!
              </Text>
            </View>
          ) : (
            <View style={styles.archivedList}>
              {archivedHabits.map((h) => (
                <View
                  key={h.id}
                  style={[
                    styles.archivedCard,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.archivedCardTop}>
                    <View style={[styles.archivedIcon, { backgroundColor: h.color || '#7C5CFF' }]}>
                      <IconRenderer name={h.icon} size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.archivedName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {h.name}
                      </Text>
                      <Text style={[styles.archivedDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {h.description || 'Archived habit'}
                      </Text>
                    </View>
                    <View style={styles.archivedBadge}>
                      <Text style={styles.archivedBadgeText}>ARCHIVED</Text>
                    </View>
                  </View>

                  <View style={styles.archivedActionsRow}>
                    <TouchableOpacity
                      style={styles.unarchiveBtn}
                      onPress={() => unarchiveHabit(h.id)}
                    >
                      <ArchiveRestore size={15} color="#10B981" />
                      <Text style={styles.unarchiveBtnText}>Restore / Unarchive</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteArchivedBtn}
                      onPress={() => deleteHabit(h.id)}
                    >
                      <Trash2 size={15} color="#EF4444" />
                      <Text style={styles.deleteArchivedBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 2. PAUSED HABITS LIST VIEW */}
      {filterTab === 'paused' && (
        <View style={styles.archivedSection}>
          {pausedHabits.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Pause size={28} color="#F59E0B" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                No Paused Habits
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Paused habits preserve your streak and do not mark missed days.
              </Text>
            </View>
          ) : (
            <View style={styles.archivedList}>
              {pausedHabits.map((h) => (
                <View
                  key={h.id}
                  style={[
                    styles.archivedCard,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.archivedCardTop}>
                    <View style={[styles.archivedIcon, { backgroundColor: h.color || '#7C5CFF' }]}>
                      <IconRenderer name={h.icon} size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.archivedName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {h.name}
                      </Text>
                      <Text style={[styles.archivedDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {h.description || 'Paused habit'}
                      </Text>
                    </View>
                    <View style={[styles.archivedBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                      <Text style={[styles.archivedBadgeText, { color: '#F59E0B' }]}>PAUSED</Text>
                    </View>
                  </View>

                  <View style={styles.archivedActionsRow}>
                    <TouchableOpacity
                      style={styles.unarchiveBtn}
                      onPress={() => resumeHabit(h.id)}
                    >
                      <Play size={15} color="#10B981" />
                      <Text style={styles.unarchiveBtnText}>Resume Habit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteArchivedBtn}
                      onPress={() => archiveHabit(h.id)}
                    >
                      <Archive size={15} color="#38BDF8" />
                      <Text style={[styles.deleteArchivedBtnText, { color: '#38BDF8' }]}>Archive</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 3. ACTIVE HABITS VIEW */}
      {filterTab === 'active' && (
        <>
          {activeHabits.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.emptyIconCircle}>
                <Sparkles size={28} color="#7C5CFF" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                No Active Habits
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Create your first habit or start with templates.
              </Text>

              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyAddBtnText}>Add Habit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.emptyTplBtn,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setIsOnboardingModalOpen(true)}
                >
                  <Sparkles size={16} color="#7C5CFF" />
                  <Text style={[styles.emptyTplBtnText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    Templates
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
        <>
          {/* Horizontal Habit Switcher Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalSelector}
          >
            {activeHabits.map((h) => {
              const isSelected = h.id === currentHabit?.id;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.habitPill,
                    {
                      backgroundColor: isSelected
                        ? '#7C5CFF'
                        : isDark
                        ? '#131C2E'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? '#7C5CFF'
                        : isDark
                        ? '#1E293B'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setSelectedHabitId(h.id)}
                >
                  <View
                    style={[
                      styles.pillDot,
                      {
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.4)' : h.color || '#FF4D6D',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.habitPillText,
                      { color: isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#334155' },
                    ]}
                  >
                    {h.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Hero Icon, Habit Name & Description */}
          {currentHabit && stats && (
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.heroIconBox,
                  { backgroundColor: currentHabit.color || '#7C5CFF' },
                ]}
              >
                <IconRenderer name={currentHabit.icon} size={32} color="#FFFFFF" />
              </View>

              <Text style={[styles.heroHabitName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {currentHabit.name}
              </Text>
              <Text style={[styles.heroHabitDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {currentHabit.description || '10 mins mindfulness & calm breathing'}
              </Text>

              {/* 2x2 Stats Grid matching Image 1 */}
              <View style={styles.statsGrid}>
                {/* 1. Current Streak */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.statValueRow}>
                    <Text style={{ fontSize: 20 }}>🔥</Text>
                    <Text style={styles.currentStreakValue}>
                      {stats.currentStreak}
                    </Text>
                  </View>
                  <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Current Streak
                  </Text>
                </View>

                {/* 2. Best Streak */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {stats.longestStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Best Streak
                  </Text>
                </View>

                {/* 3. Completion Rate */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {stats.completionRate}%
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Completion Rate
                  </Text>
                </View>

                {/* 4. Total Completions */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {stats.totalCompletions}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Total Completions
                  </Text>
                </View>
              </View>

              {/* Calendar Card in Habits Tab matching Image 1 & 2 */}
              <View
                style={[
                  styles.calendarCard,
                  {
                    backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                {/* Calendar Header */}
                <View style={styles.calHeaderRow}>
                  <View>
                    <Text style={[styles.calCardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      Calendar
                    </Text>
                    <Text style={[styles.calMonthText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {monthName}
                    </Text>
                  </View>
                  <View style={styles.calNavArrows}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                      <ChevronLeft size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
                      <ChevronRight size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day Labels M T W T F S S */}
                <View style={styles.dayLabelsRow}>
                  {DAY_LABELS.map((d, i) => (
                    <Text key={i} style={[styles.dayLabelText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Date Matrix Circular Nodes */}
                <View style={styles.calGrid}>
                  {daysInMonth.map((item, index) => {
                    if (!item) {
                      return <View key={`empty-${index}`} style={styles.calNodePlaceholder} />;
                    }

                    const isScheduled = isHabitScheduledOnDate(currentHabit, item.date);
                    const isDone = completions.some(
                      (c) => c.habit_id === currentHabit.id && c.completion_date === item.key
                    );
                    const isCurrentToday = item.key === todayKey;
                    const isPast = item.key < todayKey;
                    const isMissed = item.isCurrentMonth && !isDone && isScheduled && isPast;

                    const textColor = !item.isCurrentMonth
                      ? isDark
                        ? '#475569'
                        : '#94A3B8'
                      : isDone || isMissed
                      ? '#FFFFFF'
                      : isCurrentToday
                      ? isDark
                        ? '#FFFFFF'
                        : '#7C5CFF'
                      : isDark
                      ? '#FFFFFF'
                      : '#0F172A';

                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.calNode,
                          !item.isCurrentMonth && {
                            backgroundColor: 'transparent',
                          },
                          item.isCurrentMonth && isDone && styles.nodeCompleted,
                          item.isCurrentMonth && isMissed && styles.nodeMissed,
                          isCurrentToday && !isDone && !isMissed && [
                            styles.nodeToday,
                            {
                              borderColor: '#7C5CFF',
                              backgroundColor: isDark ? '#1C273C' : '#F5F3FF',
                            },
                          ],
                          item.isCurrentMonth &&
                            !isDone &&
                            !isMissed &&
                            !isCurrentToday && {
                              backgroundColor: isDark ? '#1C273C' : '#F1F5F9',
                            },
                        ]}
                        onPress={() => toggleCompletion(currentHabit.id, item.key)}
                      >
                        <Text
                          style={[
                            styles.calNodeText,
                            {
                              color: textColor,
                              fontWeight:
                                isDone || isMissed || isCurrentToday ? '800' : '600',
                            },
                          ]}
                        >
                          {item.dayNumber}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </>
      )}
      </>
      )}

      {/* Options Menu Modal */}
      {currentHabit && (
        <Modal visible={showOptionsMenu} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptionsMenu(false)}
          >
            <View
              style={[
                styles.modalBox,
                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
              ]}
            >
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleStartEdit();
                }}
              >
                <Edit3 size={18} color="#38BDF8" />
                <Text style={[styles.modalItemText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  Edit Habit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  if (isPaused) resumeHabit(currentHabit.id);
                  else pauseHabit(currentHabit.id);
                }}
              >
                {isPaused ? <Play size={18} color="#34D399" /> : <Pause size={18} color="#FBBF24" />}
                <Text style={[styles.modalItemText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  {isPaused ? 'Resume Habit' : 'Pause Habit'}
                </Text>
              </TouchableOpacity>

              {isArchived ? (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    unarchiveHabit(currentHabit.id);
                  }}
                >
                  <ArchiveRestore size={18} color="#10B981" />
                  <Text style={[styles.modalItemText, { color: '#10B981' }]}>
                    Restore / Unarchive Habit
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    archiveHabit(currentHabit.id);
                  }}
                >
                  <Archive size={18} color="#C084FC" />
                  <Text style={[styles.modalItemText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                    Archive Habit
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  deleteHabit(currentHabit.id);
                }}
              >
                <Trash2 size={18} color="#F43F5E" />
                <Text style={[styles.modalItemText, { color: '#F43F5E' }]}>
                  Delete Habit
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit Habit Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.editModalBox,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.editHeader}>
              <Text style={[styles.modalBoxTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Edit Habit
              </Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Habit Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  },
                ]}
                value={editDesc}
                onChangeText={setEditDesc}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
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
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  archivedSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  archivedList: {
    gap: 10,
  },
  archivedCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  archivedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  archivedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedName: {
    fontSize: 15,
    fontWeight: '700',
  },
  archivedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  archivedBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  archivedBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  archivedActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    paddingTop: 10,
  },
  unarchiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  unarchiveBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteArchivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteArchivedBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalSelector: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 10,
  },
  habitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  heroHabitName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroHabitDesc: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  statBox: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 85,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentStreakValue: {
    color: '#FF8A00',
    fontSize: 24,
    fontWeight: '900',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  calendarCard: {
    width: '100%',
    marginTop: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  calHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  calMonthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  calNavArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowBtn: {
    padding: 6,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
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
    gap: 6,
  },
  calNodePlaceholder: {
    width: 38,
    height: 38,
  },
  calNode: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
  nodeToday: {
    borderWidth: 2.5,
    backgroundColor: '#131C2E',
  },
  nodeInactiveMonth: {
    opacity: 0.25,
  },
  calNodeText: {
    fontSize: 13,
  },
  emptyBox: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
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
    marginTop: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyTplBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emptyTplBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    padding: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBoxTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
