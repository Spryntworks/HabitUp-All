/**
 * HabitUp Notification Service (Expo Notifications & Web Fallback)
 * Provides native push notifications, local reminder scheduling,
 * and background alerts that fire across Mobile and Desktop/Web.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushTokenRegistration {
  token: string;
  type: 'fcm' | 'expo' | 'web';
  platform: string;
  timezone: string;
  registeredAt: string;
}

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
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn('Could not set notification handler:', err);
  }
}

// 2. Configure Android Notification Channel
if (Platform.OS === 'android') {
  try {
    Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFF',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    }).catch((err) => console.warn('Could not set Android notification channel:', err));
  } catch (err) {
    console.warn('Error configuring Android notification channel:', err);
  }
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

export async function triggerNudgeNotification(params: {
  senderName: string;
  habitName: string;
  habitId?: string;
  senderAvatar?: string;
  icon?: string;
  color?: string;
}) {
  const title = `👋 ${params.senderName} nudged you!`;
  const body = `Friendly reminder to check off "${params.habitName}" today and maintain your shared streak! 🔥`;

  const currentTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  // 1. Play Audio Chime
  playWebAudioChime();

  // 2. Web browser notification
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
          data: params.habitId ? { habitId: params.habitId } : undefined,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      console.warn('Native notification trigger error:', err);
    }
  }

  // 4. In-App Animated Floating Banner Card (Visible on ALL devices)
  notifyInAppListeners({
    id: `nudge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    habitId: params.habitId,
    title,
    body,
    icon: params.icon || 'Bell',
    color: params.color || '#F59E0B',
    reminderTime: currentTime,
    timestamp: new Date().toISOString(),
    type: 'reminder',
  });
}

/**
 * Retrieves the native FCM device push token (or Expo token fallback)
 * and formats the registration payload for backend integration.
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenRegistration | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[FCM] Notification permission not granted by user.');
      return null;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    let tokenStr = '';
    let tokenType: 'fcm' | 'expo' | 'web' = 'fcm';

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        // 1. Fetch native FCM token using getDevicePushTokenAsync()
        const deviceTokenRes = await Notifications.getDevicePushTokenAsync();
        tokenStr = typeof deviceTokenRes?.data === 'string' ? deviceTokenRes.data : JSON.stringify(deviceTokenRes?.data || '');
        tokenType = 'fcm';
        console.log('[FCM] Native Device Push Token retrieved successfully:', {
          type: deviceTokenRes.type,
          token: tokenStr,
        });
      } catch (nativeErr) {
        console.warn('[FCM] getDevicePushTokenAsync error, trying getExpoPushTokenAsync fallback:', nativeErr);
        try {
          const expoTokenRes = await Notifications.getExpoPushTokenAsync();
          tokenStr = expoTokenRes.data;
          tokenType = 'expo';
        } catch (expoErr) {
          console.error('[FCM] Failed to retrieve any push token:', expoErr);
        }
      }
    } else {
      tokenType = 'web';
      tokenStr = 'web_push_local_token';
    }

    if (!tokenStr) {
      return null;
    }

    const registration: PushTokenRegistration = {
      token: tokenStr,
      type: tokenType,
      platform: Platform.OS,
      timezone,
      registeredAt: new Date().toISOString(),
    };

    // Store token locally
    await AsyncStorage.setItem('habitup_fcm_token_registration', JSON.stringify(registration));
    await AsyncStorage.setItem('habitup_fcm_token', tokenStr);

    console.log('====================================================');
    console.log('[FCM PUSH REGISTRATION READY FOR BACKEND]');
    console.log('FCM Token:', tokenStr);
    console.log('Platform:', Platform.OS);
    console.log('Timezone:', timezone);
    console.log('Type:', tokenType);
    console.log('====================================================');

    return registration;
  } catch (error) {
    console.error('[FCM] Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

/**
 * Returns cached FCM token if previously saved.
 */
export async function getCachedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('habitup_fcm_token');
  } catch {
    return null;
  }
}

/**
 * Sets up background and foreground push notification listeners.
 */
export function setupNotificationListeners(onNotificationClick?: (data: any) => void): () => void {
  if (Platform.OS === 'web') return () => {};

  // 1. Foreground notification listener
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body, data } = notification.request.content;
    console.log('[FCM] Notification received in foreground:', { title, body, data });
    
    notifyInAppListeners({
      id: `remote-${Date.now()}`,
      habitId: (data as any)?.habitId,
      title: title || 'HabitUp Notification 🔔',
      body: body || '',
      icon: (data as any)?.icon || 'Bell',
      color: (data as any)?.color || '#7C5CFF',
      reminderTime: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
      timestamp: new Date().toISOString(),
      type: (data as any)?.type || 'reminder',
    });
  });

  // 2. Response listener (when user clicks/taps notification from background/closed state)
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[FCM] User tapped notification from background/closed app:', data);
    if (onNotificationClick) {
      onNotificationClick(data);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export const notificationService = {
  checkPermission: checkNotificationPermission,
  requestPermission: requestNotificationPermission,
  registerForPushNotifications: registerForPushNotificationsAsync,
  getCachedPushToken,
  setupListeners: setupNotificationListeners,
  scheduleReminder: scheduleHabitReminder,
  cancelReminder: cancelHabitReminder,
  cancelAll: cancelAllReminders,
  triggerTest: triggerTestNotification,
  triggerNudge: triggerNudgeNotification,
  playChime: playWebAudioChime,
  addListener: addInAppNotificationListener,
};
