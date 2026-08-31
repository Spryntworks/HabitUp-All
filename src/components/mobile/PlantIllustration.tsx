import React from 'react';
import { StreakRealmIllustration } from './StreakRealmIllustration';

interface PlantIllustrationProps {
  level: number;
  hydrationPercent?: number;
  isWateredToday?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = (props) => {
  return <StreakRealmIllustration realmId="garden" {...props} />;
};
