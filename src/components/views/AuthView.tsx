import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Apple,
  RefreshCw,
} from 'lucide-react';
import { HabitUpLogo } from '../common/HabitUpLogo';
import { TimezoneSelect } from '../common/TimezoneSelect';
import { getDetectedTimezone } from '../../constants/timezones';

export const AuthView: React.FC = () => {
  const {
    login,
    register,
    socialLogin,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form State - initialized empty for real, clean input
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getDetectedTimezone());
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSent, setForgotSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Password strength checker
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const passScore = calculatePasswordStrength(password);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter your email and password.', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        // toast is already shown by context or show it here
      }
    } catch {
      setIsLoading(false);
      showToast('An unexpected error occurred during sign in.', undefined, 'warning');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill out all fields.', undefined, 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(name.trim(), email.trim(), password, selectedTimezone);
      setIsLoading(false);
      if (!res.success) {
        // Error toast already displayed by register
      }
    } catch {
      setIsLoading(false);
      showToast('An unexpected error occurred during registration.', undefined, 'warning');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please enter your registered email.', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotSent(true);
      showToast(`Password reset link sent to ${forgotEmail}`, undefined, 'info');
    }, 600);
  };

  return (
    <div className={`flex flex-col flex-1 px-5 pt-3 pb-6 min-h-full justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Top Brand & Form Section */}
      <div className="space-y-4 pt-1">
        {/* Logo Badge & Brand Name */}
        <div className="flex items-center">
          <HabitUpLogo size="md" showSubtitle={true} />
        </div>

        {/* Motivational Greeting & Heading */}
        <div className="pt-1">
          <h2 className={`text-2xl font-black tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {authMode === 'signin'
              ? 'Welcome back.'
              : authMode === 'signup'
              ? 'Build atomic habits.'
              : 'Reset password.'}
          </h2>
          <p className={`text-xs mt-1 font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {authMode === 'signin'
              ? 'Sign in to track your streaks and sync across devices.'
              : authMode === 'signup'
              ? 'Join over 120,000 disciplined achievers today.'
              : 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Segmented Auth Mode Switcher */}
        {authMode !== 'forgot' && (
          <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200/80'}`}>
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'signin'
                  ? isDark
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'signup'
                  ? isDark
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
            {/* Email Field */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 shadow-xs'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 shadow-xs'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className={`flex items-center gap-2 cursor-pointer select-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-rose-500 focus:ring-rose-500 accent-rose-500"
                />
                <span className="text-[11px] font-medium">Remember me</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In to HabitUp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 pt-1">
            {/* Full Name */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Your Full Name
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 shadow-xs'
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 shadow-xs'
                  }`}
                />
              </div>
            </div>

            {/* Password with Strength Indicator */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Create Secure Password
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 shadow-xs'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className={`flex gap-1 h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full transition-all ${
                        passScore >= 1 ? 'bg-rose-500 w-1/4' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full transition-all ${
                        passScore >= 2 ? 'bg-amber-500 w-1/4' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full transition-all ${
                        passScore >= 3 ? 'bg-sky-500 w-1/4' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full transition-all ${
                        passScore >= 4 ? 'bg-emerald-500 w-1/4' : 'w-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Password Strength</span>
                    <span
                      className={`font-bold ${
                        passScore >= 4
                          ? 'text-emerald-500'
                          : passScore >= 2
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {passScore >= 4 ? 'Strong' : passScore >= 2 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timezone Selector */}
            <TimezoneSelect
              value={selectedTimezone}
              onChange={setSelectedTimezone}
              label="Select Timezone"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authMode === 'forgot' && (
          <div className="space-y-4 pt-1">
            {forgotSent ? (
              <div className={`p-5 rounded-2xl border text-center space-y-2.5 ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Reset Link Dispatched
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Instructions have been sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setAuthMode('signin');
                  }}
                  className={`mt-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-3.5 py-3 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                        isDark
                          ? 'bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 focus:border-rose-500'
                          : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 shadow-xs'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-3 rounded-2xl border font-bold text-xs transition-colors ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Social SSO Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Or continue with
            </span>
            <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Apple Sign In Button */}
            <button
              type="button"
              onClick={() => socialLogin('apple')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-black shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              }`}
            >
              <Apple className={`w-4 h-4 ${isDark ? 'fill-black' : 'fill-white'}`} />
              <span>Apple</span>
            </button>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => socialLogin('google')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.96 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Footer Note */}
      <div className={`pt-4 border-t text-center mt-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
        <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          By continuing, you agree to HabitUp's Terms of Service &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
};

