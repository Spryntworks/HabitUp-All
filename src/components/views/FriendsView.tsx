import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { getUserInviteCode } from '../../utils/streakCalculator';
import { FriendUser, FriendPublicHabit, Habit } from '../../types';
import {
  Users,
  Flame,
  UserPlus,
  Share2,
  Check,
  Plus,
  X,
  Copy,
  Clock,
  Zap,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';

const QUICK_HABIT_PRESETS = [
  { name: 'Morning 5km Run', icon: 'Activity', color: '#FF6B6B', time: '06:30' },
  { name: 'Deep Meditation', icon: 'Sparkles', color: '#7C5CFF', time: '07:00' },
  { name: 'Drink 3L Water', icon: 'Droplets', color: '#38BDF8', time: '09:00' },
  { name: 'Read 20 Pages', icon: 'BookOpen', color: '#F59E0B', time: '21:00' },
  { name: 'LeetCode Daily', icon: 'Cpu', color: '#10B981', time: '08:30' },
  { name: 'Strength Workout', icon: 'Dumbbell', color: '#EF4444', time: '18:00' },
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const FriendsView: React.FC = () => {
  const {
    user,
    habits,
    completions,
    selectedDate,
    toggleCompletion,
    friends,
    adoptFriendHabit,
    createSharedHabit,
    addFriendByCodeOrUsername,
    nudgeFriend,
    toggleFriendHabitCompletion,
    theme,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Input for adding friend
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');

  // Modal for creating a habit together
  const [isTogetherModalOpen, setIsTogetherModalOpen] = useState<boolean>(false);
  const [selectedFriendForTogether, setSelectedFriendForTogether] = useState<FriendUser | null>(null);
  const [togetherHabitName, setTogetherHabitName] = useState<string>('');
  const [togetherHabitTime, setTogetherHabitTime] = useState<string>('08:00');
  const [togetherIcon, setTogetherIcon] = useState<string>('Target');
  const [togetherColor, setTogetherColor] = useState<string>('#7C5CFF');

  const myInviteCode = useMemo(() => {
    return getUserInviteCode(user);
  }, [user]);

  // Map of active user habits by lowercase name
  const myHabitsMap = useMemo(() => {
    const map = new Map<string, Habit>();
    habits
      .filter((h) => !h.deleted_at && !h.archived_at)
      .forEach((h) => {
        map.set(h.name.trim().toLowerCase(), h);
      });
    return map;
  }, [habits]);

  const connectedFriends = useMemo(() => {
    return friends.filter((f) => f.isFriend);
  }, [friends]);

  // Helper to check if current user completed a specific habit today
  const isMyHabitDoneToday = (habitId: string) => {
    return completions.some(
      (c) => c.habit_id === habitId && (c.completion_date || '').split('T')[0] === todayStr
    );
  };

  // Helper to get user's 7-day completion history for a specific habit
  const getMyHabitWeeklyHistory = (habitId: string): boolean[] => {
    const history: boolean[] = [];
    const today = new Date();
    // Calculate Monday of current week
    const currentDay = today.getDay(); // 0 is Sunday
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isDone = completions.some(
        (c) => c.habit_id === habitId && (c.completion_date || '').split('T')[0] === dStr
      );
      history.push(isDone);
    }
    return history;
  };

  const handleAddFriend = () => {
    if (!friendCodeInput.trim()) {
      showToast('Please enter a username or invite code', undefined, 'info');
      return;
    }
    addFriendByCodeOrUsername(friendCodeInput);
    setFriendCodeInput('');
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Add me on HabitUp! My habit buddy invite code is ${myInviteCode}. Let's build and follow habits together! 🤝`,
      });
    } catch {}
  };

  const handleCopyCode = () => {
    showToast(`Invite code ${myInviteCode} copied! 📋`, undefined, 'success');
  };

  const handleCreateTogether = () => {
    if (!togetherHabitName.trim()) {
      showToast('Please enter a habit name', undefined, 'info');
      return;
    }
    const targetFriend = selectedFriendForTogether || connectedFriends[0];
    if (!targetFriend) {
      showToast('Please select or add a friend first', undefined, 'info');
      return;
    }

    createSharedHabit(
      targetFriend.id,
      togetherHabitName.trim(),
      togetherIcon,
      togetherColor,
      togetherHabitTime
    );

    setIsTogetherModalOpen(false);
    setTogetherHabitName('');
  };

  const openTogetherWithFriend = (friend: FriendUser) => {
    setSelectedFriendForTogether(friend);
    setIsTogetherModalOpen(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <Users size={20} color="#7C5CFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Friends & Mutual Progress
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Adopt habits & track real-time accountability together
          </Text>
        </View>
      </View>

      {/* 2. My Invite Code & Add Friend Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        {/* Top: My Code */}
        <View style={styles.codeRow}>
          <View>
            <Text style={[styles.codeLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              YOUR INVITE CODE
            </Text>
            <Text style={[styles.codeValue, { color: '#7C5CFF' }]}>{myInviteCode}</Text>
          </View>

          <View style={styles.codeActionsRow}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Copy size={14} color={isDark ? '#E2E8F0' : '#0F172A'} />
              <Text style={[styles.copyBtnText, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode}>
              <Share2 size={14} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

        {/* Bottom: Add Friend Input */}
        <Text style={[styles.codeLabel, { color: isDark ? '#94A3B8' : '#64748B', marginBottom: 6 }]}>
          ADD FRIEND BY USERNAME OR CODE
        </Text>

        <View style={styles.addInputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A',
              },
            ]}
            placeholder="Enter @username or invite code..."
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={friendCodeInput}
            onChangeText={setFriendCodeInput}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.addFriendBtn} onPress={handleAddFriend}>
            <UserPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addFriendBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Action Button: Start a Habit Together */}
      <TouchableOpacity
        style={styles.startTogetherBtn}
        onPress={() => {
          setSelectedFriendForTogether(connectedFriends[0] || null);
          setIsTogetherModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <Zap size={18} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.startTogetherBtnText}>🤝 Create & Follow a Habit Together</Text>
      </TouchableOpacity>

      {/* 4. Friends List Heading */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          MY HABIT BUDDIES ({connectedFriends.length})
        </Text>
      </View>

      {/* 5. Friend Cards & Mutual Progress Trackers */}
      {connectedFriends.map((friend) => {
        // Separate habits into Shared/Adopted vs Not Adopted
        const sharedHabits: { friendHabit: FriendPublicHabit; myHabit: Habit }[] = [];
        const unadoptedHabits: FriendPublicHabit[] = [];

        friend.habits.forEach((fh) => {
          const myMatch = myHabitsMap.get(fh.name.trim().toLowerCase());
          if (myMatch) {
            sharedHabits.push({ friendHabit: fh, myHabit: myMatch });
          } else {
            unadoptedHabits.push(fh);
          }
        });

        return (
          <View
            key={friend.id}
            style={[
              styles.friendCard,
              {
                backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            {/* Friend Profile Header */}
            <View style={styles.friendProfileRow}>
              <View style={styles.friendProfileLeft}>
                <View style={styles.friendAvatarCircle}>
                  <Text style={styles.friendAvatarEmoji}>{friend.avatar}</Text>
                </View>
                <View>
                  <Text style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {friend.name}
                  </Text>
                  <Text style={[styles.friendUserTag, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {friend.username} • {friend.plantStage}
                  </Text>
                </View>
              </View>

              <View style={styles.friendHeaderRight}>
                <View style={styles.streakFlameBadge}>
                  <Flame size={14} color="#FF6B6B" fill="#FF6B6B" />
                  <Text style={styles.streakFlameText}>{friend.currentStreak}d</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.buddyTogetherBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={() => openTogetherWithFriend(friend)}
                >
                  <Plus size={12} color="#7C5CFF" strokeWidth={3} />
                  <Text style={styles.buddyTogetherBtnText}>Habit Together</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION A: SHARED & MUTUAL PROGRESS HABITS */}
            {sharedHabits.length > 0 && (
              <View style={styles.sharedSection}>
                <View style={styles.sharedSectionTitleRow}>
                  <Zap size={14} color="#10B981" />
                  <Text style={[styles.sharedSectionTitle, { color: '#10B981' }]}>
                    MUTUAL HABITS ({sharedHabits.length} SHARED)
                  </Text>
                </View>

                {sharedHabits.map(({ friendHabit, myHabit }) => {
                  const myDone = isMyHabitDoneToday(myHabit.id);
                  const friendDone = friendHabit.isCompletedToday;
                  const bothDone = myDone && friendDone;
                  const myWeekly = getMyHabitWeeklyHistory(myHabit.id);
                  const friendWeekly = friendHabit.weeklyHistory || [false, false, false, false, false, false, false];

                  return (
                    <View
                      key={friendHabit.id}
                      style={[
                        styles.mutualTrackerCard,
                        {
                          backgroundColor: isDark ? '#182438' : '#F1F5F9',
                          borderColor: bothDone
                            ? '#10B981'
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                    >
                      {/* Top: Habit Name & Shared Streak */}
                      <View style={styles.mutualHeader}>
                        <View style={styles.mutualTitleGroup}>
                          <View
                            style={[
                              styles.habitIconBox,
                              { backgroundColor: friendHabit.color || '#7C5CFF' },
                            ]}
                          >
                            <IconRenderer name={friendHabit.icon} size={16} color="#FFFFFF" />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.mutualHabitName,
                                { color: isDark ? '#FFFFFF' : '#0F172A' },
                              ]}
                            >
                              {friendHabit.name}
                            </Text>
                            <Text
                              style={[
                                styles.mutualHabitSub,
                                { color: isDark ? '#94A3B8' : '#64748B' },
                              ]}
                            >
                              Shared Routine • ⏰ {friendHabit.reminder_time || '08:00'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.sharedStreakBox}>
                          <Flame size={12} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.sharedStreakText}>
                            {friendHabit.currentStreak}d Shared Streak
                          </Text>
                        </View>
                      </View>

                      {/* Today's Mutual Status Banner */}
                      <View
                        style={[
                          styles.statusBanner,
                          bothDone
                            ? styles.statusBannerBothDone
                            : styles.statusBannerPending,
                        ]}
                      >
                        <View style={styles.statusAvatarRow}>
                          {/* You */}
                          <View style={styles.userStatusPill}>
                            <Text style={styles.miniAvatar}>{user?.avatar || '🌟'}</Text>
                            <Text style={styles.statusLabelText}>
                              You: {myDone ? 'Done ✅' : 'Pending ⏳'}
                            </Text>
                          </View>

                          {/* Friend */}
                          <View style={styles.userStatusPill}>
                            <Text style={styles.miniAvatar}>{friend.avatar}</Text>
                            <Text style={styles.statusLabelText}>
                              {friend.name.split(' ')[0]}: {friendDone ? 'Done ✅' : 'Pending ⏳'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Message */}
                        <Text
                          style={[
                            styles.statusBannerMessage,
                            { color: bothDone ? '#10B981' : isDark ? '#CBD5E1' : '#475569' },
                          ]}
                        >
                          {bothDone
                            ? '🎉 Both completed today! Mutual streak maintained!'
                            : myDone && !friendDone
                            ? `⚡ You're done! ${friend.name.split(' ')[0]} is still working on it.`
                            : !myDone && friendDone
                            ? `⏳ ${friend.name.split(' ')[0]} completed today! Your turn to check in.`
                            : '⏳ Both pending today. Keep each other accountable!'}
                        </Text>
                      </View>

                      {/* 7-Day Weekly Comparison Progress Tracker */}
                      <View style={styles.weeklyComparisonSection}>
                        <Text style={[styles.weeklySectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          WEEKLY PROGRESS COMPARISON
                        </Text>

                        {/* Day Headers: M T W T F S S */}
                        <View style={styles.daysHeaderRow}>
                          <View style={{ width: 60 }} />
                          <View style={styles.daysCols}>
                            {WEEK_DAYS.map((d, i) => (
                              <Text
                                key={i}
                                style={[
                                  styles.dayColHeader,
                                  { color: isDark ? '#64748B' : '#94A3B8' },
                                ]}
                              >
                                {d}
                              </Text>
                            ))}
                          </View>
                        </View>

                        {/* Row 1: You */}
                        <View style={styles.weeklyRow}>
                          <Text
                            style={[
                              styles.weeklyRowLabel,
                              { color: isDark ? '#E2E8F0' : '#334155' },
                            ]}
                          >
                            You
                          </Text>
                          <View style={styles.daysCols}>
                            {myWeekly.map((done, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.progressDot,
                                  done
                                    ? styles.progressDotDoneYou
                                    : isDark
                                    ? styles.progressDotPendingDark
                                    : styles.progressDotPendingLight,
                                ]}
                              >
                                {done && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Row 2: Friend */}
                        <View style={styles.weeklyRow}>
                          <Text
                            style={[
                              styles.weeklyRowLabel,
                              { color: isDark ? '#E2E8F0' : '#334155' },
                            ]}
                          >
                            {friend.name.split(' ')[0]}
                          </Text>
                          <View style={styles.daysCols}>
                            {friendWeekly.map((done, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.progressDot,
                                  done
                                    ? styles.progressDotDoneFriend
                                    : isDark
                                    ? styles.progressDotPendingDark
                                    : styles.progressDotPendingLight,
                                ]}
                              >
                                {done && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Interactive Actions Footer */}
                      <View style={styles.mutualActionsRow}>
                        {/* 1. If You are pending, 1-tap check-in button */}
                        {!myDone && (
                          <TouchableOpacity
                            style={styles.markMyDoneBtn}
                            onPress={() => toggleCompletion(myHabit.id, todayStr)}
                          >
                            <CheckCircle2 size={13} color="#FFFFFF" />
                            <Text style={styles.markMyDoneBtnText}>Mark My Routine Done</Text>
                          </TouchableOpacity>
                        )}

                        {/* 2. If Friend is pending, friendly Nudge button */}
                        {!friendDone && (
                          <TouchableOpacity
                            style={styles.nudgeBtn}
                            onPress={() => nudgeFriend(friend.id, friendHabit.name)}
                          >
                            <Bell size={13} color="#F59E0B" />
                            <Text style={styles.nudgeBtnText}>
                              👋 Nudge {friend.name.split(' ')[0]}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* 3. If Both are done, celebratory button */}
                        {bothDone && (
                          <View style={styles.celebratedBadge}>
                            <Sparkles size={13} color="#10B981" />
                            <Text style={styles.celebratedBadgeText}>Streak Secured! 🔥</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* SECTION B: OTHER PUBLIC HABITS (AVAILABLE TO ADOPT) */}
            {unadoptedHabits.length > 0 && (
              <View style={styles.habitsWrapper}>
                <Text style={[styles.habitsSubHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  MORE HABITS FROM {friend.name.toUpperCase()} ({unadoptedHabits.length})
                </Text>

                {unadoptedHabits.map((h) => (
                  <View
                    key={h.id}
                    style={[
                      styles.habitItem,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.habitItemLeft}>
                      <View
                        style={[
                          styles.habitIconBox,
                          { backgroundColor: h.color || '#7C5CFF' },
                        ]}
                      >
                        <IconRenderer name={h.icon} size={16} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.habitItemName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                          {h.name}
                        </Text>
                        <Text style={[styles.habitItemMeta, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          🔥 {h.currentStreak}d streak • ⏰ {h.reminder_time || 'Daily'} • {h.isCompletedToday ? 'Done today ✅' : 'Pending today ⏳'}
                        </Text>
                      </View>
                    </View>

                    {/* 1-Tap Adopt / Follow Habit */}
                    <TouchableOpacity
                      style={styles.followHabitBtn}
                      onPress={() => adoptFriendHabit(h, friend.id, friend.name, friend.avatar)}
                      activeOpacity={0.8}
                    >
                      <Plus size={12} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.followHabitBtnText}>Follow Habit</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {connectedFriends.length === 0 && (
        <View style={styles.emptyCard}>
          <Users size={32} color="#7C5CFF" />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            No friends added yet
          </Text>
          <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Enter an invite code or username above to connect with habit buddies and track mutual progress!
          </Text>
        </View>
      )}

      {/* 6. CREATE SHARED HABIT TOGETHER MODAL */}
      <Modal visible={isTogetherModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Start a Habit Together 🤝
              </Text>
              <TouchableOpacity onPress={() => setIsTogetherModalOpen(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Create a shared habit that both you and your friend follow and see each other's progress on.
            </Text>

            {/* Pick Friend */}
            <Text style={[styles.fieldLabel, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              DO THIS HABIT WITH:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendPillsRow}>
              {connectedFriends.map((f) => {
                const isSelected = (selectedFriendForTogether?.id || connectedFriends[0]?.id) === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.friendPill,
                      isSelected && styles.friendPillActive,
                      {
                        backgroundColor: isSelected
                          ? '#7C5CFF'
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                      },
                    ]}
                    onPress={() => setSelectedFriendForTogether(f)}
                  >
                    <Text style={styles.friendPillEmoji}>{f.avatar}</Text>
                    <Text
                      style={[
                        styles.friendPillText,
                        { color: isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#0F172A' },
                      ]}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Presets */}
            <Text style={[styles.fieldLabel, { color: isDark ? '#E2E8F0' : '#334155', marginTop: 12 }]}>
              QUICK HABIT IDEAS:
            </Text>
            <View style={styles.presetsGrid}>
              {QUICK_HABIT_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={[
                    styles.presetPill,
                    togetherHabitName === p.name && styles.presetPillActive,
                    {
                      backgroundColor: togetherHabitName === p.name
                        ? 'rgba(124, 92, 255, 0.2)'
                        : isDark
                        ? '#1E293B'
                        : '#F1F5F9',
                      borderColor: togetherHabitName === p.name ? '#7C5CFF' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setTogetherHabitName(p.name);
                    setTogetherIcon(p.icon);
                    setTogetherColor(p.color);
                    setTogetherHabitTime(p.time);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: togetherHabitName === p.name ? '#7C5CFF' : isDark ? '#E2E8F0' : '#0F172A' },
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Habit Name Input */}
            <Text style={[styles.fieldLabel, { color: isDark ? '#E2E8F0' : '#334155', marginTop: 12 }]}>
              HABIT NAME:
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                },
              ]}
              placeholder="e.g. Read 20 Pages, Morning Run..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={togetherHabitName}
              onChangeText={setTogetherHabitName}
            />

            {/* Reminder Time */}
            <View style={styles.timeRow}>
              <Clock size={16} color="#7C5CFF" />
              <Text style={[styles.timeLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Daily Reminder Time:
              </Text>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={togetherHabitTime}
                onChangeText={setTogetherHabitTime}
                placeholder="08:00"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={styles.modalCreateBtn}
              onPress={handleCreateTogether}
              activeOpacity={0.85}
            >
              <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.modalCreateBtnText}>Create for Both of Us</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  codeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 92, 255, 0.1)',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#7C5CFF',
    gap: 4,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
        } as any)
      : {}),
  },
  addFriendBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  addFriendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  startTogetherBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  startTogetherBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  listHeaderRow: {
    marginTop: 6,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  friendCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  friendProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  friendAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarEmoji: {
    fontSize: 18,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
  },
  friendUserTag: {
    fontSize: 11,
    marginTop: 1,
  },
  friendHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakFlameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  streakFlameText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '900',
  },
  buddyTogetherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  buddyTogetherBtnText: {
    color: '#7C5CFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sharedSection: {
    gap: 10,
    paddingTop: 4,
  },
  sharedSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sharedSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  mutualTrackerCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  mutualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mutualTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  mutualHabitName: {
    fontSize: 14,
    fontWeight: '900',
  },
  mutualHabitSub: {
    fontSize: 10,
    marginTop: 1,
  },
  sharedStreakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  sharedStreakText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  statusBanner: {
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusBannerBothDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  statusBannerPending: {
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
    borderColor: 'rgba(124, 92, 255, 0.2)',
    borderWidth: 1,
  },
  statusAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  userStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniAvatar: {
    fontSize: 14,
  },
  statusLabelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBannerMessage: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  weeklyComparisonSection: {
    gap: 6,
    paddingVertical: 4,
  },
  weeklySectionHeading: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysCols: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColHeader: {
    width: 22,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyRowLabel: {
    width: 60,
    fontSize: 11,
    fontWeight: '800',
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDoneYou: {
    backgroundColor: '#10B981',
  },
  progressDotDoneFriend: {
    backgroundColor: '#7C5CFF',
  },
  progressDotPendingDark: {
    backgroundColor: '#334155',
  },
  progressDotPendingLight: {
    backgroundColor: '#CBD5E1',
  },
  mutualActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 2,
  },
  markMyDoneBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  markMyDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  nudgeBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  nudgeBtnText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
  },
  celebratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  celebratedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
  habitsWrapper: {
    gap: 8,
    paddingTop: 4,
  },
  habitsSubHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  habitItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  habitIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitItemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  habitItemMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  followHabitBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  followHabitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  friendPillsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  friendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  friendPillActive: {
    backgroundColor: '#7C5CFF',
  },
  friendPillEmoji: {
    fontSize: 14,
  },
  friendPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetPillActive: {
    borderColor: '#7C5CFF',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    fontSize: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
        } as any)
      : {}),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeInput: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '800',
    width: 65,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
        } as any)
      : {}),
  },
  modalCreateBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
