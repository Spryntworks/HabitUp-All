/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HabitProvider, useHabit } from './context/HabitContext';
import { MobileShell } from './components/mobile/MobileShell';
import { AuthView } from './components/views/AuthView';
import { HomeView } from './components/views/HomeView';
import { HabitsView } from './components/views/HabitsView';
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
  const { activeTab, isAuthenticated } = useHabit();

  return (
    <MobileShell>
      {/* Real-time In-App Floating Notification Banner */}
      <NotificationBanner />

      {!isAuthenticated ? (
        <AuthView />
      ) : (
        <>
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'streaks' && <StreaksView />}
          {activeTab === 'settings' && <SettingsView />}
        </>
      )}

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
    <HabitProvider>
      <AppContent />
    </HabitProvider>
  );
}

