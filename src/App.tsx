import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitProvider, useHabit } from './context/HabitContext';
import { requestNotificationPermission } from './services/notificationService';
import { HabitUpLogo } from './components/common/HabitUpLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MobileShell } from './components/mobile/MobileShell';
import { AuthView } from './components/views/AuthView';
import { HomeView } from './components/views/HomeView';
import { FriendsView } from './components/views/FriendsView';
import { CalendarView } from './components/views/CalendarView';
import { StatsView } from './components/views/StatsView';
import { StreaksView } from './components/views/StreaksView';
import { SettingsView } from './components/views/SettingsView';
import { CreateHabitModal } from './components/modals/CreateHabitModal';
import { HabitDetailModal } from './components/modals/HabitDetailModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { AuthSessionModal } from './components/modals/AuthSessionModal';
import { BiometricScanModal } from './components/modals/BiometricScanModal';
import { PlantGardenModal } from './components/modals/PlantGardenModal';
import { NotificationBanner } from './components/common/NotificationBanner';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated, isAuthLoading } = useHabit();
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    // Request system notification permission immediately upon app startup
    requestNotificationPermission().catch(() => {});

    // Safety fallback timer: guarantee app resolves loading screen within 2.5 seconds
    const timer = setTimeout(() => {
      setSafetyTimedOut(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Prevent flicker while restoring stored session, but never block indefinitely
  if (isAuthLoading && !safetyTimedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1120', alignItems: 'center', justifyContent: 'center' }}>
        <HabitUpLogo size="md" themeMode="dark" />
        <ActivityIndicator color="#7C5CFF" style={{ marginTop: 24 }} size="small" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <MobileShell>
      {/* Real-time In-App Floating Notification Banner */}
      <NotificationBanner />

      {activeTab === 'home' && <HomeView />}
      {(activeTab === 'friends' || activeTab === 'habits') && <FriendsView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'stats' && <StatsView />}
      {activeTab === 'streaks' && <StreaksView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Global Modals & Biometrics */}
      <BiometricScanModal />
      <CreateHabitModal />
      <HabitDetailModal />
      <OnboardingModal />
      <AuthSessionModal />
      <PlantGardenModal />
    </MobileShell>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <HabitProvider>
          <AppContent />
        </HabitProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
