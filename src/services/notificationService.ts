/**
 * HabitFlow Notification & Web Push Service
 * Provides complete background notifications when the app is minimized or closed
 * using Service Workers and Web Push API with server-side scheduled push dispatch.
 */

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

let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'PushManager' in window && isServiceWorkerSupported();
}

export function isInIframe(): boolean {
  return typeof window !== 'undefined' && window.self !== window.top;
}

/**
 * Register Service Worker for background notifications and offline capabilities
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service Worker registration:', err);
    return null;
  }
}

/**
 * Request notification permission from browser/OS
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    let permission: NotificationPermission;
    if (typeof Notification.requestPermission === 'function') {
      permission = await Notification.requestPermission();
    } else {
      permission = await new Promise((resolve) => {
        (Notification as any).requestPermission(resolve);
      });
    }

    if (permission === 'granted') {
      // Auto-subscribe to Web Push for background delivery when closed
      await subscribeToWebPush();
    }

    return permission === 'granted';
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Subscribe current browser to Web Push for server-sent background alerts when closed
 */
export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) return null;

    // Check if server provides VAPID key
    let vapidPublicKey = '';
    try {
      const res = await fetch('/api/push/public-key');
      if (res.ok) {
        const data = await res.json();
        vapidPublicKey = data.publicKey;
      }
    } catch {
      // server route might not be reached in offline mode
    }

    if (!vapidPublicKey) {
      console.warn('No VAPID key available for Web Push');
      return null;
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // Read stored reminders to sync
    let reminders: Array<{ habitId: string; title: string; time: string }> = [];
    try {
      const raw = localStorage.getItem('habitflow_active_reminders');
      if (raw) reminders = JSON.parse(raw);
    } catch {
      // ignore
    }

    // Register subscription on backend server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reminders,
      }),
    });

    console.log('Successfully subscribed to Web Push for background alerts!');
    return subscription;
  } catch (err) {
    console.warn('Web Push subscription failed:', err);
    return null;
  }
}

/**
 * Show a notification using Service Worker registration or standard Notification
 */
export async function showBackgroundNotification(
  title: string,
  options: NotificationOptions & { habitId?: string } = {}
): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  if (isServiceWorkerSupported()) {
    await registerServiceWorker();
  }

  const defaultOptions: any = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      habitId: options.habitId,
      timestamp: Date.now(),
    },
    ...options,
  };

  // Try Service Worker postMessage
  if (isServiceWorkerSupported() && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TRIGGER_NOTIFICATION',
      title,
      options: defaultOptions,
    });
  }

  // Try Service Worker showNotification
  if (isServiceWorkerSupported()) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return;
      }
    } catch (err) {
      console.warn('Service worker showNotification fallback:', err);
    }
  }

  // Standard Notification fallback
  try {
    new Notification(title, defaultOptions);
  } catch (err) {
    console.error('Standard Notification failed:', err);
  }
}

/**
 * Trigger an instant server-side push notification to verify background delivery
 */
export async function triggerTestPushNotification(): Promise<boolean> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send schedule sync message to Service Worker and Backend server
 */
export async function syncRemindersToServiceWorker(
  reminders: Array<{ habitId: string; title: string; time: string }>
): Promise<void> {
  try {
    localStorage.setItem('habitflow_active_reminders', JSON.stringify(reminders));
  } catch {
    // ignore
  }

  // 1. Sync to local Service Worker
  if (isServiceWorkerSupported()) {
    try {
      await registerServiceWorker();
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SYNC_REMINDERS',
          reminders,
        });
      }
    } catch (err) {
      console.warn('Failed to sync reminders to service worker:', err);
    }
  }

  // 2. Sync to Backend Web Push Server (for closed app alerts)
  if (isPushSupported() && Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            reminders,
          }),
        });
      }
    } catch (e) {
      // ignore background sync errors
    }
  }
}

export function canInstallPwa(): boolean {
  return Boolean(deferredInstallPrompt);
}

export async function installPwaApp(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice.outcome === 'accepted';
  } catch (err) {
    console.error('Error showing PWA install prompt:', err);
    return false;
  }
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private hasNotificationSupport: boolean = false;
  private notifiedToday: Set<string> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.hasNotificationSupport = 'Notification' in window;
      if (this.hasNotificationSupport) {
        try {
          this.permission = Notification.permission;
        } catch {
          this.permission = 'default';
        }
      }
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      return Notification.permission;
    } catch {
      return this.permission;
    }
  }

  public isSupported(): boolean {
    return isNotificationSupported();
  }

  public async requestPermission(): Promise<NotificationPermission> {
    const granted = await requestNotificationPermission();
    return granted ? 'granted' : 'denied';
  }

  public playReminderSound(soundEnabled: boolean = true) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.56);
    } catch {
      // ignore audio error
    }
  }

  public triggerVibration(hapticsEnabled: boolean = true) {
    if (!hapticsEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // ignore
    }
  }

  public sendNotification(
    notif: InAppNotification,
    options?: { soundEnabled?: boolean; hapticsEnabled?: boolean }
  ) {
    this.playReminderSound(options?.soundEnabled ?? true);
    this.triggerVibration(options?.hapticsEnabled ?? true);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('habitup-inapp-notification', {
          detail: notif,
        })
      );
    }

    showBackgroundNotification(notif.title, {
      body: notif.body,
      tag: notif.habitId || notif.id,
      habitId: notif.habitId,
    });
  }

  public markAsNotified(habitId: string, dateKey: string) {
    this.notifiedToday.add(`${habitId}_${dateKey}`);
  }

  public hasBeenNotified(habitId: string, dateKey: string): boolean {
    return this.notifiedToday.has(`${habitId}_${dateKey}`);
  }
}

export const notificationService = new NotificationService();
