import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useHabit } from '../../context/HabitContext';
import {
  X,
  User,
  Check,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import { TimezoneSelect } from '../common/TimezoneSelect';

const AVATAR_PRESETS = [
  {
    id: 'av-1',
    label: 'Cyber Hero',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Zen Master',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Scholar',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'Explorer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-5',
    label: 'Creative Artist',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-6',
    label: 'Innovator',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-7',
    label: 'Champion',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-8',
    label: 'Technologist',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-9',
    label: 'Night Owl',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-10',
    label: 'Astronaut',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
  },
];

export const AuthSessionModal: React.FC = () => {
  const {
    isAuthSessionModalOpen,
    setIsAuthSessionModalOpen,
    user,
    updateUser,
    showToast,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(user?.avatar);

  if (!isAuthSessionModalOpen) return null;

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && Platform.OS !== 'web') {
        showToast('Gallery access permission required.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedAvatar(imageUri);
        updateUser({ avatar: imageUri });
        showToast('Profile photo updated! 📸', undefined, 'success');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showToast('Could not open photo library', undefined, 'warning');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted && Platform.OS !== 'web') {
        showToast('Camera access permission required.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedAvatar(imageUri);
        updateUser({ avatar: imageUri });
        showToast('Photo captured and set! 📸', undefined, 'success');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showToast('Could not open camera', undefined, 'warning');
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(undefined);
    updateUser({ avatar: undefined });
    showToast('Profile picture reset to default.', undefined, 'info');
  };

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    updateUser({ avatar: url });
    showToast('Avatar selected!', undefined, 'success');
  };

  const handleSaveProfile = () => {
    updateUser({
      name: name.trim() || user?.name || 'Google User',
      email: email.trim() || user?.email || 'user@gmail.com',
      avatar: selectedAvatar,
    });
    showToast('Profile saved successfully!', undefined, 'success');
    setIsAuthSessionModalOpen(false);
  };

  return (
    <Modal visible={isAuthSessionModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#080E1A' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Camera size={18} color="#C084FC" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Edit Profile Picture
                </Text>
                <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Upload custom photo or pick an avatar
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsAuthSessionModalOpen(false)}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Center Avatar Preview */}
            <View style={styles.avatarPreviewBox}>
              <View style={styles.avatarCircleBig}>
                {selectedAvatar ? (
                  <Image source={{ uri: selectedAvatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarDefaultGradient}>
                    <Text style={styles.avatarInitials}>
                      {(name || user?.name || 'G').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {name || user?.name || 'Google User'}
              </Text>
              <Text style={[styles.profileEmail, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {email || user?.email || 'user@gmail.com'}
              </Text>
            </View>

            {/* Custom Upload Actions */}
            <View style={styles.uploadActionsRow}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickFromGallery}
              >
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cameraBtn,
                  {
                    backgroundColor: isDark ? '#131C2E' : '#F1F5F9',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
                onPress={handleTakePhoto}
              >
                <Camera size={16} color={isDark ? '#C084FC' : '#7C5CFF'} />
                <Text style={[styles.cameraBtnText, { color: isDark ? '#C084FC' : '#7C5CFF' }]}>
                  Camera
                </Text>
              </TouchableOpacity>

              {selectedAvatar && (
                <TouchableOpacity
                  style={[
                    styles.removeBtn,
                    {
                      backgroundColor: isDark ? '#1F121C' : '#FFF1F2',
                      borderColor: '#F43F5E',
                    },
                  ]}
                  onPress={handleRemoveAvatar}
                >
                  <Trash2 size={16} color="#F43F5E" />
                </TouchableOpacity>
              )}
            </View>

            {/* Presets Gallery */}
            <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              OR CHOOSE FROM PRESET AVATARS
            </Text>

            <View style={styles.presetsGrid}>
              {AVATAR_PRESETS.map((preset) => {
                const isCurrent = selectedAvatar === preset.url;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetItem,
                      {
                        borderColor: isCurrent ? '#7C5CFF' : isDark ? '#1E293B' : '#E2E8F0',
                        borderWidth: isCurrent ? 3 : 1,
                      },
                    ]}
                    onPress={() => handleAvatarSelect(preset.url)}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetImg} />
                    {isCurrent && (
                      <View style={styles.checkBadge}>
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Edit Display Name */}
            <View style={styles.formFields}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Display Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131C2E' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Save */}
          <View style={[styles.footer, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    maxHeight: '92%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 36,
  },
  avatarPreviewBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircleBig: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#7C5CFF',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  avatarDefaultGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  uploadBtn: {
    flex: 1.5,
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  cameraBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  removeBtn: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  presetItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formFields: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
