import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';

export interface LinearGradientProps extends ViewProps {
  colors: string[];
  start?: { x: number; y: number } | [number, number];
  end?: { x: number; y: number } | [number, number];
  locations?: number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  locations,
  style,
  children,
  ...rest
}) => {
  const startX = Array.isArray(start) ? start[0] : (start?.x ?? 0);
  const startY = Array.isArray(start) ? start[1] : (start?.y ?? 0);
  const endX = Array.isArray(end) ? end[0] : (end?.x ?? 0);
  const endY = Array.isArray(end) ? end[1] : (end?.y ?? 1);

  const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI + 90;

  const colorStops = colors
    .map((c, i) => {
      if (locations && locations[i] !== undefined) {
        return `${c} ${locations[i] * 100}%`;
      }
      return c;
    })
    .join(', ');

  const gradientString = `linear-gradient(${angle}deg, ${colorStops})`;

  return (
    <View
      style={[
        style,
        {
          // @ts-ignore
          backgroundImage: gradientString,
        },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

export default LinearGradient;
