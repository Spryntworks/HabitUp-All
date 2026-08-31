import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: string;
  color: string;
}

export function getPasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass || pass.length === 0) {
    return { score: 0, label: '', color: '#64748B' };
  }
  if (pass.length < 6) {
    return { score: 1, label: 'Weak', color: '#FF4D6D' };
  }

  let points = 1;
  if (pass.length >= 8) points++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) points++;
  if (/\d/.test(pass)) points++;
  if (/[^A-Za-z0-9]/.test(pass)) points++;

  if (points <= 1) {
    return { score: 1, label: 'Weak', color: '#FF4D6D' };
  } else if (points === 2) {
    return { score: 2, label: 'Fair', color: '#FF8A00' };
  } else if (points === 3 || points === 4) {
    return { score: 3, label: 'Medium', color: '#FFB800' };
  } else {
    return { score: 4, label: 'Strong', color: '#00E599' };
  }
}

const BAR_COLORS = [
  '#FF4D6D', // Red / Coral
  '#FF8A00', // Orange
  '#00C2FF', // Blue / Cyan
  '#00E599', // Emerald Green
];

interface Props {
  password: string;
  isDark?: boolean;
}

export const PasswordStrengthIndicator: React.FC<Props> = ({ password, isDark = true }) => {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const trackColor = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {BAR_COLORS.map((activeColor, idx) => {
          const isActive = score > idx;
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  backgroundColor: isActive ? activeColor : trackColor,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.labelRow}>
        <Text style={[styles.title, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          Password Strength
        </Text>
        <Text style={[styles.level, { color }]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 6,
  },
  bar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
  },
  level: {
    fontSize: 12,
    fontWeight: '700',
  },
});
