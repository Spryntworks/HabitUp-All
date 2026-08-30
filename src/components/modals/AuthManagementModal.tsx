import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  ShieldCheck,
  Key,
  Smartphone,
  Laptop,
  Tablet,
  LogOut,
  User,
  Mail,
  Lock,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react';
import { TimezoneSelect } from '../common/TimezoneSelect';

export const AuthManagementModal: React.FC = () => {
  const {
    isAuthSessionModalOpen,
    setIsAuthSessionModalOpen,
    user,
    updateUser,
    sessions,
    revokeSession,
    revokeAllOtherSessions,
    showToast,
    triggerCelebration,
  } = useHabit();

  const [authTab, setAuthTab] = useState<'profile' | 'sessions' | 'switch_user' | 'token_lifecycle'>('profile');
  
  // Profile Form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(user.timezone);

  // New Account / Switch user state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputName, setInputName] = useState('');

  // Simulated JWT countdown
  const [jwtExpiresIn, setJwtExpiresIn] = useState(842); // in seconds (~14 mins)
  const [refreshTokenExpiresIn, setRefreshTokenExpiresIn] = useState(29); // in days

  if (!isAuthSessionModalOpen) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, timezone });
    showToast('Profile credentials saved!', undefined, 'success');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      if (!inputName.trim() || !inputEmail.trim()) return;
      updateUser({
        name: inputName.trim(),
        email: inputEmail.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      });
      triggerCelebration();
      showToast(`Registered successfully! Welcome, ${inputName.trim()}!`, undefined, 'success');
      setAuthTab('profile');
    } else if (authMode === 'login') {
      if (!inputEmail.trim()) return;
      const derivedName = inputEmail.split('@')[0];
      const capitalized = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      updateUser({
        name: capitalized,
        email: inputEmail.trim(),
      });
      showToast(`Logged in as ${capitalized} (JWT issued)`, undefined, 'success');
      setAuthTab('profile');
    } else {
      showToast(`Password reset link sent to ${inputEmail}`, undefined, 'info');
      setAuthMode('login');
    }
  };

  const handleSimulateTokenRotation = () => {
    setJwtExpiresIn(900); // reset to 15 mins (900s)
    showToast('POST /auth/refresh → Token pair rotated (New 15m JWT + 30d Refresh)', undefined, 'success');
  };

  const activeSessions = sessions.filter((s) => !s.revoked_at);

  const getDeviceIcon = (devName: string) => {
    const l = devName.toLowerCase();
    if (l.includes('mac') || l.includes('pc') || l.includes('laptop')) return <Laptop className="w-4 h-4 text-sky-400" />;
    if (l.includes('tab') || l.includes('ipad')) return <Tablet className="w-4 h-4 text-purple-400" />;
    return <Smartphone className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-neutral-100"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Authentication & Security</h2>
              <p className="text-[11px] text-neutral-400">PRD 8.1 JWT & Argon2id Protocol</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthSessionModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-5 pt-3 flex gap-1.5 border-b border-neutral-800/80 overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setAuthTab('profile')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              authTab === 'profile'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => setAuthTab('sessions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
              authTab === 'sessions'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            <span>Sessions</span>
            <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center">
              {activeSessions.length}
            </span>
          </button>
          <button
            onClick={() => setAuthTab('token_lifecycle')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              authTab === 'token_lifecycle'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            Token Lifecycle
          </button>
          <button
            onClick={() => setAuthTab('switch_user')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              authTab === 'switch_user'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-neutral-850 text-neutral-400 hover:text-white'
            }`}
          >
            Switch / Register
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: User Profile */}
          {authTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800">
                <div className="w-14 h-14 rounded-2xl ring-2 ring-rose-500/40 p-0.5 bg-neutral-800 shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white bg-rose-500 rounded-2xl text-lg">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{user.name}</h3>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                  <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Session • Authenticated
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>

                <TimezoneSelect
                  value={timezone}
                  onChange={setTimezone}
                  label="Timezone (Deterministic Streak Calculation)"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-rose-500/20"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Sessions & Device Management (PRD Section 8.1) */}
          {authTab === 'sessions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Active Devices & Keychains
                </span>
                <button
                  onClick={revokeAllOtherSessions}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Log Out All Other Devices
                </button>
              </div>

              <div className="space-y-2">
                {sessions.map((sess) => {
                  const isRevoked = Boolean(sess.revoked_at);
                  return (
                    <div
                      key={sess.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        sess.is_current
                          ? 'bg-neutral-850 border-rose-500/40 shadow-sm'
                          : isRevoked
                          ? 'bg-neutral-900/40 border-neutral-800/40 opacity-40'
                          : 'bg-neutral-850/60 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                          {getDeviceIcon(sess.device_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">
                              {sess.device_name}
                            </span>
                            {sess.is_current && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Current Device
                              </span>
                            )}
                            {isRevoked && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400">
                                Revoked
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1 truncate mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {sess.ip_address}
                          </span>
                        </div>
                      </div>

                      {!sess.is_current && !isRevoked && (
                        <button
                          onClick={() => revokeSession(sess.id)}
                          className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-xs font-bold transition-colors border border-neutral-700"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Token Lifecycle & Cryptographic Security */}
          {authTab === 'token_lifecycle' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-850 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">JWT Access Token</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.floor(jwtExpiresIn / 60)}m {jwtExpiresIn % 60}s
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${(jwtExpiresIn / 900) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Short-lived JWT (15 minutes). Paired with rotating 30-day refresh token stored securely in iOS Keychain / Android Keystore.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-850 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Password Hash Protocol</span>
                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Argon2id
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Meets OWASP standards: Argon2id (memory cost 64MB, 3 iterations, 4 parallelism lanes).
                </p>
              </div>

              <button
                onClick={handleSimulateTokenRotation}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-sky-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Simulate POST /auth/refresh Rotation
              </button>
            </div>
          )}

          {/* TAB 4: Switch Account or Register */}
          {authTab === 'switch_user' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-neutral-850 p-1 rounded-xl border border-neutral-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    authMode === 'login' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    authMode === 'register' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Register (Sign Up)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    authMode === 'reset' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Reset
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Miller"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-[0.98] shadow-md shadow-rose-500/20"
                >
                  {authMode === 'register' ? 'Create Account & Sign In' : authMode === 'login' ? 'Log In to Account' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={() => setIsAuthSessionModalOpen(false)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
