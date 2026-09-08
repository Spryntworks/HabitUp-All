import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Home, Users, BarChart2, Calendar, Plus, Flame } from 'lucide-react-native';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateModalOpen, theme, friendsEnabled } = useHabit();
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: isDark ? '#0A0F1D' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
      </TouchableOpacity>

      {/* 2. Friends Tab (Variant B) or Streaks Tab (Variant A) */}
      {friendsEnabled ? (
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <Users
            size={22}
            color={activeTab === 'friends' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8'}
            strokeWidth={activeTab === 'friends' ? 2.5 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'friends' ? '#7C5CFF' : isDark ? '#64748B' : '#94A3B8' },
              activeTab === 'friends' && styles.activeTabLabel,
            ]}
          >
            Friends
          </Text>
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
        </TouchableOpacity>
      )}

      {/* 3. Center Floating Elevated Plus Button */}
      <View style={styles.floatingCenterWrapper}>
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={styles.floatingButton}
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
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 70 : 64,
    zIndex: 40,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '800',
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
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
