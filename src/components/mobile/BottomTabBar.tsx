import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Home, CheckSquare, BarChart2, Calendar, Plus } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateModalOpen, theme } = useHabit();
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: isDark ? '#0B1120' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      {/* Home Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('home')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <Home
          size={20}
          color={activeTab === 'home' ? '#7C5CFF' : isDark ? '#94A3B8' : '#475569'}
          strokeWidth={activeTab === 'home' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? '#7C5CFF' : isDark ? '#94A3B8' : '#334155' },
            activeTab === 'home' && styles.activeTabLabel,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Habits Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('habits')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <CheckSquare
          size={20}
          color={activeTab === 'habits' ? '#7C5CFF' : isDark ? '#94A3B8' : '#475569'}
          strokeWidth={activeTab === 'habits' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'habits' ? '#7C5CFF' : isDark ? '#94A3B8' : '#334155' },
            activeTab === 'habits' && styles.activeTabLabel,
          ]}
        >
          Habits
        </Text>
      </TouchableOpacity>

      {/* Center Floating Plus Action Button */}
      <View style={styles.floatingCenterWrapper}>
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={styles.floatingButton}
          activeOpacity={0.85}
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Stats Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('stats')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <BarChart2
          size={20}
          color={activeTab === 'stats' ? '#7C5CFF' : isDark ? '#94A3B8' : '#475569'}
          strokeWidth={activeTab === 'stats' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'stats' ? '#7C5CFF' : isDark ? '#94A3B8' : '#334155' },
            activeTab === 'stats' && styles.activeTabLabel,
          ]}
        >
          Stats
        </Text>
      </TouchableOpacity>

      {/* Calendar Tab */}
      <TouchableOpacity
        onPress={() => setActiveTab('calendar')}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <Calendar
          size={20}
          color={activeTab === 'calendar' ? '#7C5CFF' : isDark ? '#94A3B8' : '#475569'}
          strokeWidth={activeTab === 'calendar' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'calendar' ? '#7C5CFF' : isDark ? '#94A3B8' : '#334155' },
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
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    zIndex: 30,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  floatingCenterWrapper: {
    top: -14,
  },
  floatingButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});


