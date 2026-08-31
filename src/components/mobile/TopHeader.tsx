import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Bell, WifiOff, Sparkles, Moon, Sun } from 'lucide-react-native';

export const TopHeader: React.FC = () => {
  const {
    user,
    habits,
    theme,
    toggleTheme,
    isOffline,
    setIsOffline,
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
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {getGreetingTime()}, {user?.name ? user.name.split(' ')[0] : 'Hero'}! 👋
        </Text>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Let's <Text style={{ color: '#7C5CFF' }}>crush</Text> today!
        </Text>
      </View>

      <View style={styles.actionRow}>
        {/* Offline status button */}
        <TouchableOpacity
          onPress={() => {
            const nextOffline = !isOffline;
            setIsOffline(nextOffline);
            showToast(
              nextOffline
                ? 'Switched to Offline Mode (Mutations cached locally)'
                : 'Back Online! Synchronized with storage',
              undefined,
              nextOffline ? 'warning' : 'success'
            );
          }}
          style={[
            styles.iconBtn,
            isOffline && { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
          ]}
        >
          {isOffline ? (
            <WifiOff size={18} color="#FBBF24" />
          ) : (
            <Sparkles size={18} color={isDark ? '#94A3B8' : '#64748B'} />
          )}
        </TouchableOpacity>

        {/* Theme toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
          {theme === 'dark' ? (
            <Sun size={18} color="#FDE047" />
          ) : (
            <Moon size={18} color="#6366F1" />
          )}
        </TouchableOpacity>

        {/* Notifications Bell */}
        <TouchableOpacity
          onPress={() => setIsNotificationModalOpen(true)}
          style={styles.iconBtn}
        >
          <Bell size={18} color={isDark ? '#94A3B8' : '#64748B'} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  },
});
