import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Globe, Crosshair, ChevronDown, Check, X } from 'lucide-react-native';
import { POPULAR_TIMEZONES, getDetectedTimezone } from '../../constants/timezones';
import { useHabit } from '../../context/HabitContext';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
  showAutoDetect?: boolean;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  label = 'Select Timezone',
  showAutoDetect = true,
}) => {
  const { theme, showToast } = useHabit();
  const [modalVisible, setModalVisible] = useState(false);
  const isDark = theme === 'dark';

  const handleAutoDetect = () => {
    const detected = getDetectedTimezone();
    onChange(detected);
    showToast(`Timezone set to ${detected}`, undefined, 'info');
  };

  const selectedOption = POPULAR_TIMEZONES.find((t) => t.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <View style={styles.labelGroup}>
            <Globe size={14} color="#F43F5E" />
            <Text style={[styles.labelText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              {label}
            </Text>
          </View>
          {showAutoDetect && (
            <TouchableOpacity style={styles.autoBtn} onPress={handleAutoDetect}>
              <Crosshair size={12} color="#F43F5E" />
              <Text style={styles.autoBtnText}>Auto-detect</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#CBD5E1',
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? `[${selectedOption.offset}] ${selectedOption.label}` : value || 'Select Timezone'}
        </Text>
        <ChevronDown size={16} color={isDark ? '#94A3B8' : '#64748B'} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Select Timezone
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={POPULAR_TIMEZONES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.tzItem,
                      isSelected && { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.08)' },
                    ]}
                    onPress={() => {
                      onChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tzLabel,
                          { color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={[styles.tzOffset, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {item.group} • {item.offset}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#F43F5E" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F5E',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  tzItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  tzLabel: {
    fontSize: 13,
  },
  tzOffset: {
    fontSize: 11,
    marginTop: 2,
  },
});
