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
import { FriendUser, FriendPublicHabit, SocialFeedActivity } from '../../types';
import {
  Users,
  Flame,
  UserPlus,
  Search,
  Sparkles,
  Trophy,
  Share2,
  Check,
  Plus,
  X,
  Zap,
  Award,
} from 'lucide-react-native';

export const FriendsView: React.FC = () => {
  const {
    user,
    habits,
    friends,
    socialFeed,
    adoptFriendHabit,
    sendKudos,
    sendFriendRequest,
    theme,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

  // Navigation segment tab
  const [socialTab, setSocialTab] = useState<'feed' | 'friends' | 'discover' | 'leaderboard'>('feed');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState<boolean>(false);
  const [addFriendInput, setAddFriendInput] = useState<string>('');

  // Personal Habit Names for adoption detection
  const myHabitNames = useMemo(() => {
    return new Set(
      habits
        .filter((h) => !h.deleted_at && !h.archived_at)
        .map((h) => h.name.trim().toLowerCase())
    );
  }, [habits]);

  // Filtered lists
  const connectedFriends = useMemo(() => {
    return friends.filter((f) => f.isFriend);
  }, [friends]);

  const discoverFriends = useMemo(() => {
    return friends.filter((f) => !f.isFriend);
  }, [friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return connectedFriends;
    const q = searchQuery.toLowerCase();
    return connectedFriends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q)
    );
  }, [connectedFriends, searchQuery]);

  // Leaderboard ranking (including current user)
  const leaderboardData = useMemo(() => {
    const userBestStreak = habits.length > 0 ? 14 : 0;
    const currentUserEntry = {
      id: user?.id || 'me',
      name: (user?.name || 'You') + ' (You)',
      username: '@' + (user?.name?.toLowerCase().replace(/\s+/g, '_') || 'you'),
      avatar: user?.avatar || '🌟',
      streak: userBestStreak,
      totalCompletions: habits.length * 8,
      isMe: true,
      plantStage: '🌿 Healthy Sprout',
    };

    const friendEntries = connectedFriends.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      avatar: f.avatar,
      streak: f.currentStreak,
      totalCompletions: f.totalCompletions,
      isMe: false,
      plantStage: f.plantStage,
    }));

    return [currentUserEntry, ...friendEntries].sort(
      (a, b) => b.streak - a.streak || b.totalCompletions - a.totalCompletions
    );
  }, [user, habits, connectedFriends]);

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on HabitUp! Add my habit buddy code: HABIT-${user?.name?.slice(0, 3).toUpperCase() || 'UP'}77 and let's crush our goals together! 🔥`,
      });
    } catch {}
  };

  const handleSendCustomRequest = () => {
    if (!addFriendInput.trim()) return;
    const input = addFriendInput.trim().toLowerCase();
    const match = friends.find(
      (f) =>
        f.username.toLowerCase() === input ||
        f.username.toLowerCase() === `@${input}` ||
        f.email.toLowerCase() === input ||
        f.name.toLowerCase().includes(input)
    );

    if (match) {
      sendFriendRequest(match.id);
      setAddFriendInput('');
      setIsAddFriendModalOpen(false);
    } else {
      showToast(`Friend request sent to ${addFriendInput}! 🚀`, undefined, 'success');
      setAddFriendInput('');
      setIsAddFriendModalOpen(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
        <View>
          <View style={styles.headerTitleRow}>
            <Users size={22} color="#7C5CFF" />
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Friends & Community
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {connectedFriends.length} Habit {connectedFriends.length === 1 ? 'Buddy' : 'Buddies'} • Follow & share routines
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addFriendTopBtn}
          onPress={() => setIsAddFriendModalOpen(true)}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addFriendTopBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, socialTab === 'feed' && styles.segmentBtnActive]}
          onPress={() => setSocialTab('feed')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: socialTab === 'feed' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
              socialTab === 'feed' && styles.segmentTextActive,
            ]}
          >
            🔥 Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, socialTab === 'friends' && styles.segmentBtnActive]}
          onPress={() => setSocialTab('friends')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: socialTab === 'friends' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
              socialTab === 'friends' && styles.segmentTextActive,
            ]}
          >
            👥 Friends ({connectedFriends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, socialTab === 'discover' && styles.segmentBtnActive]}
          onPress={() => setSocialTab('discover')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: socialTab === 'discover' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
              socialTab === 'discover' && styles.segmentTextActive,
            ]}
          >
            ✨ Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, socialTab === 'leaderboard' && styles.segmentBtnActive]}
          onPress={() => setSocialTab('leaderboard')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: socialTab === 'leaderboard' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
              socialTab === 'leaderboard' && styles.segmentTextActive,
            ]}
          >
            🏆 Ranking
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: SOCIAL ACTIVITY FEED */}
        {socialTab === 'feed' && (
          <View style={styles.tabSection}>
            {socialFeed.map((item) => {
              const isAlreadyAdopted = myHabitNames.has(item.habitName.trim().toLowerCase());

              return (
                <View
                  key={item.id}
                  style={[
                    styles.feedCard,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  {/* Card Header: User Avatar & Info */}
                  <View style={styles.feedCardHeader}>
                    <View style={styles.feedUserLeft}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{item.friendAvatar}</Text>
                      </View>
                      <View>
                        <Text style={[styles.feedUserName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                          {item.friendName}
                        </Text>
                        <Text style={[styles.feedUsername, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {item.friendUsername} • {item.timestamp}
                        </Text>
                      </View>
                    </View>

                    {item.type === 'streak_milestone' && (
                      <View style={styles.milestoneBadge}>
                        <Flame size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.milestoneBadgeText}>{item.streakCount} Day Streak!</Text>
                      </View>
                    )}

                    {item.type === 'habit_adopted' && (
                      <View style={styles.adoptedBadge}>
                        <Zap size={12} color="#10B981" />
                        <Text style={styles.adoptedBadgeText}>Adopted Habit</Text>
                      </View>
                    )}
                  </View>

                  {/* Habit Content Box */}
                  <View
                    style={[
                      styles.feedHabitBox,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.feedHabitIcon,
                        { backgroundColor: item.habitColor || '#7C5CFF' },
                      ]}
                    >
                      <IconRenderer name={item.habitIcon} size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.feedHabitName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {item.habitName}
                      </Text>
                      <Text style={[styles.feedHabitDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {item.type === 'completed'
                          ? 'Completed today’s daily routine 🎯'
                          : item.type === 'streak_milestone'
                          ? `Maintained consistency for ${item.streakCount} days straight! 🔥`
                          : 'Joined the habit buddy routine! 🤝'}
                      </Text>
                    </View>
                  </View>

                  {/* Feed Actions Footer: Cheers/Kudos + Follow Habit */}
                  <View style={styles.feedCardFooter}>
                    {/* Kudos Cheering Button */}
                    <TouchableOpacity
                      style={[
                        styles.kudosBtn,
                        item.hasGivenKudos && styles.kudosBtnActive,
                        {
                          backgroundColor: item.hasGivenKudos
                            ? 'rgba(245, 158, 11, 0.15)'
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          borderColor: item.hasGivenKudos ? '#F59E0B' : isDark ? '#334155' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => sendKudos(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.kudosEmoji}>🔥</Text>
                      <Text
                        style={[
                          styles.kudosCountText,
                          { color: item.hasGivenKudos ? '#F59E0B' : isDark ? '#E2E8F0' : '#0F172A' },
                        ]}
                      >
                        {item.kudosCount} {item.kudosCount === 1 ? 'Cheer' : 'Cheers'}
                      </Text>
                    </TouchableOpacity>

                    {/* Follow / Adopt Habit Button */}
                    <TouchableOpacity
                      style={[
                        styles.adoptFeedBtn,
                        isAlreadyAdopted && styles.adoptFeedBtnDisabled,
                      ]}
                      disabled={isAlreadyAdopted}
                      onPress={() =>
                        adoptFriendHabit(
                          {
                            id: `adopted-${Date.now()}`,
                            name: item.habitName,
                            icon: item.habitIcon,
                            color: item.habitColor,
                            frequency_type: 'daily',
                            scheduled_days: [0, 1, 2, 3, 4, 5, 6],
                            reminder_time: '08:00',
                            currentStreak: 0,
                            isCompletedToday: false,
                            adoptersCount: 1,
                          },
                          item.friendName
                        )
                      }
                      activeOpacity={0.8}
                    >
                      {isAlreadyAdopted ? (
                        <>
                          <Check size={13} color="#10B981" strokeWidth={3} />
                          <Text style={styles.adoptFeedBtnTextDone}>In My Habits</Text>
                        </>
                      ) : (
                        <>
                          <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                          <Text style={styles.adoptFeedBtnText}>Follow Habit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: MY CONNECTED FRIENDS & THEIR HABITS */}
        {socialTab === 'friends' && (
          <View style={styles.tabSection}>
            {/* Search Friends Input */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Search size={16} color={isDark ? '#94A3B8' : '#64748B'} />
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                placeholder="Search friends by name or @username..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredFriends.map((friend) => (
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
                {/* Friend Header Profile */}
                <TouchableOpacity
                  style={styles.friendProfileRow}
                  onPress={() => setSelectedFriend(friend)}
                  activeOpacity={0.8}
                >
                  <View style={styles.friendProfileLeft}>
                    <View style={styles.friendAvatarBox}>
                      <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                    </View>
                    <View>
                      <Text style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {friend.name}
                      </Text>
                      <Text style={[styles.friendUsername, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {friend.username} • {friend.plantStage}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.friendStreakBadge}>
                    <Flame size={14} color="#FF6B6B" fill="#FF6B6B" />
                    <Text style={styles.friendStreakText}>{friend.currentStreak}d</Text>
                  </View>
                </TouchableOpacity>

                {/* Friend's Public Habits (With 1-Tap Adopt Feature) */}
                <View style={styles.friendHabitsSection}>
                  <Text style={[styles.friendHabitsTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    ACTIVE HABITS ({friend.habits.length})
                  </Text>

                  {friend.habits.map((habit) => {
                    const isAdopted = myHabitNames.has(habit.name.trim().toLowerCase());

                    return (
                      <View
                        key={habit.id}
                        style={[
                          styles.friendHabitItem,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: isDark ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.friendHabitLeft}>
                          <View
                            style={[
                              styles.friendHabitIcon,
                              { backgroundColor: habit.color || '#7C5CFF' },
                            ]}
                          >
                            <IconRenderer name={habit.icon} size={16} color="#FFFFFF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.friendHabitName,
                                { color: isDark ? '#FFFFFF' : '#0F172A' },
                              ]}
                            >
                              {habit.name}
                            </Text>
                            <Text
                              style={[
                                styles.friendHabitStreak,
                                { color: isDark ? '#94A3B8' : '#64748B' },
                              ]}
                            >
                              🔥 {habit.currentStreak} day streak • {habit.adoptersCount || 1} buddies
                            </Text>
                          </View>
                        </View>

                        {/* 1-Tap Follow / Adopt Button */}
                        <TouchableOpacity
                          style={[
                            styles.adoptBtn,
                            isAdopted && styles.adoptBtnDone,
                          ]}
                          disabled={isAdopted}
                          onPress={() => adoptFriendHabit(habit, friend.name)}
                          activeOpacity={0.8}
                        >
                          {isAdopted ? (
                            <>
                              <Check size={12} color="#10B981" strokeWidth={3} />
                              <Text style={styles.adoptBtnTextDone}>Following</Text>
                            </>
                          ) : (
                            <>
                              <Plus size={12} color="#FFFFFF" strokeWidth={3} />
                              <Text style={styles.adoptBtnText}>Follow Habit</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {filteredFriends.length === 0 && (
              <View style={styles.emptyCard}>
                <Users size={32} color="#7C5CFF" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  No friends found
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Try searching a different name or invite habit buddies.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: DISCOVER COMMUNITY & INVITE */}
        {socialTab === 'discover' && (
          <View style={styles.tabSection}>
            {/* Share Invite Card */}
            <View
              style={[
                styles.inviteCard,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.inviteIconBox}>
                <Share2 size={22} color="#7C5CFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inviteTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Invite Habit Buddies
                </Text>
                <Text style={[styles.inviteSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Your invite code: <Text style={{ fontWeight: '800', color: '#7C5CFF' }}>HABIT-{user?.name?.slice(0, 3).toUpperCase() || 'UP'}77</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Suggested Habit Builders */}
            <Text style={[styles.sectionHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              SUGGESTED HABIT BUDDIES ({discoverFriends.length})
            </Text>

            {discoverFriends.map((person) => (
              <View
                key={person.id}
                style={[
                  styles.discoverCard,
                  {
                    backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.discoverTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{person.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.discoverName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {person.name}
                    </Text>
                    <Text style={[styles.discoverUsername, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {person.username} • {person.plantStage}
                    </Text>
                    {person.bio && (
                      <Text style={[styles.discoverBio, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {person.bio}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => sendFriendRequest(person.id)}
                  >
                    <UserPlus size={14} color="#FFFFFF" />
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>

                {/* Habits preview */}
                <View style={styles.discoverHabitsRow}>
                  {person.habits.map((h) => (
                    <View
                      key={h.id}
                      style={[
                        styles.discoverHabitPill,
                        { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                      ]}
                    >
                      <Text style={styles.discoverHabitPillText}>
                        {h.name} (🔥 {h.currentStreak}d)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: LEADERBOARD & ACCOUNTABILITY RANKING */}
        {socialTab === 'leaderboard' && (
          <View style={styles.tabSection}>
            <View
              style={[
                styles.leaderboardCard,
                {
                  backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.leaderboardHeader}>
                <Trophy size={20} color="#F59E0B" />
                <Text style={[styles.leaderboardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Weekly Streak Leaderboard
                </Text>
              </View>

              {leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.leaderboardRow,
                      entry.isMe && styles.leaderboardRowMe,
                      {
                        borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
                        backgroundColor: entry.isMe
                          ? 'rgba(124, 92, 255, 0.12)'
                          : 'transparent',
                      },
                    ]}
                  >
                    {/* Rank Badge */}
                    <View style={styles.rankCol}>
                      <Text style={[styles.rankText, isTop3 && { fontSize: 16 }]}>
                        {medalEmoji}
                      </Text>
                    </View>

                    {/* User Avatar & Name */}
                    <View style={styles.leaderUserCol}>
                      <Text style={styles.leaderAvatar}>{entry.avatar}</Text>
                      <View>
                        <Text
                          style={[
                            styles.leaderName,
                            { color: entry.isMe ? '#7C5CFF' : isDark ? '#FFFFFF' : '#0F172A' },
                          ]}
                        >
                          {entry.name}
                        </Text>
                        <Text style={[styles.leaderSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          {entry.plantStage}
                        </Text>
                      </View>
                    </View>

                    {/* Streak Flame */}
                    <View style={styles.leaderStreakCol}>
                      <Flame size={15} color="#FF6B6B" fill="#FF6B6B" />
                      <Text style={[styles.leaderStreakText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {entry.streak}d
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FRIEND DETAIL MODAL */}
      <Modal visible={!!selectedFriend} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            {selectedFriend && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Friend Profile
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedFriend(null)}>
                    <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }}>
                  <View style={styles.modalProfileHeader}>
                    <View style={styles.modalAvatarBox}>
                      <Text style={styles.modalAvatarText}>{selectedFriend.avatar}</Text>
                    </View>
                    <Text style={[styles.modalFriendName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {selectedFriend.name}
                    </Text>
                    <Text style={[styles.modalFriendUser, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {selectedFriend.username} • {selectedFriend.email}
                    </Text>
                    {selectedFriend.bio && (
                      <Text style={[styles.modalFriendBio, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                        "{selectedFriend.bio}"
                      </Text>
                    )}
                  </View>

                  <View style={styles.statsRowModal}>
                    <View style={[styles.statBoxModal, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                      <Flame size={18} color="#FF6B6B" fill="#FF6B6B" />
                      <Text style={[styles.statNumModal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {selectedFriend.currentStreak} Days
                      </Text>
                      <Text style={styles.statLabelModal}>Best Streak</Text>
                    </View>

                    <View style={[styles.statBoxModal, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                      <Award size={18} color="#7C5CFF" />
                      <Text style={[styles.statNumModal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {selectedFriend.totalCompletions}
                      </Text>
                      <Text style={styles.statLabelModal}>Completions</Text>
                    </View>
                  </View>

                  <Text style={[styles.modalHabitsHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    PUBLIC ROUTINES ({selectedFriend.habits.length})
                  </Text>

                  {selectedFriend.habits.map((h) => {
                    const isAdopted = myHabitNames.has(h.name.trim().toLowerCase());
                    return (
                      <View
                        key={h.id}
                        style={[
                          styles.modalHabitCard,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: isDark ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View
                            style={[
                              styles.friendHabitIcon,
                              { backgroundColor: h.color || '#7C5CFF' },
                            ]}
                          >
                            <IconRenderer name={h.icon} size={16} color="#FFFFFF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.friendHabitName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                              {h.name}
                            </Text>
                            <Text style={[styles.friendHabitStreak, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                              ⏰ {h.reminder_time || 'Daily'} • {h.description || 'Consistent routine'}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.adoptBtn, isAdopted && styles.adoptBtnDone]}
                          disabled={isAdopted}
                          onPress={() => {
                            adoptFriendHabit(h, selectedFriend.name);
                            setSelectedFriend(null);
                          }}
                        >
                          {isAdopted ? (
                            <Text style={styles.adoptBtnTextDone}>✓ In Habits</Text>
                          ) : (
                            <Text style={styles.adoptBtnText}>Follow</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedFriend(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ADD FRIEND MODAL */}
      <Modal visible={isAddFriendModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Add Habit Buddy
              </Text>
              <TouchableOpacity onPress={() => setIsAddFriendModalOpen(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.addModalDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Enter your friend's @username, email, or HabitUp invite code to connect and follow routines.
            </Text>

            <View
              style={[
                styles.addInputWrapper,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <TextInput
                style={[styles.addInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                placeholder="e.g. @alex_runner or sarah@gmail.com"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={addFriendInput}
                onChangeText={setAddFriendInput}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.sendRequestBtn}
              onPress={handleSendCustomRequest}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.sendRequestBtnText}>Send Friend Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inviteLinkBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={() => {
                setIsAddFriendModalOpen(false);
                handleShareInvite();
              }}
            >
              <Share2 size={16} color="#7C5CFF" />
              <Text style={[styles.inviteLinkBtnText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Share My HabitUp Invite Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  addFriendTopBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  addFriendTopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#7C5CFF',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  tabSection: {
    gap: 12,
  },
  feedCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  feedUserName: {
    fontSize: 14,
    fontWeight: '800',
  },
  feedUsername: {
    fontSize: 11,
    marginTop: 1,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  milestoneBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  adoptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adoptedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  feedHabitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  feedHabitIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedHabitName: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedHabitDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  feedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  kudosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  kudosBtnActive: {
    borderColor: '#F59E0B',
  },
  kudosEmoji: {
    fontSize: 14,
  },
  kudosCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  adoptFeedBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 5,
  },
  adoptFeedBtnDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  adoptFeedBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adoptFeedBtnTextDone: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
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
  },
  friendAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 20,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
  },
  friendUsername: {
    fontSize: 11,
    marginTop: 1,
  },
  friendStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  friendStreakText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '900',
  },
  friendHabitsSection: {
    gap: 8,
    paddingTop: 4,
  },
  friendHabitsTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  friendHabitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  friendHabitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  friendHabitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendHabitName: {
    fontSize: 13,
    fontWeight: '800',
  },
  friendHabitStreak: {
    fontSize: 10,
    marginTop: 1,
  },
  adoptBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  adoptBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  adoptBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adoptBtnTextDone: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  inviteIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  inviteSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  shareBtn: {
    backgroundColor: '#7C5CFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  discoverCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  discoverTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  discoverName: {
    fontSize: 14,
    fontWeight: '800',
  },
  discoverUsername: {
    fontSize: 11,
    marginTop: 1,
  },
  discoverBio: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  connectBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  discoverHabitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  discoverHabitPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discoverHabitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C5CFF',
  },
  leaderboardCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leaderboardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  leaderboardRowMe: {
    borderLeftWidth: 3,
    borderLeftColor: '#7C5CFF',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#94A3B8',
  },
  leaderUserCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  leaderAvatar: {
    fontSize: 20,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '800',
  },
  leaderSub: {
    fontSize: 10,
    marginTop: 1,
  },
  leaderStreakCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderStreakText: {
    fontSize: 13,
    fontWeight: '900',
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalProfileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    fontSize: 28,
  },
  modalFriendName: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalFriendUser: {
    fontSize: 12,
    marginTop: 2,
  },
  modalFriendBio: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsRowModal: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBoxModal: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumModal: {
    fontSize: 15,
    fontWeight: '900',
  },
  statLabelModal: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalHabitsHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  modalHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalCloseBtn: {
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 12,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  addModalDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  addInputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  addInput: {
    fontSize: 14,
  },
  sendRequestBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 6,
    marginBottom: 10,
  },
  sendRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inviteLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  inviteLinkBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
