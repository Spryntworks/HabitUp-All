import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitProvider, useHabit } from './context/HabitContext';
import { requestNotificationPermission } from './services/notificationService';
import { HabitUpLogo } from './components/common/HabitUpLogo';
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
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { NotificationBanner } from './components/common/NotificationBanner';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated, isAuthLoading } = useHabit();

  useEffect(() => {
    // Request system notification permission immediately upon app startup
    requestNotificationPermission().catch(() => {});
  }, []);

  // Prevent flicker / visual glitch while restoring stored session
  if (isAuthLoading) {
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
      <NotificationCenterModal />
    </MobileShell>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitProvider>
        <AppContent />
      </HabitProvider>
    </SafeAreaProvider>
  );
}
