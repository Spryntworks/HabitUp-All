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
import * as Clipboard from 'expo-clipboard';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import {
  getUserInviteCode,
  getWeekDays,
  formatDateKey,
  formatTo12Hour,
  formatFriendDisplayName,
} from '../../utils/streakCalculator';
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
  AlertCircle,
  ChevronLeft,
  UserMinus,
} from 'lucide-react-native';

const QUICK_HABIT_PRESETS = [
  { name: 'Morning 5km Run', icon: 'Activity', color: '#FF6B6B', time: '06:30' },
  { name: 'Deep Meditation', icon: 'Sparkles', color: '#7C5CFF', time: '07:00' },
  { name: 'Drink 3L Water', icon: 'Droplets', color: '#38BDF8', time: '09:00' },
  { name: 'Read 20 Pages', icon: 'BookOpen', color: '#F59E0B', time: '21:00' },
  { name: 'LeetCode Daily', icon: 'Cpu', color: '#10B981', time: '08:30' },
  { name: 'Strength Workout', icon: 'Dumbbell', color: '#EF4444', time: '18:00' },
];

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
    removeFriend,
    deleteHabit,
    setActiveTab,
    theme,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';
  const todayStr = useMemo(() => formatDateKey(new Date()), []);
  const currentWeekDays = useMemo(() => getWeekDays(new Date()), []);

  // Input for adding friend
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');

  // Remove friend confirmation state
  const [friendToRemove, setFriendToRemove] = useState<FriendUser | null>(null);

  // Modal for creating a habit together
  const [isTogetherModalOpen, setIsTogetherModalOpen] = useState<boolean>(false);
  const [selectedFriendForTogether, setSelectedFriendForTogether] = useState<FriendUser | null>(null);
  const [togetherHabitName, setTogetherHabitName] = useState<string>('');
  const [togetherHour, setTogetherHour] = useState<string>('08');
  const [togetherMinute, setTogetherMinute] = useState<string>('00');
  const [togetherPeriod, setTogetherPeriod] = useState<'AM' | 'PM'>('AM');
  const [togetherIcon, setTogetherIcon] = useState<string>('Target');
  const [togetherColor, setTogetherColor] = useState<string>('#7C5CFF');

  const myInviteCode = useMemo(() => {
    return getUserInviteCode(user);
  }, [user]);

  const connectedFriends = useMemo(() => {
    return friends.filter((f) => {
      if (!f.isFriend) return false;
      if (user?.id && f.id === user.id) return false;
      if (user?.email && f.email && f.email.toLowerCase() === user.email.toLowerCase()) return false;
      const myName = (user?.name || '').trim().toLowerCase();
      const fName = (f.name || '').trim().toLowerCase();
      const myHandle = myName.replace(/[^a-z0-9]/g, '');
      const fHandle = (f.username || '').replace(/^@/, '').toLowerCase();
      if (myHandle && fHandle && myHandle === fHandle) return false;
      if (myName && fName && myName === fName) return false;
      const myCode = getUserInviteCode(user).toLowerCase();
      const fCode = getUserInviteCode(f).toLowerCase();
      if (myCode && fCode && myCode === fCode) return false;
      return true;
    });
  }, [friends, user]);

  // Match ONLY habits that were explicitly created/followed with this friend
  const findMatchingMyHabit = (fh: FriendPublicHabit, friend: FriendUser): Habit | undefined => {
    const cleanName = fh.name.trim().toLowerCase();
    const fId = (friend.id || '').toLowerCase();
    const fName = (friend.name || '').trim().toLowerCase();
    const fEmail = (friend.email || '').trim().toLowerCase();
    return habits.find(
      (h) =>
        !h.deleted_at &&
        !h.archived_at &&
        h.is_shared &&
        h.name.trim().toLowerCase() === cleanName &&
        ((h.buddy_id && h.buddy_id.toLowerCase() === fId) ||
          (h.buddy_name && (h.buddy_name.toLowerCase() === fName || fName.includes(h.buddy_name.toLowerCase()) || h.buddy_name.toLowerCase().includes(fName))) ||
          (fEmail && h.buddy_id && h.buddy_id.toLowerCase() === fEmail))
    );
  };

  // Helper to check if current user completed a specific habit today
  const isMyHabitDoneToday = (habitId: string) => {
    return completions.some(
      (c) => c.habit_id === habitId && (c.completion_date || '').split('T')[0] === todayStr
    );
  };

  // Helper to get user's 7-day completion history for a specific habit
  const getMyHabitWeeklyHistory = (habitId: string): boolean[] => {
    return currentWeekDays.map((col) => {
      return completions.some(
        (c) => c.habit_id === habitId && (c.completion_date || '').split('T')[0] === col.key
      );
    });
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

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(myInviteCode);
      showToast(`Invite code ${myInviteCode} copied to clipboard! 📋`, undefined, 'success');
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(myInviteCode).catch(() => {});
      }
      showToast(`Invite code ${myInviteCode} copied! 📋`, undefined, 'success');
    }
  };

  const handleApplyPreset = (p: (typeof QUICK_HABIT_PRESETS)[0]) => {
    setTogetherHabitName(p.name);
    setTogetherIcon(p.icon);
    setTogetherColor(p.color);
    if (p.time) {
      const match = p.time.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        setTogetherHour(String(h).padStart(2, '0'));
        setTogetherMinute(m);
        setTogetherPeriod(period);
      }
    }
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

    let h = parseInt(togetherHour || '8', 10);
    if (isNaN(h) || h < 1 || h > 12) h = 8;
    if (togetherPeriod === 'PM' && h < 12) h += 12;
    if (togetherPeriod === 'AM' && h === 12) h = 0;
    const m = (togetherMinute || '00').padStart(2, '0');
    const standardTime = `${String(h).padStart(2, '0')}:${m}`;

    createSharedHabit(
      targetFriend.id,
      togetherHabitName.trim(),
      togetherIcon,
      togetherColor,
      standardTime
    );

    setIsTogetherModalOpen(false);
    setTogetherHabitName('');
    setTogetherHour('08');
    setTogetherMinute('00');
    setTogetherPeriod('AM');
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
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Users size={20} color="#7C5CFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Friends & Mutual Progress
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.backPill,
            {
              backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
          onPress={() => setActiveTab('home')}
        >
          <ChevronLeft size={16} color={isDark ? '#E2E8F0' : '#0F172A'} />
          <Text style={[styles.backPillText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Back
          </Text>
        </TouchableOpacity>
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
          <View style={styles.inputWrapper}>
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
              autoCorrect={false}
            />
            {friendCodeInput.length > 0 && (
              <TouchableOpacity
                style={styles.inputActionBtn}
                onPress={() => setFriendCodeInput('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.addFriendBtn} onPress={handleAddFriend}>
            <UserPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addFriendBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Friends List Heading */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          MY HABIT BUDDIES ({connectedFriends.length})
        </Text>
      </View>

      {/* 5. Friend Cards & Mutual Progress Trackers */}
      {connectedFriends.map((friend) => {
        const { displayName: friendDisplayName, usernameTag } = formatFriendDisplayName(friend);
        const myDisplayName = user?.name ? user.name.split(' ')[0] : 'You';

        // Separate habits into Shared/Adopted vs Not Adopted
        const sharedHabits: { friendHabit: FriendPublicHabit; myHabit: Habit }[] = [];
        const unadoptedHabits: FriendPublicHabit[] = [];

        friend.habits.forEach((fh) => {
          const myMatch = findMatchingMyHabit(fh, friend);
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
                <View style={styles.friendNameContainer}>
                  <View style={styles.friendNameStreakRow}>
                    <Text
                      style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {friendDisplayName}
                    </Text>
                    <View style={styles.streakFlameBadge}>
                      <Flame size={11} color="#FF6B6B" fill="#FF6B6B" />
                      <Text style={styles.streakFlameText}>{friend.currentStreak}d</Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.friendUserTag, { color: isDark ? '#94A3B8' : '#64748B' }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {usernameTag} • {friend.plantStage}
                  </Text>
                </View>
              </View>

              <View style={styles.friendHeaderRight}>
                <TouchableOpacity
                  style={[
                    styles.buddyTogetherBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={() => openTogetherWithFriend(friend)}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color="#7C5CFF" strokeWidth={3} />
                  <Text style={styles.buddyTogetherBtnText}>Together</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.removeFriendBtn,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
                  ]}
                  onPress={() => setFriendToRemove(friend)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove ${friendDisplayName}`}
                >
                  <UserMinus size={13} color="#EF4444" strokeWidth={2.5} />
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
                              Shared Routine • ⏰ {formatTo12Hour(friendHabit.reminder_time || '08:00')}
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
                              {myDisplayName} (You): {myDone ? 'Done ✅' : 'Pending ⏳'}
                            </Text>
                          </View>

                          {/* Friend */}
                          <View style={styles.userStatusPill}>
                            <Text style={styles.miniAvatar}>{friend.avatar}</Text>
                            <Text style={styles.statusLabelText}>
                              {friendDisplayName}: {friendDone ? 'Done ✅' : 'Pending ⏳'}
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
                            ? `⚡ You're done! ${friendDisplayName} is still working on it.`
                            : !myDone && friendDone
                            ? `⏳ ${friendDisplayName} completed today! Your turn to check in.`
                            : '⏳ Both pending today. Keep each other accountable!'}
                        </Text>
                      </View>

                      {/* 7-Day Weekly Comparison Progress Tracker */}
                      <View style={styles.weeklyComparisonSection}>
                        <Text style={[styles.weeklySectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          WEEKLY PROGRESS COMPARISON
                        </Text>

                        {/* Day Headers with Day Letter & Date Number */}
                        <View style={styles.daysHeaderRow}>
                          <View style={styles.weeklyRowSpacer} />
                          <View style={styles.daysCols}>
                            {currentWeekDays.map((item, i) => (
                              <View key={i} style={styles.dayColHeaderWrapper}>
                                <Text
                                  style={[
                                    styles.dayColHeader,
                                    { color: item.isToday ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
                                  ]}
                                >
                                  {item.dayName[0]}
                                </Text>
                                <Text
                                  style={[
                                    styles.dayDateHeader,
                                    {
                                      color: item.isToday
                                        ? '#7C5CFF'
                                        : isDark
                                        ? '#94A3B8'
                                        : '#475569',
                                      fontWeight: item.isToday ? '900' : '700',
                                    },
                                  ]}
                                >
                                  {item.dayNumber}
                                </Text>
                              </View>
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
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            You ({myDisplayName})
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
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {friendDisplayName}
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
                        {/* Unfollow button to selectively stop following this specific habit */}
                        <TouchableOpacity
                          style={[styles.unfollowBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                          onPress={() => {
                            deleteHabit(myHabit.id);
                            showToast(`Unfollowed "${friendHabit.name}". You can re-follow anytime below! 🤝`, undefined, 'info');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.unfollowBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            Unfollow
                          </Text>
                        </TouchableOpacity>

                        {/* 1. If Friend is pending, friendly Nudge button */}
                        {!friendDone && (
                          <TouchableOpacity
                            style={styles.nudgeBtn}
                            onPress={() => nudgeFriend(friend.id, friendHabit.name)}
                          >
                            <Bell size={13} color="#F59E0B" />
                            <Text style={styles.nudgeBtnText}>
                              👋 Nudge {friendDisplayName}
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

            {/* SECTION B: OTHER PUBLIC HABITS (AVAILABLE TO ADOPT/FOLLOW) */}
            {unadoptedHabits.length > 0 && (
              <View style={styles.habitsWrapper}>
                <View style={styles.habitsHeaderRow}>
                  <Text style={[styles.habitsSubHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    MORE HABITS FROM {friendDisplayName.toUpperCase()} ({unadoptedHabits.length})
                  </Text>
                  <Text style={[styles.habitsSubExplainer, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    Tap follow to join
                  </Text>
                </View>

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
                          🔥 {h.currentStreak}d streak • ⏰ {formatTo12Hour(h.reminder_time) || 'Daily'} • {h.isCompletedToday ? 'Done today ✅' : 'Pending today ⏳'}
                        </Text>
                      </View>
                    </View>

                    {/* 1-Tap Adopt / Follow Habit */}
                    <TouchableOpacity
                      style={styles.followHabitBtn}
                      onPress={() => adoptFriendHabit(h, friend.id, friendDisplayName, friend.avatar)}
                      activeOpacity={0.8}
                    >
                      <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.followHabitBtnText}>Follow Habit</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {sharedHabits.length === 0 && unadoptedHabits.length === 0 && (
              <View
                style={[
                  styles.noHabitsPromptBox,
                  { backgroundColor: isDark ? '#182438' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' },
                ]}
              >
                <Text style={[styles.noHabitsPromptText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  No active routines to follow yet.
                </Text>
                <TouchableOpacity
                  style={styles.noHabitsTogetherBtn}
                  onPress={() => openTogetherWithFriend(friend)}
                  activeOpacity={0.8}
                >
                  <Plus size={13} color="#7C5CFF" strokeWidth={3} />
                  <Text style={styles.noHabitsTogetherBtnText}>Start a Habit Together</Text>
                </TouchableOpacity>
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
                const { displayName: fDisplayName } = formatFriendDisplayName(f);
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
                      {fDisplayName}
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
                  onPress={() => handleApplyPreset(p)}
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

            {/* Reminder Time (12-Hour AM/PM Selector) */}
            <View
              style={[
                styles.togetherTimeBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.togetherTimeHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#7C5CFF" />
                  <Text style={[styles.togetherTimeTitle, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Daily Reminder Time
                  </Text>
                </View>
                <View
                  style={[
                    styles.timeBadge,
                    { backgroundColor: isDark ? '#0F172A' : '#EDE9FE' },
                  ]}
                >
                  <Text style={[styles.timeBadgeText, { color: '#7C5CFF' }]}>
                    {(togetherHour || '08').padStart(2, '0')}:{(togetherMinute || '00').padStart(2, '0')} {togetherPeriod}
                  </Text>
                </View>
              </View>

              <View style={styles.togetherTimePickerRow}>
                {/* Hour Input */}
                <View style={styles.timeUnitBox}>
                  <Text style={[styles.timeUnitLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Hour
                  </Text>
                  <TextInput
                    style={[
                      styles.timeUnitInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#4B5563' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                    value={togetherHour}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, '');
                      if (clean.length <= 2) {
                        const n = parseInt(clean, 10);
                        if (clean === '' || (n >= 1 && n <= 12)) setTogetherHour(clean);
                      }
                    }}
                    onBlur={() => {
                      if (!togetherHour || parseInt(togetherHour, 10) < 1) setTogetherHour('08');
                      else setTogetherHour(togetherHour.padStart(2, '0'));
                    }}
                    placeholder="08"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <Text style={[styles.timeColon, { color: isDark ? '#94A3B8' : '#64748B' }]}>:</Text>

                {/* Minute Input */}
                <View style={styles.timeUnitBox}>
                  <Text style={[styles.timeUnitLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Min
                  </Text>
                  <TextInput
                    style={[
                      styles.timeUnitInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#4B5563' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                    value={togetherMinute}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, '');
                      if (clean.length <= 2) {
                        const n = parseInt(clean, 10);
                        if (clean === '' || (n >= 0 && n <= 59)) setTogetherMinute(clean);
                      }
                    }}
                    onBlur={() => {
                      if (!togetherMinute) setTogetherMinute('00');
                      else setTogetherMinute(togetherMinute.padStart(2, '0'));
                    }}
                    placeholder="00"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                {/* AM / PM Toggle */}
                <View style={styles.periodToggleBox}>
                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      togetherPeriod === 'AM' && styles.periodBtnActive,
                      {
                        backgroundColor:
                          togetherPeriod === 'AM' ? '#7C5CFF' : isDark ? '#0F172A' : '#F1F5F9',
                        borderColor: togetherPeriod === 'AM' ? '#7C5CFF' : isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => setTogetherPeriod('AM')}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        { color: togetherPeriod === 'AM' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      togetherPeriod === 'PM' && styles.periodBtnActive,
                      {
                        backgroundColor:
                          togetherPeriod === 'PM' ? '#7C5CFF' : isDark ? '#0F172A' : '#F1F5F9',
                        borderColor: togetherPeriod === 'PM' ? '#7C5CFF' : isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => setTogetherPeriod('PM')}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        { color: togetherPeriod === 'PM' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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

      {/* 7. REMOVE FRIEND CONFIRMATION MODAL */}
      <Modal
        visible={!!friendToRemove}
        transparent
        animationType="fade"
        onRequestClose={() => setFriendToRemove(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalBox,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.confirmIconCircle}>
              <UserMinus size={26} color="#EF4444" strokeWidth={2.5} />
            </View>

            <Text style={[styles.confirmTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Remove Habit Buddy?
            </Text>

            <Text style={[styles.confirmMessage, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Are you sure you want to remove{' '}
              <Text style={{ fontWeight: '800', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                {friendToRemove ? formatFriendDisplayName(friendToRemove).displayName : 'this friend'}
              </Text>
              {friendToRemove ? ` (${formatFriendDisplayName(friendToRemove).usernameTag})` : ''}? You will no longer track mutual streaks together.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[
                  styles.confirmCancelBtn,
                  { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
                ]}
                onPress={() => setFriendToRemove(null)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.confirmCancelBtnText,
                    { color: isDark ? '#F1F5F9' : '#334155' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  if (friendToRemove) {
                    removeFriend(friendToRemove.id);
                    setFriendToRemove(null);
                  }
                }}
                activeOpacity={0.8}
              >
                <UserMinus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmDeleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 110,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    marginLeft: 8,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '800',
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
    gap: 8,
    flexWrap: 'wrap',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
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
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    fontSize: 13,
    paddingLeft: 14,
    paddingRight: 36,
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
  inputActionBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
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
    gap: 8,
  },
  friendProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  friendAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  friendAvatarEmoji: {
    fontSize: 18,
  },
  friendNameContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  friendNameStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  friendUserTag: {
    fontSize: 11,
    marginTop: 1,
  },
  friendHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  streakFlameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    flexShrink: 0,
  },
  streakFlameText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '900',
  },
  buddyTogetherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 3,
  },
  buddyTogetherBtnText: {
    color: '#7C5CFF',
    fontSize: 11,
    fontWeight: '800',
  },
  removeFriendBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  weeklyRowSpacer: {
    width: 48,
    flexShrink: 0,
  },
  daysCols: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayColHeaderWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dayColHeader: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  dayDateHeader: {
    fontSize: 10,
    textAlign: 'center',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  weeklyRowLabel: {
    width: 48,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 0,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    paddingTop: 4,
    marginTop: 2,
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
  unfollowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  unfollowBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  habitsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  habitsSubHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  habitsSubExplainer: {
    fontSize: 10,
    fontWeight: '600',
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
  noHabitsPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  noHabitsPromptText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noHabitsTogetherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
  },
  noHabitsTogetherBtnText: {
    color: '#7C5CFF',
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
  togetherTimeBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  togetherTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  togetherTimeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  togetherTimePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeUnitBox: {
    alignItems: 'center',
    gap: 2,
  },
  timeUnitLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeUnitInput: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '800',
    width: 52,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
      : {}),
  },
  timeColon: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 14,
  },
  periodToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    marginTop: 14,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  periodBtnActive: {
    borderColor: '#7C5CFF',
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '800',
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
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmDeleteBtn: {
    flex: 1.2,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
