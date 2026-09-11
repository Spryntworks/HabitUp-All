import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Home, Users, BarChart2, Calendar, Plus, Flame } from 'lucide-react-native';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateModalOpen, theme, friendsEnabled, incomingRequests } = useHabit();
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: isDark ? '#0C1322' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Home Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('home')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <Home
          size={22}
          color={activeTab === 'home' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8'}
          strokeWidth={activeTab === 'home' ? 2.5 : 1.8}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
            activeTab === 'home' && styles.activeTabLabel,
          ]}
        >
          Home
        </Text>
        {activeTab === 'home' && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* 2. Friends Tab (Variant B) or Streaks Tab (Variant A) */}
      {friendsEnabled ? (
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <Users
              size={22}
              color={activeTab === 'friends' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8'}
              strokeWidth={activeTab === 'friends' ? 2.5 : 1.8}
            />
            {incomingRequests && incomingRequests.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {incomingRequests.length > 9 ? '9+' : incomingRequests.length}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'friends' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
              activeTab === 'friends' && styles.activeTabLabel,
            ]}
          >
            Friends
          </Text>
          {activeTab === 'friends' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setActiveTab('streaks')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <Flame
            size={22}
            color={activeTab === 'streaks' ? '#F59E0B' : isDark ? '#64748B' : '#94A3B8'}
            strokeWidth={activeTab === 'streaks' ? 2.5 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'streaks' ? '#F59E0B' : isDark ? '#64748B' : '#94A3B8' },
              activeTab === 'streaks' && styles.activeTabLabel,
            ]}
          >
            Streaks
          </Text>
          {activeTab === 'streaks' && <View style={[styles.activeDot, { backgroundColor: '#F59E0B' }]} />}
        </TouchableOpacity>
      )}

      {/* 3. Center Floating Elevated Plus Button */}
      <View style={styles.floatingCenterWrapper}>
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={[
            styles.floatingButton,
            { borderColor: isDark ? '#0C1322' : '#FFFFFF' },
          ]}
          activeOpacity={0.85}
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
        </TouchableOpacity>
      </View>

      {/* 4. Stats Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('stats')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <BarChart2
          size={22}
          color={activeTab === 'stats' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8'}
          strokeWidth={activeTab === 'stats' ? 2.5 : 1.8}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'stats' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
            activeTab === 'stats' && styles.activeTabLabel,
          ]}
        >
          Stats
        </Text>
        {activeTab === 'stats' && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* 5. Calendar Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('calendar')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <Calendar
          size={22}
          color={activeTab === 'calendar' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8'}
          strokeWidth={activeTab === 'calendar' ? 2.5 : 1.8}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'calendar' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
            activeTab === 'calendar' && styles.activeTabLabel,
          ]}
        >
          Calendar
        </Text>
        {activeTab === 'calendar' && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 72 : 66,
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flex: 1,
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7C5CFF',
    marginTop: 2,
  },
  floatingCenterWrapper: {
    top: -16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
