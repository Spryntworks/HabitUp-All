import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Path,
  Circle,
  Ellipse,
  Line,
} from 'react-native-svg';
import { useHabit } from '../../context/HabitContext';

interface HabitlyMascotProps {
  onClick?: () => void;
}

export const HabitlyMascot: React.FC<HabitlyMascotProps> = ({ onClick }) => {
  const { theme } = useHabit();
  const isDark = theme === 'dark';

  // 1. Mascot Floating Loop
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 2. Stars Pulsating Loops (Dark mode)
  const star1 = useRef(new Animated.Value(0.3)).current;
  const star2 = useRef(new Animated.Value(0.4)).current;
  const star3 = useRef(new Animated.Value(0.2)).current;
  const star4 = useRef(new Animated.Value(0.5)).current;

  // 3. Sun Radiant Glow Pulse (Light mode)
  const sunGlowAnim = useRef(new Animated.Value(0.75)).current;
  const sunGlowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle Floating Animation
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // Twinkling Star 1
    const star1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(star1, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(star1, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    star1Loop.start();

    // Twinkling Star 2
    const star2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(star2, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(star2, {
          toValue: 0.2,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    star2Loop.start();

    // Twinkling Star 3
    const star3Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(star3, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(star3, {
          toValue: 0.1,
          duration: 1750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    star3Loop.start();

    // Twinkling Star 4
    const star4Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(star4, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(star4, {
          toValue: 0.4,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    star4Loop.start();

    // Sun Luminous Breathing Glow
    const sunGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sunGlowAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sunGlowScale, {
            toValue: 1.1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(sunGlowAnim, {
            toValue: 0.65,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sunGlowScale, {
            toValue: 0.98,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    sunGlowLoop.start();

    return () => {
      floatLoop.stop();
      star1Loop.stop();
      star2Loop.stop();
      star3Loop.stop();
      star4Loop.stop();
      sunGlowLoop.stop();
    };
  }, []);

  const AnimatedView = Animated.View as any;

  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.85}
      style={styles.container}
    >
      {/* 1. Dark Mode Twinkling Stars */}
      {isDark && (
        <>
          <AnimatedView
            style={[
              styles.star,
              {
                top: 6,
                left: 10,
                opacity: star1,
                transform: [{ scale: star1 }],
              },
            ]}
          >
            <Text style={{ color: '#FDE047', fontSize: 13, fontWeight: '900' }}>✦</Text>
          </AnimatedView>

          <AnimatedView
            style={[
              styles.star,
              {
                top: 24,
                left: 28,
                opacity: star2,
                transform: [{ scale: star2 }],
              },
            ]}
          >
            <Text style={{ color: '#67E8F9', fontSize: 10, fontWeight: '900' }}>★</Text>
          </AnimatedView>

          <AnimatedView
            style={[
              styles.star,
              {
                top: 8,
                right: 18,
                opacity: star3,
                transform: [{ scale: star3 }],
              },
            ]}
          >
            <Text style={{ color: '#FEF08A', fontSize: 11, fontWeight: '900' }}>✦</Text>
          </AnimatedView>

          <AnimatedView
            style={[
              styles.star,
              {
                top: 28,
                right: 36,
                opacity: star4,
                transform: [{ scale: star4 }],
              },
            ]}
          >
            <Text style={{ color: '#F472B6', fontSize: 9, fontWeight: '900' }}>★</Text>
          </AnimatedView>
        </>
      )}

      {/* 2. Light Mode Radiant Sun Glow */}
      {!isDark && (
        <AnimatedView
          style={[
            styles.sunAuraGlowDisk,
            {
              opacity: sunGlowAnim,
              transform: [{ scale: sunGlowScale }],
            },
          ]}
        />
      )}

      {/* 3. Floating Animated Mascot Graphic */}
      <AnimatedView
        style={{
          transform: [{ translateY: floatAnim }],
        }}
      >
        <Svg width={200} height={125} viewBox="0 0 220 135">
          <Defs>
            <LinearGradient id="mountainGrad" x1="110" y1="20" x2="110" y2="135">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="40%" stopColor="#10B981" />
              <Stop offset="100%" stopColor="#047857" />
            </LinearGradient>
            <LinearGradient id="snowGrad" x1="110" y1="18" x2="110" y2="55">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#E2E8F0" />
            </LinearGradient>
            <LinearGradient id="flagGrad" x1="110" y1="0" x2="135" y2="20">
              <Stop offset="0%" stopColor="#FF4D6D" />
              <Stop offset="100%" stopColor="#E11D48" />
            </LinearGradient>
            <LinearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFA07A" />
              <Stop offset="50%" stopColor="#FF6347" />
              <Stop offset="100%" stopColor="#E03822" />
            </LinearGradient>
            <LinearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FDE047" />
              <Stop offset="60%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>

            {/* Radiant Sun Glow Aura Gradient */}
            <RadialGradient id="sunAuraGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.22" />
              <Stop offset="80%" stopColor="#F97316" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {isDark ? (
            <G id="dark-mountain">
              {/* Back Mountain Silhouettes */}
              <Path d="M30 130L85 45 Q 91.5 40 98 45L150 130H30Z" fill="#1E293B" opacity={0.7} />
              <Path d="M110 130L155 60 Q 161.5 55 168 60L205 130H110Z" fill="#0F766E" opacity={0.4} />

              {/* Main Mountain Body */}
              <Path
                d="M50 135L103 26 Q 110 20 117 26L170 135 Q 170.5 139 167 139H53 Q 49.5 139 50 135Z"
                fill="url(#mountainGrad)"
              />
              {/* Scalloped Snow Cap */}
              <Path
                d="M103 26 Q 110 20 117 26L135 55 C 128 58 120 58 110 59 C 100 58 92 58 85 55L103 26Z"
                fill="url(#snowGrad)"
              />

              {/* Summit Flagpole & Pink Flag */}
              <Line x1="110" y1="20" x2="110" y2="2" stroke="#CBD5E1" strokeWidth={2.5} strokeLinecap="round" />
              <Path d="M110 2L135 8L110 14Z" fill="url(#flagGrad)" />
              <Circle cx="110" cy="2" r="2" fill="#FBBF24" />

              {/* Mountain Cute Eyes & Shiny Reflections */}
              <Circle cx="102" cy="78" r="3.5" fill="#064E3B" />
              <Circle cx="103" cy="76.5" r="1.2" fill="#FFFFFF" />
              <Circle cx="118" cy="78" r="3.5" fill="#064E3B" />
              <Circle cx="119" cy="76.5" r="1.2" fill="#FFFFFF" />

              {/* Rosy Cheeks */}
              <Ellipse cx="96" cy="83" rx="3.2" ry="2" fill="#F43F5E" opacity={0.65} />
              <Ellipse cx="124" cy="83" rx="3.2" ry="2" fill="#F43F5E" opacity={0.65} />

              {/* Happy Smile */}
              <Path
                d="M106 84 C 108 87 112 87 114 84"
                stroke="#064E3B"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />

              {/* Fluffy Base Night Clouds */}
              <Path
                d="M15 135 C 15 120 30 115 42 120 C 48 110 65 110 72 120 C 80 115 95 120 95 135 Z"
                fill="#1E293B"
                opacity={0.85}
              />
              <Path
                d="M125 135 C 125 118 140 115 152 120 C 160 112 178 112 186 122 C 195 118 208 122 208 135 Z"
                fill="#1E293B"
                opacity={0.85}
              />
            </G>
          ) : (
            <G id="light-sun">
              {/* Radiant Warm Ambient Sun Halo */}
              <Circle cx="110" cy="58" r="56" fill="url(#sunAuraGrad)" />

              {/* 5 Radiant Golden Sun Ray Dots in an Arc */}
              <Circle cx="110" cy="16" r="4.8" fill="url(#rayGrad)" />
              <Circle cx="138" cy="23" r="4.8" fill="url(#rayGrad)" />
              <Circle cx="82" cy="23" r="4.8" fill="url(#rayGrad)" />
              <Circle cx="156" cy="42" r="4.8" fill="url(#rayGrad)" />
              <Circle cx="64" cy="42" r="4.8" fill="url(#rayGrad)" />

              {/* Main 3D Sun Sphere with warm coral-orange depth */}
              <Circle cx="110" cy="65" r="38" fill="url(#sunGrad)" />

              {/* Sun Eyes & Reflections */}
              <Circle cx="101" cy="62" r="3.5" fill="#1F2937" />
              <Circle cx="102" cy="60.5" r="1.2" fill="#FFFFFF" />
              <Circle cx="119" cy="62" r="3.5" fill="#1F2937" />
              <Circle cx="120" cy="60.5" r="1.2" fill="#FFFFFF" />

              {/* Rosy Cheeks */}
              <Ellipse cx="93" cy="69" rx="3.8" ry="2.2" fill="#BE123C" opacity={0.4} />
              <Ellipse cx="127" cy="69" rx="3.8" ry="2.2" fill="#BE123C" opacity={0.4} />

              {/* Smile */}
              <Path
                d="M106 69 C 108 73 112 73 114 69"
                stroke="#1F2937"
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
              />

              {/* Fluffy Front Clouds */}
              <Ellipse cx="60" cy="116" rx="40" ry="25" fill="#FFFFFF" opacity={0.98} />
              <Ellipse cx="110" cy="120" rx="58" ry="27" fill="#FFFFFF" opacity={0.98} />
              <Ellipse cx="160" cy="116" rx="40" ry="25" fill="#FFFFFF" opacity={0.98} />
            </G>
          )}
        </Svg>
      </AnimatedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 125,
    position: 'relative',
    overflow: 'visible',
  },
  sunAuraGlowDisk: {
    position: 'absolute',
    top: 6,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(251, 191, 36, 0.22)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    shadowOpacity: 0.7,
    elevation: 8,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    zIndex: 2,
  },
});
