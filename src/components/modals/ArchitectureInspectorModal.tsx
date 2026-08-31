import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { Code, X } from 'lucide-react-native';

interface ArchitectureInspectorModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export const ArchitectureInspectorModal: React.FC<ArchitectureInspectorModalProps> = ({
  visible = false,
  onClose,
}) => {
  const { theme } = useHabit();
  const isDark = theme === 'dark';

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Code size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  System Architecture
                </Text>
                <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  React Native & Expo Architecture
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.bodyScroll}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#162032' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Text style={[styles.cardHeading, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                📱 Mobile Native Architecture
              </Text>
              <Text style={[styles.cardText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                • Expo SDK 52 + React Native 0.76{'\n'}
                • AsyncStorage offline local-first cache{'\n'}
                • Expo Notifications local scheduling{'\n'}
                • Expo Haptics tactile feedback{'\n'}
                • React Native SVG high-performance vector rendering
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: '60%',
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
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 30,
  },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
