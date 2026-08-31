import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Bell, Sun, Moon, WifiOff, Settings } from 'lucide-react-native';
import { HabitlyMascot } from './HabitlyMascot';

interface HomeHeroProps {
  onMascotClick?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onMascotClick }) => {
  const {
    user,
    theme,
    toggleTheme,
    isOffline,
    setIsOffline,
    setActiveTab,
    setIsNotificationModalOpen,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Top Action Icons Row */}
      <View style={styles.topRow}>
        <Text style={[styles.greeting, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>
          {getGreetingTime()}, {user?.name ? user.name.split(' ')[0] : 'Hero'}! 👋
        </Text>

        <View style={styles.iconActions}>
          {isOffline && (
            <TouchableOpacity
              onPress={() => {
                setIsOffline(false);
                showToast('Back Online! Synchronized with storage', undefined, 'success');
              }}
              style={styles.offlineBtn}
            >
              <WifiOff size={14} color="#F59E0B" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={toggleTheme} style={styles.actionBtn}>
            {theme === 'dark' ? (
              <Sun size={18} color="#FDE047" />
            ) : (
              <Moon size={18} color="#6366F1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsNotificationModalOpen(true)}
            style={styles.actionBtn}
          >
            <Bell size={18} color={isDark ? '#E2E8F0' : '#475569'} />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            style={styles.actionBtn}
          >
            <Settings size={18} color={isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Body: Catchphrase & Mascot */}
      <View style={styles.bodyRow}>
        <View style={styles.headlineCol}>
          <Text style={[styles.headline, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Let's <Text style={{ color: isDark ? '#22D3A8' : '#7C5CFF' }}>crush</Text>
            {'\n'}today!
          </Text>
        </View>

        <View style={styles.mascotCol}>
          <HabitlyMascot onClick={onMascotClick} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '700',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  actionBtn: {
    padding: 6,
    borderRadius: 10,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headlineCol: {
    flex: 1,
  },
  headline: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  mascotCol: {
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
