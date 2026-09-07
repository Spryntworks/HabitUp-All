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
  ActivityIndicator,
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
import { localApi } from '../../services/apiService';
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
  ChevronLeft,
  UserMinus,
  Lock,
  UserCheck,
  AtSign,
  Search,
  UserX,
  Calendar,
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
    friends,
    incomingRequests,
    sendFriendRequestByUsername,
    acceptFollowRequest,
    declineFollowRequest,
    unfollowFriendHabit,
    adoptFriendHabit,
    createSharedHabit,
    nudgeFriend,
    removeFriend,
    setActiveTab,
    theme,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';
  const todayStr = useMemo(() => formatDateKey(new Date()), []);
  const currentWeekDays = useMemo(() => getWeekDays(new Date()), []);

  // Search by username state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string; name?: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [followingMap, setFollowingMap] = useState<Record<string, 'loading' | 'requested' | 'following'>>({});

  // Remove friend confirmation state
  const [friendToRemove, setFriendToRemove] = useState<FriendUser | null>(null);

  // Modal for Viewing Shared Habit Progress / Calendar
  const [selectedSharedHabitProgress, setSelectedSharedHabitProgress] = useState<{
    friendHabit: FriendPublicHabit;
    myHabit: Habit;
    friend: FriendUser;
  } | null>(null);

  // Modal for creating a habit together
  const [isTogetherModalOpen, setIsTogetherModalOpen] = useState<boolean>(false);
  const [selectedFriendForTogether, setSelectedFriendForTogether] = useState<FriendUser | null>(null);
  const [togetherHabitName, setTogetherHabitName] = useState<string>('');
  const [togetherHour, setTogetherHour] = useState<string>('08');
  const [togetherMinute, setTogetherMinute] = useState<string>('00');
  const [togetherPeriod, setTogetherPeriod] = useState<'AM' | 'PM'>('AM');
  const [togetherIcon, setTogetherIcon] = useState<string>('Target');
  const [togetherColor, setTogetherColor] = useState<string>('#7C5CFF');

  const myUsername = useMemo(() => {
    if (user?.username) {
      return user.username.startsWith('@') ? user.username : `@${user.username}`;
    }
    const clean = (user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `@${clean || 'user'}`;
  }, [user]);

  const connectedFriends = useMemo(() => {
    const myId = (user?.id || '').toLowerCase();
    const myEmail = (user?.email || '').trim().toLowerCase();
    const myUsername = (user?.username || '').replace(/^@/, '').trim().toLowerCase();

    return friends.filter((f) => {
      if (!f || !f.id) return false;
      if (!f.isFriend && f.requestStatus !== 'pending_sent') return false;
      if (f.requestStatus === 'none') return false;

      const fId = (f.id || '').toLowerCase();
      const fEmail = (f.email || '').trim().toLowerCase();
      const fUsername = (f.username || '').replace(/^@/, '').trim().toLowerCase();

      // Exclude only the exact current user
      if (myId && fId === myId) return false;
      if (myEmail && fEmail && fEmail === myEmail) return false;
      if (myUsername && fUsername && fUsername === myUsername) return false;

      return true;
    });
  }, [friends, user]);

  const handlePerformSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim().replace(/^@/, '');
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      // 1. Search backend /users/search endpoint
      const serverResults = await localApi.searchUsersByUsername(q);

      // 1b. Direct profile lookup as secondary check if search query returned 0 results
      let directUser: { id: string; username: string; total_habits?: number; current_streak?: number } | null = null;
      if (serverResults.length === 0 && q.length >= 2) {
        directUser = await localApi.fetchUserProfileByUsername(q);
      }

      // 2. Search local friends / mock users for instant offline matching
      const localMatches: Array<{ id: string; username: string; name?: string }> = friends
        .filter((f) => {
          const u = (f.username || '').replace(/^@/, '').toLowerCase();
          const n = (f.name || '').toLowerCase();
          return u === q.toLowerCase() || u.includes(q.toLowerCase()) || n.includes(q.toLowerCase());
        })
        .map((f) => ({
          id: f.id,
          username: (f.username || '').replace(/^@/, '') || f.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          name: f.name,
        }));

      const combined: Array<{ id: string; username: string; name?: string }> = [...serverResults];
      if (directUser && !combined.some((r) => r.username.toLowerCase() === directUser!.username.toLowerCase())) {
        combined.push({
          id: directUser.id,
          username: directUser.username,
          name: directUser.username,
        });
      }
      for (const lm of localMatches) {
        if (!combined.some((r) => r.username.toLowerCase() === lm.username.toLowerCase())) {
          combined.push(lm);
        }
      }

      // Filter out self
      const myClean = (user?.username || '').replace(/^@/, '').toLowerCase();
      const filtered = combined.filter((r) => r.username.toLowerCase() !== myClean);

      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowUserFromSearch = async (targetUsername: string, targetId?: string) => {
    const clean = targetUsername.trim().replace(/^@/, '');
    if (!clean) return;
    setFollowingMap((prev) => ({ ...prev, [clean]: 'loading' }));
    try {
      const res = await sendFriendRequestByUsername(clean);
      if (res.success) {
        setFollowingMap((prev) => ({ ...prev, [clean]: 'requested' }));
      } else {
        setFollowingMap((prev) => {
          const copy = { ...prev };
          delete copy[clean];
          return copy;
        });
      }
    } catch {
      setFollowingMap((prev) => {
        const copy = { ...prev };
        delete copy[clean];
        return copy;
      });
    }
  };

  const getFollowStatusForUser = (targetUsername: string) => {
    const clean = targetUsername.replace(/^@/, '').toLowerCase();
    if (followingMap[clean]) return followingMap[clean];
    const existing = friends.find((f) => {
      const fUser = (f.username || '').replace(/^@/, '').toLowerCase();
      return fUser === clean;
    });
    if (existing) {
      if (existing.isFriend && existing.requestStatus === 'accepted') return 'following';
      if (existing.requestStatus === 'pending_sent') return 'requested';
      if (existing.requestStatus === 'pending_received') return 'requested';
    }
    return 'none';
  };

  // Match ONLY habits that were explicitly created/followed with this friend
  const findMatchingMyHabit = (fh: FriendPublicHabit, friend: FriendUser): Habit | undefined => {
    const cleanName = fh.name.trim().toLowerCase();
    const fId = (friend.id || '').toLowerCase();
    const fName = (friend.name || '').trim().toLowerCase();
    const fUsername = (friend.username || '').replace(/^@/, '').trim().toLowerCase();
    const fEmail = (friend.email || '').trim().toLowerCase();
    return habits.find(
      (h) =>
        !h.deleted_at &&
        !h.archived_at &&
        h.is_shared &&
        h.name.trim().toLowerCase() === cleanName &&
        ((h.buddy_id && (
          h.buddy_id.toLowerCase() === fId ||
          (fUsername && h.buddy_id.toLowerCase().includes(fUsername)) ||
          (fEmail && h.buddy_id.toLowerCase() === fEmail)
        )) ||
          (h.buddy_name && (
            h.buddy_name.toLowerCase() === fName ||
            (fUsername && h.buddy_name.toLowerCase() === fUsername) ||
            fName.includes(h.buddy_name.toLowerCase()) ||
            h.buddy_name.toLowerCase().includes(fName)
          )) ||
          (!h.buddy_id && !h.buddy_name))
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

  const handleShareUsername = async () => {
    try {
      await Share.share({
        message: `Follow my habit streaks on HabitUp! My username is ${myUsername}. Follow me to share routines! 🤝`,
      });
    } catch {}
  };

  const handleCopyUsername = async () => {
    try {
      await Clipboard.setStringAsync(myUsername);
      showToast(`Username ${myUsername} copied to clipboard! 📋`, undefined, 'success');
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(myUsername).catch(() => {});
      }
      showToast(`Username ${myUsername} copied! 📋`, undefined, 'success');
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
      showToast('Please select or follow a friend first', undefined, 'info');
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
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Friends & Habit Following
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

      {/* 2. Search by Username */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.searchInputRow}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputPrefixIcon}>
              <Search size={16} color={isDark ? '#94A3B8' : '#64748B'} />
            </View>
            <TextInput
              style={[
                styles.input,
                styles.inputWithPrefix,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                },
              ]}
              placeholder="Search by @username..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={(txt) => {
                setSearchQuery(txt);
                if (txt.trim().length >= 2) {
                  handlePerformSearch(txt);
                } else if (txt.trim().length === 0) {
                  setSearchResults([]);
                  setHasSearched(false);
                }
              }}
              onSubmitEditing={() => handlePerformSearch()}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.inputActionBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchActionBtn, isSearching && { opacity: 0.7 }]}
            onPress={() => handlePerformSearch()}
            disabled={isSearching}
            activeOpacity={0.8}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Search size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.searchActionBtnText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsWrapper}>
            <Text style={[styles.searchResultsTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              SEARCH RESULTS ({searchResults.length})
            </Text>
            {searchResults.map((item) => {
              const status = getFollowStatusForUser(item.username);
              const cleanHandle = item.username.replace(/^@/, '');
              const initial = (item.name || item.username || 'U').charAt(0).toUpperCase();

              return (
                <View
                  key={item.id || item.username}
                  style={[
                    styles.searchResultItem,
                    {
                      backgroundColor: isDark ? '#1A2438' : '#F8FAFC',
                      borderColor: isDark ? '#2D3B55' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.searchResultItemLeft}>
                    <View style={styles.searchResultAvatar}>
                      <Text style={styles.searchResultAvatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.searchResultName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                        numberOfLines={1}
                      >
                        {item.name || `@${cleanHandle}`}
                      </Text>
                      <Text style={[styles.searchResultHandle, { color: '#7C5CFF' }]}>
                        @{cleanHandle}
                      </Text>
                    </View>
                  </View>

                  {status === 'following' ? (
                    <View style={styles.followingPill}>
                      <UserCheck size={13} color="#10B981" />
                      <Text style={styles.followingPillText}>Following</Text>
                    </View>
                  ) : status === 'requested' ? (
                    <View style={styles.requestedPill}>
                      <Clock size={13} color="#F59E0B" />
                      <Text style={styles.requestedPillText}>Requested</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.followResultBtn,
                        status === 'loading' && { opacity: 0.7 },
                      ]}
                      onPress={() => handleFollowUserFromSearch(cleanHandle, item.id)}
                      disabled={status === 'loading'}
                      activeOpacity={0.8}
                    >
                      {status === 'loading' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <UserPlus size={13} color="#FFFFFF" strokeWidth={2.5} />
                          <Text style={styles.followResultBtnText}>Follow</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {hasSearched && searchResults.length === 0 && !isSearching && searchQuery.trim().length > 0 && (
          <View
            style={[
              styles.noResultsBox,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
              },
            ]}
          >
            <View style={styles.noResultsIconCircle}>
              <UserX size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noResultsTitle, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                {searchQuery.trim().replace(/^@/, '').toLowerCase() === (user?.username || '').replace(/^@/, '').toLowerCase()
                  ? 'This is your own username'
                  : "Username doesn't exist"}
              </Text>
              <Text style={[styles.noResultsSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {searchQuery.trim().replace(/^@/, '').toLowerCase() === (user?.username || '').replace(/^@/, '').toLowerCase()
                  ? 'You cannot follow your own profile.'
                  : `No HabitUp account found for @${searchQuery.trim().replace(/^@/, '')}. Please check the spelling.`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. Incoming Follow Requests Card (Instagram-Style Approvals) */}
      {incomingRequests.length > 0 && (
        <View
          style={[
            styles.incomingCard,
            {
              backgroundColor: isDark ? '#162238' : '#F0FDF4',
              borderColor: isDark ? '#10B981' : '#86EFAC',
            },
          ]}
        >
          <View style={styles.incomingHeaderRow}>
            <View style={styles.incomingBadge}>
              <UserCheck size={14} color="#10B981" />
              <Text style={styles.incomingBadgeText}>
                INCOMING FOLLOW REQUESTS ({incomingRequests.length})
              </Text>
            </View>
            <Text style={[styles.incomingNoticeSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Accept to unlock each other's habits
            </Text>
          </View>

          <View style={styles.incomingList}>
            {incomingRequests.map((req) => {
              const reqHandle = req.fromUsername.startsWith('@')
                ? req.fromUsername
                : `@${req.fromUsername}`;
              return (
                <View
                  key={req.id}
                  style={[
                    styles.incomingItemRow,
                    {
                      backgroundColor: isDark ? '#1F2E4A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#DCFCE7',
                    },
                  ]}
                >
                  <View style={styles.incomingItemLeft}>
                    <View style={styles.incomingAvatarCircle}>
                      <Text style={styles.incomingAvatarEmoji}>{req.fromAvatar || '🤝'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.incomingName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                        numberOfLines={1}
                      >
                        {req.fromName}
                      </Text>
                      <Text
                        style={[styles.incomingUsername, { color: '#10B981' }]}
                        numberOfLines={1}
                      >
                        {reqHandle} • Wants to follow you
                      </Text>
                    </View>
                  </View>

                  <View style={styles.incomingActionButtons}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => acceptFollowRequest(req.id, req.fromUsername)}
                      activeOpacity={0.8}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.declineBtn,
                        { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                      ]}
                      onPress={() => declineFollowRequest(req.id)}
                      activeOpacity={0.8}
                    >
                      <X size={14} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. Friends List Heading */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          HABIT BUDDIES ({connectedFriends.length})
        </Text>
      </View>

      {/* 5. Friend Cards & Mutual Progress Trackers */}
      {connectedFriends.map((friend) => {
        const { displayName: friendDisplayName, usernameTag } = formatFriendDisplayName(friend);
        const myDisplayName = user?.name ? user.name.split(' ')[0] : 'You';
        const isPendingSent = friend.requestStatus === 'pending_sent';

        // Separate habits into Shared/Adopted vs Not Adopted (Strictly 1 habit per unique name)
        const sharedHabits: { friendHabit: FriendPublicHabit; myHabit: Habit }[] = [];
        const unadoptedHabits: FriendPublicHabit[] = [];
        const seenHabitNames = new Set<string>();

        if (!isPendingSent && Array.isArray(friend.habits)) {
          // Deduplicate friend habits first
          const uniqueFriendHabits: FriendPublicHabit[] = [];
          const nameMap = new Map<string, FriendPublicHabit>();
          for (const fh of friend.habits) {
            const k = (fh.name || '').trim().toLowerCase();
            if (!k) continue;
            if (!nameMap.has(k)) {
              nameMap.set(k, fh);
              uniqueFriendHabits.push(fh);
            } else {
              const ex = nameMap.get(k)!;
              if ((fh.currentStreak || 0) > (ex.currentStreak || 0) || (fh.isCompletedToday && !ex.isCompletedToday)) {
                nameMap.set(k, fh);
                const idx = uniqueFriendHabits.findIndex((h) => (h.name || '').trim().toLowerCase() === k);
                if (idx >= 0) uniqueFriendHabits[idx] = fh;
              }
            }
          }

          uniqueFriendHabits.forEach((fh) => {
            const cleanName = (fh.name || '').trim().toLowerCase();
            if (seenHabitNames.has(cleanName)) return;
            seenHabitNames.add(cleanName);

            const myMatch = findMatchingMyHabit(fh, friend);
            if (myMatch) {
              sharedHabits.push({ friendHabit: fh, myHabit: myMatch });
            } else {
              unadoptedHabits.push(fh);
            }
          });
        }

        return (
          <View
            key={friend.id}
            style={[
              styles.friendCard,
              {
                backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                borderColor: isPendingSent
                  ? isDark
                    ? '#F59E0B'
                    : '#FCD34D'
                  : isDark
                  ? '#1E293B'
                  : '#E2E8F0',
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
                    {isPendingSent ? (
                      <View style={styles.pendingBadge}>
                        <Clock size={11} color="#F59E0B" />
                        <Text style={styles.pendingBadgeText}>Requested ⏳</Text>
                      </View>
                    ) : (
                      <View style={styles.streakFlameBadge}>
                        <Flame size={11} color="#FF6B6B" fill="#FF6B6B" />
                        <Text style={styles.streakFlameText}>{friend.currentStreak}d</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.friendUserTag, { color: isDark ? '#94A3B8' : '#64748B' }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {usernameTag} {friend.plantStage ? `• ${friend.plantStage}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.friendHeaderRight}>
                {!isPendingSent && (
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
                )}

                <TouchableOpacity
                  style={[
                    styles.removeFriendBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA',
                    },
                  ]}
                  onPress={() => setFriendToRemove(friend)}
                  activeOpacity={0.7}
                  accessibilityLabel={isPendingSent ? `Cancel request to ${friendDisplayName}` : `Unfollow ${friendDisplayName}`}
                >
                  <UserMinus size={11} color="#EF4444" strokeWidth={2.5} />
                  <Text style={styles.removeFriendBtnText}>
                    {isPendingSent ? 'Cancel' : 'Unfollow'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PENDING REQUEST LOCK NOTICE */}
            {isPendingSent ? (
              <View
                style={[
                  styles.lockedNoticeBox,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FEF3C7',
                    borderColor: isDark ? '#78350F' : '#FDE68A',
                  },
                ]}
              >
                <View style={styles.lockedIconWrapper}>
                  <Lock size={16} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.lockedNoticeTitle,
                      { color: isDark ? '#FDE68A' : '#92400E' },
                    ]}
                  >
                    Follow Request Pending
                  </Text>
                  <Text
                    style={[
                      styles.lockedNoticeText,
                      { color: isDark ? '#D6D3D1' : '#B45309' },
                    ]}
                  >
                    Habits and routines will unlock once {friendDisplayName} accepts your request.
                  </Text>
                </View>
              </View>
            ) : (
              <>

            {/* SECTION A: MUTUAL HABITS */}
            {sharedHabits.length > 0 && (
              <View style={styles.habitsWrapper}>
                <View style={styles.habitsHeaderRow}>
                  <Text style={[styles.habitsSubHeading, { color: '#10B981' }]}>
                    MUTUAL HABITS ({sharedHabits.length} SHARED)
                  </Text>
                  <Text style={[styles.habitsSubExplainer, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    Active routines
                  </Text>
                </View>

                {sharedHabits.map(({ friendHabit, myHabit }) => {
                  return (
                    <TouchableOpacity
                      key={friendHabit.id}
                      style={[
                        styles.habitItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setSelectedSharedHabitProgress({ friendHabit, myHabit, friend })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.habitItemLeft}>
                        <View
                          style={[
                            styles.habitIconBox,
                            { backgroundColor: friendHabit.color || '#7C5CFF' },
                          ]}
                        >
                          <IconRenderer name={friendHabit.icon} size={16} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                          <Text
                            style={[
                              styles.habitItemName,
                              { color: isDark ? '#FFFFFF' : '#0F172A' },
                            ]}
                            numberOfLines={1}
                          >
                            {friendHabit.name}
                          </Text>
                          <View style={styles.mutualSubtitleRow}>
                            <Clock size={11} color={isDark ? '#94A3B8' : '#64748B'} />
                            <Text
                              style={[
                                styles.mutualHabitSub,
                                { color: isDark ? '#94A3B8' : '#64748B' },
                              ]}
                            >
                              {formatTo12Hour(friendHabit.reminder_time || '08:00')}
                            </Text>
                            {friendHabit.currentStreak > 0 && (
                              <>
                                <Text style={{ color: isDark ? '#475569' : '#CBD5E1', fontSize: 10 }}>•</Text>
                                <Flame size={11} color="#F59E0B" fill="#F59E0B" />
                                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>
                                  {friendHabit.currentStreak}d streak
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* View Progress Button */}
                      <TouchableOpacity
                        style={[
                          styles.viewProgressBtn,
                          {
                            backgroundColor: isDark ? '#2D3A50' : '#EEF2FF',
                            borderColor: isDark ? '#3E4F6D' : '#C7D2FE',
                          },
                        ]}
                        onPress={() => setSelectedSharedHabitProgress({ friendHabit, myHabit, friend })}
                        activeOpacity={0.7}
                      >
                        <Calendar size={13} color="#6366F1" />
                        <Text style={styles.viewProgressBtnText}>View Progress</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* SECTION B: UNFOLLOWED / AVAILABLE PUBLIC HABITS */}
            {unadoptedHabits.length > 0 && (
              <View style={styles.habitsWrapper}>
                <View style={styles.habitsHeaderRow}>
                  <Text style={[styles.habitsSubHeading, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {sharedHabits.length > 0
                      ? `MORE HABITS FROM ${friendDisplayName.toUpperCase()} (${unadoptedHabits.length})`
                      : `HABITS FROM ${friendDisplayName.toUpperCase()} (${unadoptedHabits.length})`}
                  </Text>
                  <Text style={[styles.habitsSubExplainer, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    Follow to join
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
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text
                          style={[styles.habitItemName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                          numberOfLines={1}
                        >
                          {h.name}
                        </Text>
                        <View style={styles.mutualSubtitleRow}>
                          <Clock size={11} color={isDark ? '#94A3B8' : '#64748B'} />
                          <Text
                            style={[
                              styles.mutualHabitSub,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                          >
                            {formatTo12Hour(h.reminder_time || '08:00')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 1-Tap Adopt / Follow Habit */}
                    <TouchableOpacity
                      style={styles.followHabitBtn}
                      onPress={() => adoptFriendHabit(h, friend.id, friendDisplayName, friend.avatar)}
                      activeOpacity={0.8}
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
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
              </>
            )}
          </View>
        );
      })}

      {connectedFriends.length === 0 && (
        <View style={styles.emptyCard}>
          <Users size={32} color="#7C5CFF" />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            No friends followed yet
          </Text>
          <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Enter an @username above to send a follow request and share habit routines!
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
              {connectedFriends
                .filter((f) => f.requestStatus !== 'pending_sent')
                .map((f) => {
                  const { displayName: fDisplayName } = formatFriendDisplayName(f);
                  const isSelected =
                    (selectedFriendForTogether?.id || connectedFriends[0]?.id) === f.id;
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

      {/* 6B. DEDICATED CALENDAR PROGRESS MODAL */}
      {selectedSharedHabitProgress && (() => {
        const { friendHabit: snapFh, myHabit: snapMh, friend: snapF } = selectedSharedHabitProgress;
        const liveFriend = friends.find((f) => f.id === snapF.id) || snapF;
        const liveFriendHabit = liveFriend.habits?.find((h) => h.id === snapFh.id || h.name.toLowerCase() === snapFh.name.toLowerCase()) || snapFh;
        const liveMyHabit = habits.find((h) => h.id === snapMh.id) || snapMh;

        const friendDisplayName = formatFriendDisplayName(liveFriend).displayName;
        const friendShortName = (liveFriend.name || liveFriend.username || 'Friend').trim().split(' ')[0];
        const myModalDone = isMyHabitDoneToday(liveMyHabit.id);
        const friendModalDone = liveFriendHabit.isCompletedToday;
        const bothModalDone = myModalDone && friendModalDone;
        const myWeekly = getMyHabitWeeklyHistory(liveMyHabit.id);
        const friendWeekly = liveFriendHabit.weeklyHistory || [false, false, false, false, false, false, false];
        const myCount = myWeekly.filter(Boolean).length;
        const friendCount = friendWeekly.filter(Boolean).length;

        return (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedSharedHabitProgress(null)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.calendarProgressModalBox,
                  { backgroundColor: isDark ? '#141D2E' : '#FFFFFF' },
                ]}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <View
                      style={[
                        styles.habitIconBoxLarge,
                        { backgroundColor: liveFriendHabit.color || '#7C5CFF' },
                      ]}
                    >
                      <IconRenderer name={liveFriendHabit.icon} size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.modalTitle,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                        ]}
                        numberOfLines={1}
                      >
                        {liveFriendHabit.name}
                      </Text>
                      <Text
                        style={[
                          styles.modalSub,
                          { color: isDark ? '#94A3B8' : '#64748B', marginTop: 2, marginBottom: 0 },
                        ]}
                        numberOfLines={1}
                      >
                        {formatTo12Hour(liveFriendHabit.reminder_time || '08:00')} • Shared with {friendDisplayName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedSharedHabitProgress(null)}
                    style={{ padding: 4 }}
                  >
                    <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                </View>

                {/* Today's Live Check-in Comparison Box */}
                <View
                  style={[
                    styles.todayComparisonBox,
                    {
                      backgroundColor: isDark ? '#0D1524' : '#F8FAFC',
                      borderColor: isDark ? '#1E2B42' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.todayCheckinRow}>
                    {/* You Status Card */}
                    <View
                      style={[
                        styles.userCheckinCard,
                        {
                          backgroundColor: isDark ? '#162033' : '#FFFFFF',
                          borderColor: myModalDone ? '#10B981' : isDark ? '#23324C' : '#CBD5E1',
                        },
                      ]}
                    >
                      <View style={styles.checkinUserMeta}>
                        <Text style={styles.checkinAvatar}>{user?.avatar || '🌟'}</Text>
                        <Text
                          style={[
                            styles.checkinUserName,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                          ]}
                          numberOfLines={1}
                        >
                          You
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkinStatusSymbol,
                          myModalDone
                            ? styles.checkinSymbolDone
                            : isDark
                            ? styles.checkinSymbolPendingDark
                            : styles.checkinSymbolPendingLight,
                        ]}
                      >
                        {myModalDone ? (
                          <Check size={14} color="#10B981" strokeWidth={3} />
                        ) : (
                          <Clock size={13} color="#F59E0B" strokeWidth={2.5} />
                        )}
                      </View>
                    </View>

                    {/* Friend Status Card */}
                    <View
                      style={[
                        styles.userCheckinCard,
                        {
                          backgroundColor: isDark ? '#162033' : '#FFFFFF',
                          borderColor: friendModalDone ? '#7C5CFF' : isDark ? '#23324C' : '#CBD5E1',
                        },
                      ]}
                    >
                      <View style={styles.checkinUserMeta}>
                        <Text style={styles.checkinAvatar}>{liveFriend.avatar || '👤'}</Text>
                        <Text
                          style={[
                            styles.checkinUserName,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                          ]}
                          numberOfLines={1}
                        >
                          {friendShortName}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkinStatusSymbol,
                          friendModalDone
                            ? styles.checkinSymbolFriendDone
                            : isDark
                            ? styles.checkinSymbolPendingDark
                            : styles.checkinSymbolPendingLight,
                        ]}
                      >
                        {friendModalDone ? (
                          <Check size={14} color="#7C5CFF" strokeWidth={3} />
                        ) : (
                          <Clock size={13} color="#F59E0B" strokeWidth={2.5} />
                        )}
                      </View>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.accountabilityText,
                      { color: bothModalDone ? '#10B981' : isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    {bothModalDone
                      ? '🎉 Both completed today! Shared streak secured!'
                      : myModalDone && !friendModalDone
                      ? `⚡ You're done! Remind ${friendShortName} to check in.`
                      : !myModalDone && friendModalDone
                      ? `⏳ ${friendShortName} completed today! Your turn to check in.`
                      : '⏳ Both pending today. Keep each other accountable!'}
                  </Text>
                </View>

                {/* Stat Summary Cards */}
                <View style={styles.modalStatGrid}>
                  <View
                    style={[
                      styles.modalStatCard,
                      {
                        backgroundColor: isDark ? '#0D1524' : '#F8FAFC',
                        borderColor: isDark ? '#1E2B42' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Flame size={18} color="#F59E0B" fill="#F59E0B" />
                    <Text
                      style={[
                        styles.modalStatValue,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      {liveFriendHabit.currentStreak}d
                    </Text>
                    <Text
                      style={[
                        styles.modalStatLabel,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Current Streak
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.modalStatCard,
                      {
                        backgroundColor: isDark ? '#0D1524' : '#F8FAFC',
                        borderColor: isDark ? '#1E2B42' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{user?.avatar || '🌟'}</Text>
                    <Text style={[styles.modalStatValue, { color: '#10B981' }]}>
                      {myCount}/7
                    </Text>
                    <Text
                      style={[
                        styles.modalStatLabel,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      You this week
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.modalStatCard,
                      {
                        backgroundColor: isDark ? '#0D1524' : '#F8FAFC',
                        borderColor: isDark ? '#1E2B42' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{liveFriend.avatar || '👤'}</Text>
                    <Text style={[styles.modalStatValue, { color: '#7C5CFF' }]}>
                      {friendCount}/7
                    </Text>
                    <Text
                      style={[
                        styles.modalStatLabel,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      {friendShortName} this week
                    </Text>
                  </View>
                </View>

                {/* 7-Day Matrix in Modal */}
                <View
                  style={[
                    styles.modalMatrixContainer,
                    {
                      backgroundColor: isDark ? '#0D1524' : '#F8FAFC',
                      borderColor: isDark ? '#1E2B42' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weeklySectionHeading,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    WEEKLY CALENDAR PROGRESS
                  </Text>

                  {/* Day & Date Headers */}
                  <View style={styles.matrixHeaderRow}>
                    <View style={styles.matrixNameSpacer} />
                    <View style={styles.matrixGridCols}>
                      {currentWeekDays.map((item, i) => (
                        <View
                          key={i}
                          style={[
                            styles.matrixDayCol,
                            item.isToday && styles.matrixDayColToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.matrixDayLetter,
                              {
                                color: item.isToday
                                  ? '#7C5CFF'
                                  : isDark
                                  ? '#64748B'
                                  : '#94A3B8',
                              },
                            ]}
                          >
                            {item.dayName[0]}
                          </Text>
                          <Text
                            style={[
                              styles.matrixDayNum,
                              {
                                color: item.isToday
                                  ? '#7C5CFF'
                                  : isDark
                                  ? '#FFFFFF'
                                  : '#0F172A',
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
                  <View style={styles.matrixRow}>
                    <View style={styles.matrixNameBox}>
                      <Text
                        style={[
                          styles.matrixNameText,
                          { color: isDark ? '#E2E8F0' : '#334155' },
                        ]}
                        numberOfLines={1}
                      >
                        You
                      </Text>
                    </View>
                    <View style={styles.matrixGridCols}>
                      {myWeekly.map((done, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.matrixDot,
                            done
                              ? styles.matrixDotDoneYou
                              : isDark
                              ? styles.matrixDotPendingDark
                              : styles.matrixDotPendingLight,
                          ]}
                        >
                          {done && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Row 2: Friend */}
                  <View style={styles.matrixRow}>
                    <View style={styles.matrixNameBox}>
                      <Text
                        style={[
                          styles.matrixNameText,
                          { color: isDark ? '#E2E8F0' : '#334155' },
                        ]}
                        numberOfLines={1}
                      >
                        {friendShortName}
                      </Text>
                    </View>
                    <View style={styles.matrixGridCols}>
                      {friendWeekly.map((done, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.matrixDot,
                            done
                              ? styles.matrixDotDoneFriend
                              : isDark
                              ? styles.matrixDotPendingDark
                              : styles.matrixDotPendingLight,
                          ]}
                        >
                          {done && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Interactive Actions (Nudge & Leave Habit) */}
                <View style={styles.mutualActionsRow}>
                  <TouchableOpacity
                    style={styles.nudgeBtn}
                    onPress={() => nudgeFriend(liveFriend.id, liveFriendHabit.name)}
                    activeOpacity={0.8}
                  >
                    <Bell size={13} color="#F59E0B" />
                    <Text style={styles.nudgeBtnText}>
                      Nudge {friendShortName}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.leaveHabitBtn,
                      {
                        backgroundColor: isDark ? '#1C2638' : '#F1F5F9',
                        borderColor: isDark ? '#2D3A50' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => {
                      setSelectedSharedHabitProgress(null);
                      unfollowFriendHabit(liveMyHabit.id, liveFriendHabit.name);
                    }}
                    activeOpacity={0.7}
                  >
                    <UserMinus size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text
                      style={[
                        styles.leaveHabitBtnText,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Leave Habit
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Modal Footer / Dismiss */}
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setSelectedSharedHabitProgress(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}

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
              {friendToRemove?.requestStatus === 'pending_sent'
                ? 'Cancel Follow Request?'
                : 'Remove Habit Buddy?'}
            </Text>

            <Text style={[styles.confirmMessage, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {friendToRemove?.requestStatus === 'pending_sent'
                ? `Cancel your pending follow request to ${friendToRemove ? formatFriendDisplayName(friendToRemove).displayName : 'this user'} (${friendToRemove ? formatFriendDisplayName(friendToRemove).usernameTag : ''})?`
                : `Are you sure you want to remove ${friendToRemove ? formatFriendDisplayName(friendToRemove).displayName : 'this friend'}${friendToRemove ? ` (${formatFriendDisplayName(friendToRemove).usernameTag})` : ''}? You will no longer track mutual streaks together.`}
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
                    const clean = (friendToRemove.username || '').replace(/^@/, '').toLowerCase();
                    setFollowingMap((prev) => {
                      const copy = { ...prev };
                      delete copy[clean];
                      return copy;
                    });
                    removeFriend(friendToRemove.id);
                    setFriendToRemove(null);
                  }
                }}
                activeOpacity={0.8}
              >
                <UserMinus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.confirmDeleteBtnText}>
                  {friendToRemove?.requestStatus === 'pending_sent' ? 'Cancel Request' : 'Unfollow'}
                </Text>
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
  searchBarContainer: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchActionBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    gap: 5,
  },
  searchActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  searchResultsWrapper: {
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 92, 255, 0.15)',
  },
  searchResultsTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchResultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  searchResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultAvatarText: {
    color: '#7C5CFF',
    fontSize: 15,
    fontWeight: '900',
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '800',
  },
  searchResultHandle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  followResultBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  followResultBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  followingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    gap: 4,
  },
  followingPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  requestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    gap: 4,
  },
  requestedPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  noResultsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  noResultsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  noResultsSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
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
  inputPrefixIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
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
  inputWithPrefix: {
    paddingLeft: 34,
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
  incomingCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  incomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  incomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  incomingBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  incomingNoticeSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  incomingList: {
    gap: 8,
  },
  incomingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  incomingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  incomingAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingAvatarEmoji: {
    fontSize: 16,
  },
  incomingName: {
    fontSize: 13,
    fontWeight: '800',
  },
  incomingUsername: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  incomingActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  declineBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    flexShrink: 0,
  },
  pendingBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  lockedIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNoticeTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  lockedNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  removeFriendBtnText: {
    color: '#EF4444',
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
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  mutualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mutualTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  habitIconBoxLarge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mutualHabitName: {
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },
  mutualSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mutualHabitSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  mutualHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  sharedStreakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    flexShrink: 0,
  },
  sharedStreakText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
  },
  todayComparisonBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  todayCheckinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCheckinCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
  },
  checkinUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  checkinAvatar: {
    fontSize: 14,
  },
  checkinUserName: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
    includeFontPadding: false,
  },
  checkinStatusSymbol: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkinSymbolDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  checkinSymbolFriendDone: {
    backgroundColor: 'rgba(124, 92, 255, 0.16)',
  },
  checkinSymbolPendingDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  checkinSymbolPendingLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  accountabilityText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  weeklyMatrixContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  weeklySectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  matrixNameSpacer: {
    width: 60,
    flexShrink: 0,
  },
  matrixGridCols: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixDayCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 6,
    gap: 1,
  },
  matrixDayColToday: {
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
  },
  matrixDayLetter: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  matrixDayNum: {
    fontSize: 10,
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  matrixNameBox: {
    width: 60,
    flexShrink: 0,
    paddingRight: 6,
  },
  matrixNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  matrixDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixDotDoneYou: {
    backgroundColor: '#10B981',
  },
  matrixDotDoneFriend: {
    backgroundColor: '#7C5CFF',
  },
  matrixDotPendingDark: {
    backgroundColor: '#1E293B',
  },
  matrixDotPendingLight: {
    backgroundColor: '#E2E8F0',
  },
  mutualActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 92, 255, 0.1)',
  },
  nudgeBtn: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 6,
  },
  nudgeBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  unfollowBtn: {
    height: 38,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  unfollowBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leaveHabitBtn: {
    height: 38,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  leaveHabitBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  celebratedBadge: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    gap: 5,
  },
  celebratedBadgeText: {
    color: '#10B981',
    fontSize: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
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
  progressPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressPillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  viewProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewProgressBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  calendarProgressModalBox: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalStatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modalStatCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalStatValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalMatrixContainer: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  modalDoneBtn: {
    backgroundColor: '#7C5CFF',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
