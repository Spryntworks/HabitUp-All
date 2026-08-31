import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useHabit } from '../../context/HabitContext';

interface HabitUpLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  themeMode?: 'dark' | 'light';
  style?: any;
}

export const HabitUpLogo: React.FC<HabitUpLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  themeMode,
  style,
}) => {
  const { theme: contextTheme } = useHabit();
  const activeTheme = themeMode || contextTheme || 'dark';
  const isDark = activeTheme === 'dark';

  // Dynamic colors based on active theme
  const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
  const holeColor = isDark ? '#080E1A' : '#F8FAFC';
  const subtitleColor = isDark ? '#8E9EB5' : '#64748B';

  const sizeMap = {
    xs: { width: 105, height: 36 },
    sm: { width: 130, height: 45 },
    md: { width: 155, height: 54 },
    lg: { width: 195, height: 68 },
    xl: { width: 245, height: 85 },
    '2xl': { width: 300, height: 104 },
  };

  const { width, height } = sizeMap[size];
  const calculatedHeight = showSubtitle ? height : Math.round(height * 0.75);
  const viewBoxHeight = showSubtitle ? 200 : 160;

  return (
    <View style={[styles.container, style]}>
      <Svg
        viewBox={`0 -8 575 ${viewBoxHeight}`}
        width={width}
        height={calculatedHeight}
      >
        <G id="habitup-brand-mark">
          {/* 'h' */}
          <G fill={primaryTextColor}>
            <Rect x="14" y="20" width="22" height="100" rx="11" />
            <Path d="M 25 64 C 33 48 45 44 58 44 C 73 44 83 54 83 70 L 83 120 C 83 126 78 131 72 131 C 66 131 61 126 61 120 L 61 74 C 61 66 55 62 47 62 C 39 62 31 68 25 76 Z" />
          </G>

          {/* 'a' */}
          <G fill={primaryTextColor}>
            <Circle cx="124" cy="86" r="34" />
            <Rect x="144" y="52" width="22" height="68" rx="11" />
            <Circle cx="124" cy="86" r="14.5" fill={holeColor} />
          </G>

          {/* 'b' */}
          <G fill={primaryTextColor}>
            <Rect x="182" y="20" width="22" height="100" rx="11" />
            <Circle cx="222" cy="86" r="34" />
            <Circle cx="222" cy="86" r="14.5" fill={holeColor} />
          </G>

          {/* 'i' */}
          <G fill={primaryTextColor}>
            <Circle cx="272" cy="30" r="11" />
            <Rect x="261" y="52" width="22" height="68" rx="11" />
          </G>

          {/* 't' */}
          <G fill={primaryTextColor}>
            <Rect x="310" y="30" width="22" height="90" rx="11" />
            <Rect x="294" y="52" width="50" height="20" rx="10" />
          </G>

          {/* 'up' (Vibrant Emerald: #00F298) */}
          <G fill="#00E599">
            <Rect x="368" y="52" width="22" height="46" rx="11" />
            <Path d="M 368 82 C 368 110 380 122 404 122 C 424 122 436 112 438 88 L 416 88 C 414 102 408 104 402 104 C 392 104 390 96 390 82 Z" />
            <Rect x="418" y="26" width="22" height="72" rx="11" />
            <Path d="M 429 -2 L 462 36 C 465 40 462 45 456 45 L 402 45 C 396 45 393 40 396 36 Z" />
            <Rect x="456" y="52" width="22" height="94" rx="11" />
            <Circle cx="494" cy="86" r="34" />
            <Circle cx="494" cy="86" r="14.5" fill={holeColor} />
          </G>

          {/* Amber Accent Dot '.' */}
          <Circle cx="542" cy="110" r="14" fill="#FFB800" />
        </G>

        {showSubtitle && (
          <SvgText
            x="14"
            y="176"
            fill={subtitleColor}
            fontWeight="bold"
            fontSize="24"
            letterSpacing="8.5"
          >
            DAILY HABIT TRACKER
          </SvgText>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
