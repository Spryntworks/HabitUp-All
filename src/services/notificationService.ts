/**
 * HabitUp Notification Service (Expo Notifications & Web Fallback)
 * Provides native push notifications, local reminder scheduling,
 * and background alerts that fire across Mobile and Desktop/Web.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface InAppNotification {
  id: string;
  habitId?: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  timestamp: string;
  reminderTime?: string;
  type: 'reminder' | 'streak' | 'daily_briefing' | 'system';
}

// 1. Configure foreground presentation on native
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// 2. Configure Android Notification Channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('habit-reminders', {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C5CFF',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  }).catch((err) => console.warn('Could not set Android notification channel:', err));
}

export function playWebAudioChime() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {}
  }
}

let inAppListeners: Array<(notif: InAppNotification) => void> = [];

export function addInAppNotificationListener(
  listener: (notif: InAppNotification) => void
): () => void {
  inAppListeners.push(listener);
  return () => {
    inAppListeners = inAppListeners.filter((l) => l !== listener);
  };
}

export function notifyInAppListeners(notif: InAppNotification) {
  inAppListeners.forEach((l) => {
    try {
      l(notif);
    } catch (err) {
      console.warn('Notification listener error:', err);
    }
  });
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
    return false;
  }
}

export async function scheduleHabitReminder(habit: {
  id: string;
  name: string;
  reminder_time?: string;
  icon?: string;
  color?: string;
}): Promise<string | null> {
  const time = habit.reminder_time;
  if (!time) return null;

  try {
    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) return null;

    if (Platform.OS !== 'web') {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Time for ${habit.name}!`,
          body: `Maintain your daily streak. Tap to check off ${habit.name} now!`,
          data: { habitId: habit.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'habit-reminders',
        },
      });
      return notifId;
    }

    return `web-rem-${habit.id}`;
  } catch (err) {
    console.warn('Failed to schedule habit reminder:', err);
    return null;
  }
}

export async function cancelHabitReminder(notificationId: string) {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (err) {
    console.warn('Failed to cancel reminder:', err);
  }
}

export async function cancelAllReminders() {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (err) {
    console.warn('Failed to cancel all reminders:', err);
  }
}

export async function triggerTestNotification(
  title = 'HabitUp Notifications Active! 🔔',
  body = 'Your daily habit reminders and sound alerts are ready to go.'
) {
  const currentTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  // 1. Play Audio Chime
  playWebAudioChime();

  // 2. Web desktop notification fallback
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233497.png',
        });
      } catch (e) {
        console.log('Browser notification fallback error:', e);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233497.png',
            });
          } catch {}
        }
      });
    }
  }

  // 3. Native Expo OS notification on mobile
  if (Platform.OS !== 'web') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      console.warn('Native notification trigger error:', err);
    }
  }

  // 4. In-App Animated Floating Banner Card (Visible on ALL devices)
  notifyInAppListeners({
    id: Date.now().toString(),
    title,
    body,
    icon: 'Sparkles',
    color: '#7C5CFF',
    reminderTime: currentTime,
    timestamp: new Date().toISOString(),
    type: 'system',
  });
}

export const notificationService = {
  checkPermission: checkNotificationPermission,
  requestPermission: requestNotificationPermission,
  scheduleReminder: scheduleHabitReminder,
  cancelReminder: cancelHabitReminder,
  cancelAll: cancelAllReminders,
  triggerTest: triggerTestNotification,
  playChime: playWebAudioChime,
  addListener: addInAppNotificationListener,
};
