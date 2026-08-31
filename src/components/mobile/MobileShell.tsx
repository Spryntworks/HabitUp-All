import React from 'react';
import { View, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHabit } from '../../context/HabitContext';
import { Toast } from '../common/Toast';
import { BottomTabBar } from './BottomTabBar';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const { theme, isAuthenticated } = useHabit();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  // Ensure Android status bar height + extra breathing room is strictly padded
  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, RNStatusBar.currentHeight || 0, 24)
    : insets.top;

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? '#0B1120' : '#F8FAFC',
          paddingTop: topPadding,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <View style={styles.mainContainer}>
        {children}
      </View>

      <Toast />
      {isAuthenticated && <BottomTabBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
});
