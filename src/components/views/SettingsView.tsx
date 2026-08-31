import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabit } from '../../context/HabitContext';
import { soundService } from '../../services/soundService';
import { TimezoneSelect } from '../common/TimezoneSelect';
import { HabitUpLogo } from '../common/HabitUpLogo';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  Camera,
  Globe,
  Crosshair,
} from 'lucide-react-native';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUser,
    theme,
    toggleTheme,
    hapticsEnabled,
    setHapticsEnabled,
    soundEnabled,
    setSoundEnabled,
    isOffline,
    setIsOffline,
    syncQueue,
    habits,
    completions,
    getHabitStats,
    setActiveTab,
    setIsAuthSessionModalOpen,
    logout,
    isSyncing,
    syncWithBackend,
    showToast,
  } = useHabit();

  const isDark = theme === 'dark';

  const pendingCount = syncQueue.length;

  const handleExportCSV = async () => {
    try {
      // 1. Build Tabular CSV Spreadsheet Headers and Rows
      const headers = [
        'Habit Name',
        'Frequency',
        'Status',
        'Reminder Time',
        'Current Streak',
        'Completion Rate',
        'Check-in Date',
        'Status On Date',
        'Completed Timestamp',
      ];

      const rows: string[][] = [];

      habits.forEach((h) => {
        const stats = getHabitStats(h.id);
        const habitCompletions = completions.filter((c) => c.habit_id === h.id);
        const status = h.deleted_at
          ? 'Deleted'
          : h.archived_at
          ? 'Archived'
          : h.paused_at
          ? 'Paused'
          : 'Active';
        const freq = h.frequency_type === 'daily' ? 'Daily' : 'Custom Days';

        if (habitCompletions.length === 0) {
          rows.push([
            h.name,
            freq,
            status,
            h.reminder_time || 'None',
            `${stats.currentStreak} days`,
            `${stats.completionRate}%`,
            'N/A',
            'No Check-ins Yet',
            'N/A',
          ]);
        } else {
          // Sort newest check-ins first
          const sortedCompletions = [...habitCompletions].sort((a, b) =>
            (b.completion_date || '').localeCompare(a.completion_date || '')
          );
          sortedCompletions.forEach((c) => {
            rows.push([
              h.name,
              freq,
              status,
              h.reminder_time || 'None',
              `${stats.currentStreak} days`,
              `${stats.completionRate}%`,
              c.completion_date || 'N/A',
              'Completed',
              c.completed_at ? new Date(c.completed_at).toLocaleString() : 'N/A',
            ]);
          });
        }
      });

      // Escape quotes and format as CSV table
      const csvString = [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

      const fileName = `HabitUp_Data_Export_${new Date().toISOString().split('T')[0]}.csv`;

      // 2. Platform-specific export (Downloads on Web, File Attachment Share on Android/iOS)
      if (Platform.OS === 'web') {
        const blob = new Blob(['\uFEFF' + csvString], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('CSV tabular file downloaded!', undefined, 'success');
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, '\uFEFF' + csvString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export HabitUp Data (CSV Table)',
            UTI: 'public.comma-separated-values-text',
          });
          showToast('CSV file created in tabular format!', undefined, 'success');
        } else {
          showToast('File sharing is not supported on this device.', undefined, 'warning');
        }
      }
    } catch (e: any) {
      console.warn('Export error:', e);
      showToast('Export cancelled or failed.', undefined, 'info');
    }
  };

  const handleAutoDetectTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      if (user) {
        updateUser({ timezone: tz });
      }
      showToast(`Detected timezone: ${tz}`, undefined, 'success');
    } catch {
      showToast('Could not detect timezone', undefined, 'warning');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Header: Settings / Preferences & Data / < Back */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Settings
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Preferences & Data
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.backPill,
            {
              backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
          onPress={() => setActiveTab('home')}
        >
          <ChevronLeft size={16} color={isDark ? '#E2E8F0' : '#0F172A'} />
          <Text style={[styles.backPillText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Profile Card matching Image 1 */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.profileLeft}>
          {/* Avatar with Camera Badge */}
          <View style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={['#C084FC', '#F43F5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={() => setIsAuthSessionModalOpen(true)}
            >
              <Camera size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {user?.name || 'Google User'}
            </Text>
            <Text style={[styles.userEmail, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {user?.email || 'user@gmail.com'}
            </Text>
            <Text style={styles.userTimezone}>
              Timezone: {user?.timezone || 'Asia/Calcutta'}
            </Text>
          </View>
        </View>

        {/* Edit DP Link */}
        <TouchableOpacity
          style={styles.editDpBtn}
          onPress={() => setIsAuthSessionModalOpen(true)}
        >
          <Text style={styles.editDpText}>Edit DP</Text>
          <ChevronRight size={14} color="#818CF8" />
        </TouchableOpacity>
      </View>

      {/* APP PREFERENCES Card */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          APP PREFERENCES
        </Text>

        {/* 1. Theme Mode */}
        <View style={styles.preferenceRow}>
          <View style={styles.prefLeft}>
            <Moon size={18} color="#C084FC" />
            <View>
              <Text style={[styles.prefName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Theme Mode
              </Text>
              <Text style={[styles.prefDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.themeTogglePill,
              {
                backgroundColor: isDark ? '#080E1A' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
            onPress={toggleTheme}
          >
            <Text style={[styles.themeToggleText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {isDark ? 'Dark' : 'Light'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

        {/* 2. Sound Effects */}
        <View style={styles.preferenceRow}>
          <View style={styles.prefLeft}>
            <Volume2 size={18} color="#10B981" />
            <View>
              <Text style={[styles.prefName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Sound Effects
              </Text>
              <Text style={[styles.prefDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Play chime when habit is completed
              </Text>
            </View>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={(val) => {
              setSoundEnabled(val);
              if (val) {
                try {
                  soundService.playCompletionChime();
                } catch {
                  // ignore
                }
              }
            }}
            trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

        {/* 3. Vibration Feedback */}
        <View style={styles.preferenceRow}>
          <View style={styles.prefLeft}>
            <Smartphone size={18} color="#F43F5E" />
            <View>
              <Text style={[styles.prefName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Vibration Feedback
              </Text>
              <Text style={[styles.prefDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Vibrate gently on button tap
              </Text>
            </View>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: '#FF4D6D' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} />

        {/* 4. Selected Timezone matching Image 2 */}
        <View style={styles.timezoneBlock}>
          <View style={styles.timezoneHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Globe size={15} color="#FF4D6D" />
              <Text style={styles.timezoneLabel}>Selected Timezone</Text>
            </View>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={handleAutoDetectTimezone}
            >
              <Crosshair size={13} color="#FF4D6D" />
              <Text style={styles.autoDetectText}>Auto-detect</Text>
            </TouchableOpacity>
          </View>

          <TimezoneSelect
            value={user?.timezone || 'Asia/Calcutta'}
            label=""
            showAutoDetect={false}
            onChange={(newTz) => {
              if (user) updateUser({ timezone: newTz });
              showToast(`Timezone updated to ${newTz}`, undefined, 'success');
            }}
          />
        </View>
      </View>

      {/* OFFLINE & SYNC Card matching Image 2 */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.syncHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            OFFLINE & SYNC
          </Text>
          <View
            style={[
              styles.syncBadge,
              {
                backgroundColor: isOffline
                  ? 'rgba(239, 68, 68, 0.15)'
                  : isSyncing
                  ? 'rgba(56, 189, 248, 0.15)'
                  : pendingCount > 0
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                borderColor: isOffline
                  ? 'rgba(239, 68, 68, 0.3)'
                  : isSyncing
                  ? 'rgba(56, 189, 248, 0.3)'
                  : pendingCount > 0
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(16, 185, 129, 0.3)',
              },
            ]}
          >
            <Text
              style={[
                styles.syncBadgeText,
                {
                  color: isOffline
                    ? '#EF4444'
                    : isSyncing
                    ? '#38BDF8'
                    : pendingCount > 0
                    ? '#F59E0B'
                    : '#10B981',
                },
              ]}
            >
              {isOffline
                ? 'OFFLINE'
                : isSyncing
                ? 'SYNCING...'
                : pendingCount > 0
                ? `${pendingCount} PENDING`
                : 'SYNCED'}
            </Text>
          </View>
        </View>

        <Text style={[styles.syncDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          Habits update instantly even without internet, and sync automatically when connected.
        </Text>

        <View style={styles.syncActionsRow}>
          <TouchableOpacity
            style={[
              styles.syncBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
            onPress={() => {
              setIsOffline(!isOffline);
              showToast(
                !isOffline ? 'Switched to Offline Mode' : 'Switched to Online Mode',
                undefined,
                !isOffline ? 'info' : 'success'
              );
            }}
          >
            {isOffline ? (
              <Wifi size={16} color={isDark ? '#E2E8F0' : '#0F172A'} />
            ) : (
              <WifiOff size={16} color={isDark ? '#E2E8F0' : '#0F172A'} />
            )}
            <Text style={[styles.syncBtnText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {isOffline ? 'Go Online' : 'Simulate Offline'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.syncBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
                borderColor: isDark ? '#334155' : '#BAE6FD',
              },
            ]}
            disabled={isSyncing}
            onPress={syncWithBackend}
          >
            <RefreshCw size={16} color="#38BDF8" />
            <Text style={[styles.syncBtnText, { color: '#38BDF8' }]}>
              {isSyncing ? 'Syncing...' : `Sync Now (${pendingCount})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DATA EXPORT Card matching Image 3 */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          DATA EXPORT
        </Text>

        <Text style={[styles.syncDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          Export all your habits, schedules, and check-in history as a spreadsheet CSV file.
        </Text>

        <TouchableOpacity
          style={[
            styles.exportCsvBtn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: isDark ? '#334155' : '#CBD5E1',
            },
          ]}
          onPress={handleExportCSV}
        >
          <FileSpreadsheet size={18} color="#10B981" />
          <Text style={[styles.exportCsvBtnText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Export CSV File
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button matching Image 3 */}
      <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
        <LogOut size={18} color="#FF4D6D" />
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Footer User Email */}
      <Text style={[styles.footerEmail, { color: isDark ? '#64748B' : '#94A3B8' }]}>
        Signed in as <Text style={{ fontWeight: '700' }}>{user?.email || 'user@gmail.com'}</Text>
      </Text>

      {/* Logo branding */}
      <View style={styles.brandingBox}>
        <HabitUpLogo size="md" showSubtitle={true} />
        <Text style={[styles.versionText, { color: isDark ? '#475569' : '#94A3B8' }]}>
          Version 1.0 • Build 2026.8
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#131C2E',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '900',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userTimezone: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 4,
  },
  editDpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editDpText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  prefName: {
    fontSize: 14,
    fontWeight: '800',
  },
  prefDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  themeTogglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  timezoneBlock: {
    paddingTop: 10,
  },
  timezoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timezoneLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF4D6D',
  },
  autoDetectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4D6D',
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  syncDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  syncActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  exportCsvBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  signOutBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderColor: 'rgba(255, 77, 109, 0.35)',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutBtnText: {
    color: '#FF4D6D',
    fontSize: 14,
    fontWeight: '900',
  },
  footerEmail: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
  },
  brandingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
