import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import { QUICK_START_TEMPLATES } from '../../constants/templates';
import { IconRenderer } from '../common/IconRenderer';
import { Check, X, ArrowRight } from 'lucide-react-native';
import { HabitUpLogo } from '../common/HabitUpLogo';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    createHabit,
    showToast,
    triggerCelebration,
    theme,
  } = useHabit();

  const isDark = theme === 'dark';
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([
    'tpl-exercise',
    'tpl-read',
    'tpl-meditate',
    'tpl-drink-water',
  ]);

  if (!isOnboardingModalOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedTemplateIds.includes(id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter((t) => t !== id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, id]);
    }
  };

  const handleStartWithTemplates = () => {
    const selected = QUICK_START_TEMPLATES.filter((t) =>
      selectedTemplateIds.includes(t.id)
    );

    selected.forEach((tpl) => {
      createHabit({
        name: tpl.name,
        description: tpl.description,
        icon: tpl.icon,
        color: tpl.color,
        frequency_type: tpl.frequency_type,
        scheduled_days: tpl.scheduled_days,
        reminder_enabled: true,
        reminder_time: tpl.defaultTime,
      });
    });

    setIsOnboardingModalOpen(false);
    triggerCelebration();
    showToast(`Added ${selected.length} starter habits to your routine!`, undefined, 'success');
  };

  return (
    <Modal visible={isOnboardingModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setIsOnboardingModalOpen(false)}
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>

            <HabitUpLogo size="sm" />
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Quick-Start Habits
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Pick from proven foundational habits to build momentum:
            </Text>
          </View>

          {/* Templates Grid */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.templatesScroll}>
            {QUICK_START_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateIds.includes(tpl.id);
              return (
                <TouchableOpacity
                  key={tpl.id}
                  style={[
                    styles.tplCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isSelected
                        ? '#7C5CFF'
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => toggleSelect(tpl.id)}
                >
                  <View style={[styles.tplIconCircle, { backgroundColor: tpl.color }]}>
                    <IconRenderer name={tpl.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tplName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {tpl.name}
                    </Text>
                    <Text style={[styles.tplDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {tpl.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                      !isSelected && {
                        borderColor: isDark ? '#475569' : '#CBD5E1',
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer CTA */}
          <View style={[styles.footer, { borderTopColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[
                styles.startBtn,
                { opacity: selectedTemplateIds.length > 0 ? 1 : 0.5 },
              ]}
              onPress={handleStartWithTemplates}
              disabled={selectedTemplateIds.length === 0}
            >
              <Text style={styles.startBtnText}>
                Add {selectedTemplateIds.length} Habits & Start
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
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
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  templatesScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 20,
  },
  tplCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  tplIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplName: {
    fontSize: 14,
    fontWeight: '800',
  },
  tplDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C5CFF',
    borderColor: '#7C5CFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  startBtn: {
    backgroundColor: '#7C5CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
