import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlantStageInfo } from '../../types';
import { PlantIllustration } from './PlantIllustration';
import { Sparkles, Droplets } from 'lucide-react-native';
import { useHabit } from '../../context/HabitContext';

interface PlantVisualizerProps {
  stage: PlantStageInfo;
  streak: number;
  hydrationPercent: number;
  isWateredToday: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const PlantVisualizer: React.FC<PlantVisualizerProps> = ({
  stage,
  streak,
  hydrationPercent,
  isWateredToday,
  size = 'md',
}) => {
  const { theme } = useHabit();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <PlantIllustration
        level={stage.level}
        hydrationPercent={hydrationPercent}
        isWateredToday={isWateredToday}
        size={size}
      />

      {isWateredToday && (
        <View style={styles.sparkleBadge}>
          <Sparkles size={14} color="#FDE047" />
        </View>
      )}

      {hydrationPercent > 0 && !isWateredToday && (
        <View style={styles.dropletBadge}>
          <Droplets size={14} color="#38BDF8" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
  dropletBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
});
