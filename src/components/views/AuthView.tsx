import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHabit } from '../../context/HabitContext';
import { apiService } from '../../services/apiService';
import {
  Lock,
  Mail,
  User,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Flame,
  Users,
  Sprout,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Zap,
} from 'lucide-react-native';
import { HabitUpLogo } from '../common/HabitUpLogo';
import { PlantIllustration } from '../mobile/PlantIllustration';
import { getDetectedTimezone } from '../../constants/timezones';
import { PasswordStrengthIndicator, getPasswordStrength } from '../common/PasswordStrengthIndicator';

export const AuthView: React.FC = () => {
  const { login, register, showToast, theme } = useHabit();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const [authMode, setAuthMode] = useState<'welcome' | 'signin' | 'signup' | 'forgot'>('welcome');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const isUsernameCustomized = React.useRef(false);
  const checkUsernameTimer = React.useRef<any>(null);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm'>('request');
  const [isLoading, setIsLoading] = useState(false);

  const validateAndCheckUsername = (val: string) => {
    const clean = val.trim().replace(/^@/, '').toLowerCase();
    if (checkUsernameTimer.current) {
      clearTimeout(checkUsernameTimer.current);
    }

    if (!clean) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Min 3 characters');
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Letters, numbers, _, . only');
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('Checking...');

    checkUsernameTimer.current = setTimeout(async () => {
      try {
        const res = await apiService.checkUsernameAvailability(clean);
        if (res.available) {
          setUsernameStatus('available');
          setUsernameFeedback(`@${clean} is available`);
        } else {
          setUsernameStatus('taken');
          setUsernameFeedback(res.error || `@${clean} is taken`);
        }
      } catch {
        setUsernameStatus('available');
        setUsernameFeedback(`@${clean}`);
      }
    }, 350);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isUsernameCustomized.current) {
      const suggested = val.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20);
      if (suggested) {
        setUsername(suggested);
        validateAndCheckUsername(suggested);
      }
    }
  };

  const handleUsernameChange = (val: string) => {
    isUsernameCustomized.current = true;
    const clean = val.replace(/\s+/g, '').replace(/^@/, '').toLowerCase();
    setUsername(clean);
    validateAndCheckUsername(clean);
  };

  const handleSignIn = async () => {
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      const err = 'Please enter your email/username and password.';
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.success && res.error) {
        setAuthError(res.error);
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setAuthError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();

    if (!cleanName || !cleanEmail || !password.trim()) {
      const err = 'Please fill out your name, email, username, and password.';
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      const err = 'Username must be at least 3 characters.';
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      const err = 'Username can only contain letters, numbers, underscores, and dots.';
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    if (usernameStatus === 'taken') {
      const err = `@${cleanUsername} is already taken. Please choose another username.`;
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    if (password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setAuthError(err);
      showToast(err, undefined, 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const mobileTimezone = getDetectedTimezone();
      const res = await register(cleanName, cleanEmail, password, cleanUsername, mobileTimezone);
      if (!res.success && res.error) {
        setAuthError(res.error);
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotEmail.trim()) {
      showToast('Please enter your email address.', undefined, 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiService.requestPasswordReset(forgotEmail.trim());
      if (res.success) {
        setForgotStep('confirm');
        showToast(res.message || 'Password reset code sent to your email!', undefined, 'success');
      } else {
        showToast(res.error || 'Failed to request reset.', undefined, 'warning');
      }
    } catch {
      showToast('Could not reach backend server.', undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordReset = async () => {
    if (!resetToken.trim() || !newPassword.trim()) {
      showToast('Please provide both the reset token and new password.', undefined, 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', undefined, 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiService.resetPassword(resetToken.trim(), newPassword.trim(), forgotEmail.trim());
      if (res.success) {
        showToast(res.message || 'Password reset successfully! Please sign in.', undefined, 'success');
        setAuthMode('signin');
        setForgotStep('request');
        setPassword('');
      } else {
        showToast(res.error || 'Invalid or expired token.', undefined, 'warning');
      }
    } catch {
      showToast('Could not reach backend server.', undefined, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const ONBOARDING_SLIDES = [
    {
      id: 'streaks',
      badge: 'DAILY CONSISTENCY',
      badgeColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      glowOuter: 'rgba(245, 158, 11, 0.12)',
      glowInner: 'rgba(245, 158, 11, 0.22)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      iconColor: '#F59E0B',
      title: 'Build Unbreakable Streaks',
      subtitle: 'Track daily consistency and never break the chain.',
    },
    {
      id: 'social',
      badge: 'SOCIAL ACCOUNTABILITY',
      badgeColor: '#818CF8',
      badgeBg: 'rgba(129, 140, 248, 0.15)',
      glowOuter: 'rgba(124, 92, 255, 0.12)',
      glowInner: 'rgba(124, 92, 255, 0.22)',
      borderColor: 'rgba(124, 92, 255, 0.4)',
      iconColor: '#818CF8',
      title: 'Accountability with Friends',
      subtitle: 'Share routines, compare streaks, and stay motivated together.',
    },
    {
      id: 'garden',
      badge: 'VIRTUAL HABIT GARDEN',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      glowOuter: 'rgba(16, 185, 129, 0.12)',
      glowInner: 'rgba(16, 185, 129, 0.22)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      iconColor: '#10B981',
      title: 'Level Up Your Habit Garden',
      subtitle: 'Complete daily habits to grow your seedling into a thriving tree.',
    },
  ];

  const activeSlide = ONBOARDING_SLIDES[currentSlide];

  const renderSlidePreview = (index: number) => {
    if (index === 0) {
      return (
        <View style={styles.previewStreakCard}>
          <View style={styles.previewDaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const isDone = idx < 6;
              const isToday = idx === 6;
              return (
                <View key={idx} style={styles.previewDayCol}>
                  <Text style={[styles.previewDayLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.previewDayCircle,
                      isDone && { backgroundColor: '#F59E0B' },
                      isToday && { backgroundColor: '#FF6B00', borderWidth: 2, borderColor: '#FDE68A' },
                    ]}
                  >
                    {isDone ? (
                      <CheckCircle2 size={11} color="#FFFFFF" />
                    ) : (
                      <Flame size={11} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[styles.previewBadgeRow, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7' }]}>
            <Flame size={14} color="#F59E0B" />
            <Text style={[styles.previewBadgeText, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              7-Day Streak Active! • Perfect Consistency
            </Text>
          </View>
        </View>
      );
    }

    if (index === 1) {
      return (
        <View style={styles.previewSocialCard}>
          <View style={styles.previewSocialRow}>
            <View style={[styles.previewUserPill, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
              <View style={[styles.previewAvatar, { backgroundColor: '#7C5CFF' }]}>
                <Text style={styles.previewAvatarText}>A</Text>
              </View>
              <Text style={[styles.previewUsername, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>@alex</Text>
              <CheckCircle2 size={13} color="#10B981" />
            </View>
            <View style={styles.previewConnector}>
              <Zap size={14} color="#F59E0B" />
            </View>
            <View style={[styles.previewUserPill, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]}>
              <View style={[styles.previewAvatar, { backgroundColor: '#0EA5E9' }]}>
                <Text style={styles.previewAvatarText}>S</Text>
              </View>
              <Text style={[styles.previewUsername, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>@sam</Text>
              <CheckCircle2 size={13} color="#10B981" />
            </View>
          </View>
          <View style={[styles.previewBadgeRow, { backgroundColor: isDark ? 'rgba(124, 92, 255, 0.12)' : '#EDE9FE' }]}>
            <Sparkles size={13} color="#7C5CFF" />
            <Text style={[styles.previewBadgeText, { color: isDark ? '#C7D2FE' : '#6366F1' }]}>
              Shared Habit: Morning Run (5km) 🏃‍♂️
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.previewGardenCard}>
        <View style={styles.previewGardenRow}>
          <PlantIllustration level={4} size="sm" isAnimated={false} />
          <View style={styles.previewGardenInfo}>
            <View style={styles.previewGardenTitleRow}>
              <Text style={[styles.previewGardenLevel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Stage 4: Flourishing Oak
              </Text>
              <Text style={styles.previewGardenProgress}>14 / 21 Days</Text>
            </View>
            <View style={[styles.previewProgressTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <View style={[styles.previewProgressFill, { width: '90%' }]} />
            </View>
          </View>
        </View>
        <View style={[styles.previewBadgeRow, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5' }]}>
          <Sprout size={13} color="#10B981" />
          <Text style={[styles.previewBadgeText, { color: isDark ? '#A7F3D0' : '#047857' }]}>
            Next Evolution: Ancient Mystic Forest 🌲
          </Text>
        </View>
      </View>
    );
  };

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, 28) : Math.max(insets.top, 24);
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDark ? '#080E1A' : '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContainer,
            {
              backgroundColor: isDark ? '#080E1A' : '#F8FAFC',
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* OPTION A: WELCOME / ONBOARDING LANDING SCREEN */}
          {authMode === 'welcome' && (
            <View style={styles.welcomeContainer}>
              {/* Top Navigation Bar with Logo & Skip */}
              <View style={styles.welcomeTopBar}>
                <HabitUpLogo size="sm" />
                <TouchableOpacity
                style={[
                  styles.welcomeSkipBtn,
                  { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' },
                ]}
                onPress={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.welcomeSkipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </View>

            {/* Slide Hero Graphic & Info */}
            <View style={styles.welcomeSlideCard}>
              {/* Category Badge */}
              <View style={[styles.slideBadge, { backgroundColor: activeSlide.badgeBg }]}>
                <Text style={[styles.slideBadgeText, { color: activeSlide.badgeColor }]}>
                  {activeSlide.badge}
                </Text>
              </View>

              {/* Graphic Icon Glow */}
              <View
                style={[
                  styles.slideIconOuter,
                  { backgroundColor: activeSlide.glowOuter },
                ]}
              >
                <View
                  style={[
                    styles.slideIconInner,
                    {
                      backgroundColor: activeSlide.glowInner,
                      borderColor: activeSlide.borderColor,
                    },
                  ]}
                >
                  {currentSlide === 0 && <Flame size={44} color={activeSlide.iconColor} />}
                  {currentSlide === 1 && <Users size={44} color={activeSlide.iconColor} />}
                  {currentSlide === 2 && (
                    <PlantIllustration level={3} size="sm" isAnimated={true} />
                  )}
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={[styles.slideTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {activeSlide.title}
              </Text>
              <Text style={[styles.slideSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {activeSlide.subtitle}
              </Text>

              {/* Feature Preview Card */}
              <View
                style={[
                  styles.previewContainer,
                  {
                    backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                {renderSlidePreview(currentSlide)}
              </View>
            </View>

            {/* Slide Pagination & Navigation Controls */}
            <View style={styles.carouselNavRow}>
              <TouchableOpacity
                style={[
                  styles.navArrowBtn,
                  { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' },
                  currentSlide === 0 && { opacity: 0.35 },
                ]}
                onPress={() => currentSlide > 0 && setCurrentSlide(currentSlide - 1)}
                disabled={currentSlide === 0}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={isDark ? '#CBD5E1' : '#475569'} />
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                {ONBOARDING_SLIDES.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCurrentSlide(idx)}
                    style={[
                      styles.dot,
                      currentSlide === idx
                        ? [styles.activeDot, { backgroundColor: '#7C5CFF' }]
                        : [styles.inactiveDot, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }],
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.navArrowBtn,
                  { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' },
                  currentSlide === ONBOARDING_SLIDES.length - 1 && { opacity: 0.35 },
                ]}
                onPress={() => currentSlide < ONBOARDING_SLIDES.length - 1 && setCurrentSlide(currentSlide + 1)}
                disabled={currentSlide === ONBOARDING_SLIDES.length - 1}
                activeOpacity={0.7}
              >
                <ChevronRight size={20} color={isDark ? '#CBD5E1' : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.welcomeActionContainer}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  {
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                  },
                ]}
                onPress={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  I already have an account • Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* AUTH FORMS (SIGN IN / SIGN UP / FORGOT PASSWORD) */}
        {authMode !== 'welcome' && (
          <>
            {/* Header Branding */}
            <View style={styles.header}>
              <HabitUpLogo size="md" />
              <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Build atomic habits. Master consistency.
              </Text>
            </View>

            {/* Tab Switcher (Sign In vs Create Account) */}
            {authMode !== 'forgot' && (
              <View style={[styles.tabBar, { backgroundColor: isDark ? '#131C2E' : '#E2E8F0' }]}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    authMode === 'signin' && [
                      styles.tabBtnActive,
                      { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ],
                  ]}
                  onPress={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: authMode === 'signin' ? '#7C5CFF' : isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    authMode === 'signup' && [
                      styles.tabBtnActive,
                      { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ],
                  ]}
                  onPress={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: authMode === 'signup' ? '#7C5CFF' : isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Alert Banner */}
            {authError && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
                  },
                ]}
              >
                <AlertCircle size={18} color="#EF4444" />
                <Text style={[styles.errorBannerText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                  {authError}
                </Text>
              </View>
            )}

            {/* 1. SIGN IN FORM */}
            {authMode === 'signin' && (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Email or Username
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Mail size={18} color="#94A3B8" />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="user@example.com or @username"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeaderRow}>
                    <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                      Password
                    </Text>
                    <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                      <Text style={styles.forgotLink}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Lock size={18} color="#94A3B8" />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. SIGN UP FORM */}
            {authMode === 'signup' && (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Full Name
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                  >
                    <User size={18} color="#94A3B8" />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="Alex Rivera"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={name}
                      onChangeText={handleNameChange}
                    />
                  </View>
                </View>

                {/* Unique Username */}
                <View style={styles.inputGroup}>
                  <View style={styles.usernameHeaderRow}>
                    <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                      Choose Username
                    </Text>
                    {usernameFeedback ? (
                      <View style={styles.usernameStatusBadge}>
                        {usernameStatus === 'checking' && (
                          <ActivityIndicator size="small" color="#7C5CFF" style={{ transform: [{ scale: 0.7 }] }} />
                        )}
                        {usernameStatus === 'available' && (
                          <CheckCircle2 size={13} color="#10B981" />
                        )}
                        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                          <AlertCircle size={13} color="#EF4444" />
                        )}
                        <Text
                          style={[
                            styles.usernameStatusText,
                            {
                              color:
                                usernameStatus === 'available'
                                  ? '#10B981'
                                  : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                  ? '#EF4444'
                                  : '#818CF8',
                            },
                          ]}
                        >
                          {usernameFeedback}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor:
                          usernameStatus === 'available'
                            ? '#10B981'
                            : usernameStatus === 'taken' || usernameStatus === 'invalid'
                            ? '#EF4444'
                            : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                      },
                    ]}
                  >
                    <AtSign size={18} color={usernameStatus === 'available' ? '#10B981' : '#94A3B8'} />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="alex_rivera"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={[styles.helperText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    Unique handle for friends to find, follow, and compare routines.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Email Address
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Mail size={18} color="#94A3B8" />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="alex@example.com"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155', letterSpacing: 0.5, fontWeight: '700' }]}>
                    CREATE SECURE PASSWORD
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                        borderColor: password
                          ? getPasswordStrength(password).color
                          : isDark
                          ? '#1E293B'
                          : '#CBD5E1',
                      },
                    ]}
                  >
                    <Lock size={18} color="#94A3B8" />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                    </TouchableOpacity>
                  </View>
                  <PasswordStrengthIndicator password={password} isDark={isDark} />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Create Account</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 3. FORGOT PASSWORD FLOW */}
            {authMode === 'forgot' && (
              <View style={styles.formContainer}>
                <TouchableOpacity
                  style={styles.backToSignBtn}
                  onPress={() => {
                    setAuthMode('signin');
                    setForgotStep('request');
                  }}
                >
                  <ArrowLeft size={16} color="#818CF8" />
                  <Text style={styles.backToSignText}>Back to Sign In</Text>
                </TouchableOpacity>

                <View style={styles.forgotHeader}>
                  <Text style={[styles.forgotTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {forgotStep === 'request' ? 'Reset Password' : 'Set New Password'}
                  </Text>
                  <Text style={[styles.forgotSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {forgotStep === 'request'
                      ? 'Enter the email associated with your account and we will send a password reset code.'
                      : 'Enter the reset token sent to your email address and your new password.'}
                  </Text>
                </View>

                {forgotStep === 'request' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                        Email Address
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          },
                        ]}
                      >
                        <Mail size={18} color="#94A3B8" />
                        <TextInput
                          style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                          placeholder="user@example.com"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleRequestPasswordReset}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                          <ArrowRight size={18} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.haveTokenBtn}
                      onPress={() => setForgotStep('confirm')}
                    >
                      <Text style={styles.haveTokenText}>Already have a reset token? Enter it here</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                        Reset Token / Code
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          },
                        ]}
                      >
                        <KeyRound size={18} color="#94A3B8" />
                        <TextInput
                          style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                          placeholder="e.g. a3f9..."
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          value={resetToken}
                          onChangeText={setResetToken}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155', letterSpacing: 0.5, fontWeight: '700' }]}>
                        CREATE SECURE PASSWORD
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
                            borderColor: newPassword
                              ? getPasswordStrength(newPassword).color
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                      >
                        <Lock size={18} color="#94A3B8" />
                        <TextInput
                          style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                          placeholder="••••••••"
                          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          secureTextEntry={!showPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                        </TouchableOpacity>
                      </View>
                      <PasswordStrengthIndicator password={newPassword} isDark={isDark} />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleConfirmPasswordReset}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Confirm Password Reset</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  // Welcome Container & Carousel Styles
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  welcomeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  welcomeSkipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  welcomeSkipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeSlideCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  slideBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  slideBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slideIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  slideIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  previewContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  // Feature Previews
  previewStreakCard: {
    gap: 12,
  },
  previewDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  previewDayLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewDayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewSocialCard: {
    gap: 12,
  },
  previewSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  previewAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  previewUsername: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewConnector: {
    paddingHorizontal: 2,
  },
  previewGardenCard: {
    gap: 12,
  },
  previewGardenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewGardenIcon: {
    fontSize: 32,
  },
  previewGardenInfo: {
    flex: 1,
    gap: 6,
  },
  previewGardenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewGardenLevel: {
    fontSize: 13,
    fontWeight: '800',
  },
  previewGardenProgress: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  previewProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  // Carousel Nav
  carouselNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 18,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
  // Welcome Actions
  welcomeActionContainer: {
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Header Branding
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineColor: 'transparent',
          outlineStyle: 'none',
        }
      : {}),
  } as any,
  primaryBtn: {
    backgroundColor: '#7C5CFF',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  backToSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backToSignText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
  },
  forgotHeader: {
    marginBottom: 8,
  },
  forgotTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  forgotSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  haveTokenBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  haveTokenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
  },
  usernameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usernameStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
