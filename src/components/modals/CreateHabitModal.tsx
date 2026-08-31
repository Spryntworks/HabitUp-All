import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  StyleSheet,
} from 'react-native';
import { useHabit } from '../../context/HabitContext';
import {
  HABIT_COLORS,
  AVAILABLE_ICONS,
  DAYS_OF_WEEK,
  QUICK_START_TEMPLATES,
} from '../../constants/templates';
import { FrequencyType, QuickStartTemplate } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { formatTo12Hour } from '../../utils/streakCalculator';
import { ArrowLeft, Check, X, Bell, Sparkles, Clock } from 'lucide-react-native';

export const CreateHabitModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createHabit, theme } = useHabit();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Dumbbell');
  const [selectedColor, setSelectedColor] = useState('#FF5A79');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHour, setReminderHour] = useState('08');
  const [reminderMinute, setReminderMinute] = useState('00');
  const [reminderPeriod, setReminderPeriod] = useState<'AM' | 'PM'>('AM');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');

  const isDark = theme === 'dark';

  if (!isCreateModalOpen) return null;

  const updateTime12 = (h: string, m: string, p: 'AM' | 'PM') => {
    setReminderHour(h);
    setReminderMinute(m);
    setReminderPeriod(p);

    let hNum = parseInt(h || '8', 10);
    if (isNaN(hNum) || hNum < 1) hNum = 1;
    if (hNum > 12) hNum = 12;
    let mNum = parseInt(m || '0', 10);
    if (isNaN(mNum) || mNum < 0) mNum = 0;
    if (mNum > 59) mNum = 59;

    let h24 = hNum;
    if (p === 'AM') {
      if (hNum === 12) h24 = 0;
    } else {
      if (hNum !== 12) h24 = hNum + 12;
    }
    const final24 = `${String(h24).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
    setReminderTime(final24);
  };

  const handleApplyTemplate = (tpl: QuickStartTemplate) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setSelectedIcon(tpl.icon);
    setSelectedColor(tpl.color);
    setFrequencyType(tpl.frequency_type);
    setScheduledDays(tpl.scheduled_days);
    
    // Parse defaultTime (24h) to 12h
    const tParts = (tpl.defaultTime || '08:00').split(':');
    let h = parseInt(tParts[0] || '8', 10);
    const m = (tParts[1] || '00').padStart(2, '0');
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    updateTime12(String(h).padStart(2, '0'), m, p);

    setReminderEnabled(true);
    setActiveTab('custom');
  };

  const toggleDay = (dayIdx: number) => {
    if (scheduledDays.includes(dayIdx)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter((d) => d !== dayIdx));
      }
    } else {
      setScheduledDays([...scheduledDays, dayIdx].sort());
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Directly compute 24-hour time from current 12-hour values
    let hNum = parseInt(reminderHour || '8', 10);
    if (isNaN(hNum) || hNum < 1) hNum = 1;
    if (hNum > 12) hNum = 12;
    let mNum = parseInt(reminderMinute || '0', 10);
    if (isNaN(mNum) || mNum < 0) mNum = 0;
    if (mNum > 59) mNum = 59;

    let h24 = hNum;
    if (reminderPeriod === 'AM') {
      if (hNum === 12) h24 = 0;
    } else {
      if (hNum !== 12) h24 = hNum + 12;
    }
    const computedTime = `${String(h24).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;

    createHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: selectedIcon,
      color: selectedColor,
      frequency_type: frequencyType,
      scheduled_days: frequencyType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : scheduledDays,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? computedTime : undefined,
    });

    setIsCreateModalOpen(false);
    setName('');
    setDescription('');
    setSelectedIcon('Dumbbell');
    setSelectedColor('#FF5A79');
    setFrequencyType('daily');
    setReminderHour('08');
    setReminderMinute('00');
    setReminderPeriod('AM');
    setReminderTime('08:00');
  };

  return (
    <Modal visible={isCreateModalOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(false)}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              New Habit
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Sub Tabs: Custom vs Templates */}
          <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'custom' && { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
              ]}
              onPress={() => setActiveTab('custom')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'custom' ? '#7C5CFF' : isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Custom Habit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'templates' && { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
              ]}
              onPress={() => setActiveTab('templates')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'templates' ? '#7C5CFF' : isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                ⚡ Quick Templates
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'templates' ? (
              <View style={styles.templateList}>
                {QUICK_START_TEMPLATES.map((tpl) => (
                  <TouchableOpacity
                    key={tpl.id}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => handleApplyTemplate(tpl)}
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
                    <Sparkles size={16} color="#7C5CFF" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.form}>
                {/* Habit Name */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Habit Name
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                        borderColor: isDark ? '#374151' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                    placeholder="e.g. Read 10 pages"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Description / Motivation
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                        borderColor: isDark ? '#374151' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                    placeholder="e.g. Expand knowledge before bedtime"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                {/* Color Palette */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Accent Color
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                    {HABIT_COLORS.map((c) => {
                      const isSelected = c.hex === selectedColor;
                      return (
                        <TouchableOpacity
                          key={c.hex}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: c.hex },
                            isSelected && styles.colorSelected,
                          ]}
                          onPress={() => setSelectedColor(c.hex)}
                        >
                          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Icon Grid */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Icon
                  </Text>
                  <View style={styles.iconGrid}>
                    {AVAILABLE_ICONS.slice(0, 16).map((iconName) => {
                      const isSelected = iconName === selectedIcon;
                      return (
                        <TouchableOpacity
                          key={iconName}
                          style={[
                            styles.iconCell,
                            isSelected && {
                              backgroundColor: selectedColor,
                            },
                            !isSelected && {
                              backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                            },
                          ]}
                          onPress={() => setSelectedIcon(iconName)}
                        >
                          <IconRenderer
                            name={iconName}
                            size={18}
                            color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Frequency */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Frequency
                  </Text>
                  <View style={styles.freqRow}>
                    <TouchableOpacity
                      style={[
                        styles.freqBtn,
                        frequencyType === 'daily' && { backgroundColor: '#7C5CFF' },
                        frequencyType !== 'daily' && { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                      ]}
                      onPress={() => setFrequencyType('daily')}
                    >
                      <Text
                        style={[
                          styles.freqBtnText,
                          { color: frequencyType === 'daily' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155' },
                        ]}
                      >
                        Every Day
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.freqBtn,
                        frequencyType === 'custom_days' && { backgroundColor: '#7C5CFF' },
                        frequencyType !== 'custom_days' && { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                      ]}
                      onPress={() => setFrequencyType('custom_days')}
                    >
                      <Text
                        style={[
                          styles.freqBtnText,
                          { color: frequencyType === 'custom_days' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155' },
                        ]}
                      >
                        Specific Days
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {frequencyType === 'custom_days' && (
                    <View style={styles.daysRow}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isDaySelected = scheduledDays.includes(day.index);
                        return (
                          <TouchableOpacity
                            key={day.index}
                            style={[
                              styles.dayChip,
                              isDaySelected && { backgroundColor: selectedColor },
                              !isDaySelected && { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                            ]}
                            onPress={() => toggleDay(day.index)}
                          >
                            <Text
                              style={[
                                styles.dayChipText,
                                { color: isDaySelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                              ]}
                            >
                              {day.short}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Reminder Settings */}
                <View style={styles.reminderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Bell size={18} color="#7C5CFF" />
                    <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                      Daily Reminder
                    </Text>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ false: '#CBD5E1', true: '#7C5CFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {reminderEnabled && (
                  <View
                    style={[
                      styles.timeSection,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                        borderColor: isDark ? '#374151' : '#E2E8F0',
                      },
                    ]}
                  >
                    {/* Header Label */}
                    <View style={styles.timeHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Clock size={16} color="#7C5CFF" />
                        <Text style={[styles.timeLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                          Reminder Time
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.timePreviewBadge,
                          { backgroundColor: isDark ? '#0F172A' : '#EDE9FE' },
                        ]}
                      >
                        <Text style={styles.timePreviewBadgeText}>
                          {reminderHour || '08'}:{reminderMinute || '00'} {reminderPeriod}
                        </Text>
                      </View>
                    </View>

                    {/* Interactive 12-Hour Time Picker & AM/PM Switch */}
                    <View style={styles.timePickerRow}>
                      {/* Hour Input Box */}
                      <View style={styles.timeInputUnitBox}>
                        <Text style={[styles.timeUnitLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          Hour
                        </Text>
                        <TextInput
                          style={[
                            styles.timeUnitInput,
                            {
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#4B5563' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A',
                            },
                          ]}
                          value={reminderHour}
                          onChangeText={(val) => {
                            const num = val.replace(/[^0-9]/g, '');
                            if (num.length <= 2) {
                              updateTime12(num, reminderMinute, reminderPeriod);
                            }
                          }}
                          onBlur={() => {
                            let h = parseInt(reminderHour || '8', 10);
                            if (isNaN(h) || h < 1) h = 1;
                            if (h > 12) h = 12;
                            updateTime12(String(h).padStart(2, '0'), reminderMinute, reminderPeriod);
                          }}
                          placeholder="08"
                          placeholderTextColor="#94A3B8"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                      </View>

                      <Text style={[styles.timeColonText, { color: isDark ? '#94A3B8' : '#64748B' }]}>:</Text>

                      {/* Minute Input Box */}
                      <View style={styles.timeInputUnitBox}>
                        <Text style={[styles.timeUnitLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                          Min
                        </Text>
                        <TextInput
                          style={[
                            styles.timeUnitInput,
                            {
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: isDark ? '#4B5563' : '#CBD5E1',
                              color: isDark ? '#FFFFFF' : '#0F172A',
                            },
                          ]}
                          value={reminderMinute}
                          onChangeText={(val) => {
                            const num = val.replace(/[^0-9]/g, '');
                            if (num.length <= 2) {
                              updateTime12(reminderHour, num, reminderPeriod);
                            }
                          }}
                          onBlur={() => {
                            let m = parseInt(reminderMinute || '0', 10);
                            if (isNaN(m) || m < 0) m = 0;
                            if (m > 59) m = 59;
                            updateTime12(reminderHour, String(m).padStart(2, '0'), reminderPeriod);
                          }}
                          placeholder="00"
                          placeholderTextColor="#94A3B8"
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                      </View>

                      {/* AM / PM Segmented Selector */}
                      <View
                        style={[
                          styles.periodSelectorBox,
                          {
                            backgroundColor: isDark ? '#0F172A' : '#E2E8F0',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.periodBtn,
                            reminderPeriod === 'AM' && styles.periodBtnActive,
                          ]}
                          onPress={() => updateTime12(reminderHour, reminderMinute, 'AM')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodBtnText,
                              {
                                color: reminderPeriod === 'AM' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                                fontWeight: reminderPeriod === 'AM' ? '900' : '600',
                              },
                            ]}
                          >
                            AM
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.periodBtn,
                            reminderPeriod === 'PM' && styles.periodBtnActive,
                          ]}
                          onPress={() => updateTime12(reminderHour, reminderMinute, 'PM')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodBtnText,
                              {
                                color: reminderPeriod === 'PM' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                                fontWeight: reminderPeriod === 'PM' ? '900' : '600',
                              },
                            ]}
                          >
                            PM
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Quick Presets */}
                    <View style={styles.timePresetsGrid}>
                      {[
                        { label: '🌅 7:00 AM Morning', h: '07', m: '00', p: 'AM' as const },
                        { label: '☀️ 8:30 AM Daytime', h: '08', m: '30', p: 'AM' as const },
                        { label: '🌆 6:00 PM Evening', h: '06', m: '00', p: 'PM' as const },
                        { label: '🌙 9:00 PM Night', h: '09', m: '00', p: 'PM' as const },
                      ].map((preset) => {
                        const isSelected =
                          reminderHour === preset.h &&
                          reminderMinute === preset.m &&
                          reminderPeriod === preset.p;
                        return (
                          <TouchableOpacity
                            key={preset.label}
                            style={[
                              styles.timePresetChip,
                              {
                                backgroundColor: isSelected
                                  ? '#7C5CFF'
                                  : isDark
                                  ? '#111827'
                                  : '#FFFFFF',
                                borderColor: isSelected
                                  ? '#7C5CFF'
                                  : isDark
                                  ? '#374151'
                                  : '#E2E8F0',
                              },
                            ]}
                            onPress={() => updateTime12(preset.h, preset.m, preset.p)}
                          >
                            <Text
                              style={[
                                styles.timePresetText,
                                {
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : isDark
                                    ? '#CBD5E1'
                                    : '#475569',
                                  fontWeight: isSelected ? '800' : '600',
                                },
                              ]}
                            >
                              {preset.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Submit */}
          {activeTab === 'custom' && (
            <View style={[styles.footer, { borderTopColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: name.trim() ? '#7C5CFF' : isDark ? '#374151' : '#CBD5E1' },
                ]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.saveBtnText}>Create Habit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bodyScroll: {
    padding: 20,
    paddingBottom: 30,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineColor: 'transparent',
          outlineStyle: 'none',
        }
      : {}),
  } as any,
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  freqBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeSection: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  timePreviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timePreviewBadgeText: {
    color: '#7C5CFF',
    fontSize: 12,
    fontWeight: '800',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  timeInputUnitBox: {
    alignItems: 'center',
    gap: 4,
  },
  timeUnitLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeUnitInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '900',
    width: 60,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineColor: 'transparent',
          outlineStyle: 'none',
        }
      : {}),
  } as any,
  timeColonText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
  },
  periodSelectorBox: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginLeft: 'auto',
    marginTop: 16,
    gap: 2,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#7C5CFF',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  periodBtnText: {
    fontSize: 13,
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  timePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePresetText: {
    fontSize: 11,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  templateList: {
    gap: 10,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  tplIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplName: {
    fontSize: 14,
    fontWeight: '800',
  },
  tplDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
