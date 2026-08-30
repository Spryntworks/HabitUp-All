import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useHabit } from '../../context/HabitContext';
import {
  X,
  User,
  Upload,
  Camera,
  Trash2,
  Check,
  Sparkles,
  LogOut,
  Save,
  Mail,
} from 'lucide-react';
import { TimezoneSelect } from '../common/TimezoneSelect';

const AVATAR_PRESETS = [
  {
    id: 'av-1',
    label: 'Elena',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Marcus',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Sophia',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'Lucas',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-5',
    label: 'Amara',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-6',
    label: 'David',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-7',
    label: 'Chloe',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-8',
    label: 'Kai',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-9',
    label: 'Aria',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
  },
];

export const AuthSessionModal: React.FC = () => {
  const {
    isAuthSessionModalOpen,
    setIsAuthSessionModalOpen,
    user,
    updateUser,
    logout,
    showToast,
    triggerCelebration,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(user.timezone);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(user.avatar);
  const [isSaved, setIsSaved] = useState(false);

  if (!isAuthSessionModalOpen) return null;

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    updateUser({ avatar: url });
    showToast('Profile picture updated!', undefined, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', undefined, 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedAvatar(dataUrl);
        updateUser({ avatar: dataUrl });
        showToast('Custom photo uploaded successfully!', undefined, 'success');
        triggerCelebration();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(undefined);
    updateUser({ avatar: undefined });
    showToast('Profile picture removed. Using initials avatar.', undefined, 'info');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      timezone,
      avatar: selectedAvatar,
    });
    setIsSaved(true);
    showToast('Profile saved successfully!', undefined, 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDark ? 'border-neutral-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Profile & Display Picture
              </h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Choose your avatar or upload your own photo
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthSessionModalOpen(false)}
            className={`p-1.5 rounded-full ${
              isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Main DP Preview & Action Buttons */}
          <div
            className={`p-5 rounded-2xl border flex flex-col items-center gap-4 text-center ${
              isDark ? 'bg-neutral-850 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="relative group">
              <div
                className={`w-24 h-24 rounded-full overflow-hidden ring-4 shadow-lg p-1 transition-transform group-hover:scale-105 ${
                  isDark
                    ? 'ring-[#7C5CFF] bg-neutral-800'
                    : 'ring-[#7C5CFF] bg-white'
                }`}
              >
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt={name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br from-[#7C5CFF] to-pink-500 rounded-full">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Quick camera trigger icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white shadow-md transition-transform hover:scale-110"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {name || 'Your Name'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {email || 'user@habitup.app'}
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>

              {selectedAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-750 text-rose-400 border-neutral-700'
                      : 'bg-white hover:bg-slate-100 text-rose-600 border-slate-200 shadow-xs'
                  }`}
                  title="Remove custom photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Preset DP Selection Gallery */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
                Choose from Preset Avatars
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isCurrent = selectedAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAvatarSelect(preset.url)}
                    className={`relative p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center group ${
                      isCurrent
                        ? isDark
                          ? 'bg-purple-950/40 border-[#7C5CFF] ring-2 ring-[#7C5CFF]/30 shadow-md'
                          : 'bg-purple-50 border-[#7C5CFF] ring-2 ring-[#7C5CFF]/30 shadow-md'
                        : isDark
                        ? 'bg-neutral-850 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-neutral-700 group-hover:scale-105 transition-transform">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-[#7C5CFF]/40 backdrop-blur-xs flex items-center justify-center">
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold truncate max-w-full ${
                        isCurrent
                          ? 'text-[#7C5CFF] font-bold'
                          : isDark
                          ? 'text-neutral-300'
                          : 'text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Profile Details Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider block ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Account Details
            </span>

            <div>
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-neutral-400' : 'text-slate-600'
                }`}
              >
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-3 pr-3 py-2 rounded-xl border text-xs font-medium ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white focus:border-[#7C5CFF]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#7C5CFF]'
                  }`}
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-neutral-400' : 'text-slate-600'
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-3 pr-3 py-2 rounded-xl border text-xs font-medium ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white focus:border-[#7C5CFF]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#7C5CFF]'
                  }`}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <TimezoneSelect
              value={timezone}
              onChange={setTimezone}
              label="Timezone"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-[#7C5CFF] hover:bg-[#6C4BFA] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 active:scale-98"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <button
            onClick={() => {
              setIsAuthSessionModalOpen(false);
              logout();
            }}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => setIsAuthSessionModalOpen(false)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-750 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
            }`}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

