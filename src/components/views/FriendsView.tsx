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
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from '../common/IconRenderer';
import { FriendUser } from '../../types';
import {
  Users,
  Flame,
  UserPlus,
  Share2,
  Check,
  Plus,
  X,
  Copy,
  Sparkles,
  Clock,
  Zap,
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
    friends,
    adoptFriendHabit,
    createSharedHabit,
    addFriendByCodeOrUsername,
    theme,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

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
    const prefix = user?.name ? user.name.slice(0, 3).toUpperCase() : 'UP';
    return `HABIT-${prefix}77`;
  }, [user]);

  // Set of lowercase habit names the user already has
  const myHabitNames = useMemo(() => {
    return new Set(
      habits
        .filter((h) => !h.deleted_at && !h.archived_at)
        .map((h) => h.name.trim().toLowerCase())
    );
  }, [habits]);

  const connectedFriends = useMemo(() => {
    return friends.filter((f) => f.isFriend);
  }, [friends]);

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
            Friends & Shared Habits
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Add friends with code, see routines & build streaks together
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
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              placeholder="Enter @username or invite code..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={friendCodeInput}
              onChangeText={setFriendCodeInput}
              autoCapitalize="none"
            />
          </View>

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

      {/* 5. Friend Cards & Their Habits */}
      {connectedFriends.map((friend) => (
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

          {/* Friend's Habits (With 1-Tap Follow Button) */}
          <View style={styles.habitsWrapper}>
            <Text style={[styles.habitsSubHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {friend.name.toUpperCase()}'S HABITS ({friend.habits.length})
            </Text>

            {friend.habits.map((h) => {
              const isAlreadyAdopted = myHabitNames.has(h.name.trim().toLowerCase());

              return (
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
                        🔥 {h.currentStreak} day streak • ⏰ {h.reminder_time || 'Daily'}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Follow / Clone Habit Button */}
                  <TouchableOpacity
                    style={[
                      styles.followHabitBtn,
                      isAlreadyAdopted && styles.followHabitBtnDone,
                    ]}
                    disabled={isAlreadyAdopted}
                    onPress={() => adoptFriendHabit(h, friend.name)}
                    activeOpacity={0.8}
                  >
                    {isAlreadyAdopted ? (
                      <>
                        <Check size={12} color="#10B981" strokeWidth={3} />
                        <Text style={styles.followHabitBtnTextDone}>Following</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={12} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.followHabitBtnText}>Follow Habit</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {connectedFriends.length === 0 && (
        <View style={styles.emptyCard}>
          <Users size={32} color="#7C5CFF" />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            No friends added yet
          </Text>
          <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Enter an invite code or username above to connect with habit buddies!
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
              Create a shared habit that both you and your friend follow and track together.
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
            <View
              style={[
                styles.modalInputWrapper,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                placeholder="e.g. Read 20 Pages, Morning Run..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={togetherHabitName}
                onChangeText={setTogetherHabitName}
              />
            </View>

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
  inputBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 13,
    paddingVertical: 0,
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
  habitsWrapper: {
    gap: 8,
    paddingTop: 2,
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
  followHabitBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  followHabitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  followHabitBtnTextDone: {
    color: '#10B981',
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
  modalInputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modalInput: {
    fontSize: 14,
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
