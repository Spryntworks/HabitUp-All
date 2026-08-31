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
import { useHabit } from '../../context/HabitContext';
import { apiService } from '../../services/apiService';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { HabitUpLogo } from '../common/HabitUpLogo';
import { TimezoneSelect } from '../common/TimezoneSelect';
import { getDetectedTimezone } from '../../constants/timezones';
import { PasswordStrengthIndicator, getPasswordStrength } from '../common/PasswordStrengthIndicator';

export const AuthView: React.FC = () => {
  const { login, register, socialLogin, showToast, theme } = useHabit();
  const isDark = theme === 'dark';

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(getDetectedTimezone());

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm'>('request');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      const err = 'Please enter both your email and password.';
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
    if (!name.trim() || !email.trim() || !password.trim()) {
      const err = 'Please fill out your name, email, and password.';
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
      const res = await register(name.trim(), email.trim(), password, selectedTimezone);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: isDark ? '#080E1A' : '#F8FAFC' },
        ]}
        keyboardShouldPersistTaps="handled"
      >
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

            <TouchableOpacity
              style={[
                styles.guestBtn,
                {
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  backgroundColor: isDark ? '#131C2E' : '#F8FAFC',
                },
              ]}
              onPress={() => socialLogin('google')}
            >
              <Text style={[styles.guestBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Continue as Guest / Offline
              </Text>
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
                  onChangeText={setName}
                />
              </View>
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

            <TimezoneSelect value={selectedTimezone} onChange={setSelectedTimezone} />

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

            <TouchableOpacity
              style={[
                styles.guestBtn,
                {
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  backgroundColor: isDark ? '#131C2E' : '#F8FAFC',
                },
              ]}
              onPress={() => socialLogin('google')}
            >
              <Text style={[styles.guestBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Continue as Guest / Offline
              </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
    minHeight: '100%',
  },
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
  guestBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
