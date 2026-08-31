import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Bell, Check, X, Clock } from 'lucide-react-native';
import { InAppNotification, addInAppNotificationListener } from '../../services/notificationService';
import { useHabit } from '../../context/HabitContext';
import { IconRenderer } from './IconRenderer';
import { formatTo12Hour } from '../../utils/streakCalculator';

export const NotificationBanner: React.FC = () => {
  const { toggleCompletion, theme } = useHabit();
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);
  const isDark = theme === 'dark';
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = addInAppNotificationListener((notif) => {
      setCurrentNotification(notif);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 14,
          stiffness: 120,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return unsubscribe;
  }, []);

  // Auto dismiss after 7 seconds
  useEffect(() => {
    if (!currentNotification) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentNotification]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotification(null);
    });
  };

  if (!currentNotification) return null;

  const handleComplete = () => {
    if (currentNotification.habitId) {
      toggleCompletion(currentNotification.habitId);
    }
    dismiss();
  };

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        {/* Left Squircle Icon */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: currentNotification.color || '#7C5CFF' },
          ]}
        >
          {currentNotification.icon ? (
            <IconRenderer name={currentNotification.icon} size={22} color="#FFFFFF" />
          ) : (
            <Bell size={22} color="#FFFFFF" />
          )}
        </View>

        {/* Center Text Info */}
        <View style={styles.textWrapper}>
          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#0F172A' },
            ]}
            numberOfLines={1}
          >
            {currentNotification.title}
          </Text>
          <Text
            style={[
              styles.body,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
            numberOfLines={2}
          >
            {currentNotification.body}
          </Text>
        </View>

        {/* Right Timestamp Badge & Dismiss */}
        <View style={styles.rightColumn}>
          {currentNotification.reminderTime ? (
            <View style={styles.timeTag}>
              <Clock size={11} color="#C084FC" />
              <Text style={styles.timeText}>{formatTo12Hour(currentNotification.reminderTime)}</Text>
            </View>
          ) : (
            <View style={styles.timeTag}>
              <Clock size={11} color="#C084FC" />
              <Text style={styles.timeText}>Just now</Text>
            </View>
          )}

          <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
            <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 48,
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 92, 255, 0.2)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C084FC',
  },
  dismissBtn: {
    padding: 4,
  },
});
