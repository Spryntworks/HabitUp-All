import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Rect,
  Circle,
  Ellipse,
  Polygon,
  Line,
} from 'react-native-svg';
import { StreakRealmId } from '../../utils/realmStreakData';

interface StreakRealmIllustrationProps {
  realmId?: StreakRealmId;
  level: number;
  hydrationPercent?: number;
  isWateredToday?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
}

export const StreakRealmIllustration: React.FC<StreakRealmIllustrationProps> = ({
  realmId = 'garden',
  level,
  size = 'md',
  isAnimated = true,
}) => {
  const swayAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimated) return;

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

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

    swayLoop.start();
    pulseLoop.start();
    floatLoop.start();

    return () => {
      swayLoop.stop();
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [isAnimated]);

  const rotation = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const sizeMap = {
    sm: 52,
    md: 110,
    lg: 190,
  };
  const dim = sizeMap[size];

  return (
    <View style={[styles.container, { width: dim, height: dim }]}>
      {/* 1. Crisp Base / Ground Shadow & Structure */}
      <Svg viewBox="0 0 200 220" width={dim} height={dim}>
        <Defs>
          <LinearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#EA580C" />
            <Stop offset="50%" stopColor="#C2410C" />
            <Stop offset="100%" stopColor="#9A3412" />
          </LinearGradient>

          <LinearGradient id="hearthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#78350F" />
            <Stop offset="100%" stopColor="#451A03" />
          </LinearGradient>

          <LinearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4C1D95" />
            <Stop offset="100%" stopColor="#2E1065" />
          </LinearGradient>

          <LinearGradient id="padGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#1E293B" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>

          <LinearGradient id="altarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#831843" />
            <Stop offset="100%" stopColor="#500724" />
          </LinearGradient>

          <LinearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#713F12" />
            <Stop offset="100%" stopColor="#3F2207" />
          </LinearGradient>
        </Defs>

        {/* Ambient Ground Shadow */}
        <Ellipse cx="100" cy="208" rx="46" ry="7" fill="rgba(0, 0, 0, 0.45)" />

        {/* Clean Base according to realm */}
        {realmId === 'garden' && (
          <G id="terracotta-pot">
            <Path d="M 64 162 L 74 200 Q 76 205 84 205 L 116 205 Q 124 205 126 200 L 136 162 Z" fill="url(#potGrad)" />
            <Rect x="58" y="154" width="84" height="11" rx="4" fill="#D97706" />
            <Ellipse cx="100" cy="158" rx="38" ry="4.5" fill="#3E2723" />
          </G>
        )}

        {realmId === 'flame' && (
          <G id="fire-hearth">
            <Ellipse cx="100" cy="186" rx="42" ry="12" fill="url(#hearthGrad)" />
            <Ellipse cx="100" cy="184" rx="36" ry="9" fill="#1C1917" />
            <Circle cx="68" cy="186" r="8" fill="#44403C" />
            <Circle cx="84" cy="190" r="7" fill="#57534E" />
            <Circle cx="100" cy="191" r="8" fill="#44403C" />
            <Circle cx="116" cy="190" r="7" fill="#57534E" />
            <Circle cx="132" cy="186" r="8" fill="#44403C" />
          </G>
        )}

        {realmId === 'dragon' && (
          <G id="dragon-nest">
            <Ellipse cx="100" cy="188" rx="44" ry="14" fill="url(#nestGrad)" />
            <Ellipse cx="100" cy="186" rx="38" ry="10" fill="#3B0764" />
            <Circle cx="76" cy="188" r="4" fill="#C084FC" opacity={0.8} />
            <Circle cx="100" cy="192" r="5" fill="#C084FC" opacity={1} />
            <Circle cx="124" cy="188" r="4" fill="#C084FC" opacity={0.8} />
          </G>
        )}

        {realmId === 'space' && (
          <G id="space-launchpad">
            <Ellipse cx="100" cy="190" rx="46" ry="12" fill="url(#padGrad)" />
            <Ellipse cx="100" cy="188" rx="38" ry="8" fill="#0284C7" opacity={0.4} />
            <Circle cx="70" cy="188" r="3" fill="#38BDF8" />
            <Circle cx="100" cy="194" r="3" fill="#38BDF8" />
            <Circle cx="130" cy="188" r="3" fill="#38BDF8" />
          </G>
        )}

        {realmId === 'gemstone' && (
          <G id="crystal-altar">
            <Path d="M 66 175 L 76 202 L 124 202 L 134 175 Z" fill="url(#altarGrad)" />
            <Polygon points="64,175 100,166 136,175 100,182" fill="#BE185D" />
          </G>
        )}

        {realmId === 'kingdom' && (
          <G id="floating-island">
            <Path d="M 54 170 Q 100 205 146 170 Q 130 162 100 162 Q 70 162 54 170 Z" fill="url(#islandGrad)" />
            <Ellipse cx="100" cy="166" rx="44" ry="9" fill="#15803D" />
          </G>
        )}
      </Svg>

      {/* 2. Animated Mascot Container */}
      <Animated.View
        style={[
          styles.mascotContainer,
          isAnimated && {
            transform: [
              { rotate: rotation },
              { scale: pulseAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        <Svg viewBox="0 0 200 220" width={dim} height={dim}>
          <Defs>
            <LinearGradient id="gStem" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#15803D" />
              <Stop offset="100%" stopColor="#4ADE80" />
            </LinearGradient>
            <LinearGradient id="gLeaf" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#16A34A" />
              <Stop offset="100%" stopColor="#86EFAC" />
            </LinearGradient>
            <LinearGradient id="gFire" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#DC2626" />
              <Stop offset="50%" stopColor="#F97316" />
              <Stop offset="100%" stopColor="#FDE047" />
            </LinearGradient>
            <LinearGradient id="gBlueFire" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#1E40AF" />
              <Stop offset="50%" stopColor="#0284C7" />
              <Stop offset="100%" stopColor="#BAE6FD" />
            </LinearGradient>
            <LinearGradient id="gDragon" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#C084FC" />
              <Stop offset="100%" stopColor="#7E22CE" />
            </LinearGradient>
            <LinearGradient id="gRocket" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#94A3B8" />
            </LinearGradient>
            <LinearGradient id="gGem" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F472B6" />
              <Stop offset="100%" stopColor="#BE185D" />
            </LinearGradient>
            <LinearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="50%" stopColor="#FACC15" />
              <Stop offset="100%" stopColor="#CA8A04" />
            </LinearGradient>
          </Defs>

          {/* ==================== REALM 1: GARDEN ==================== */}
          {realmId === 'garden' && (
            <G id="garden-mascot">
              {level === 1 && (
                <G id="garden-1-sprout">
                  <Path d="M 100 158 Q 99 140 100 126" stroke="url(#gStem)" strokeWidth="4.5" strokeLinecap="round" />
                  <Path d="M 99 132 C 84 126 80 138 90 144 C 96 144 99 138 99 132 Z" fill="url(#gLeaf)" />
                  <Path d="M 101 126 C 118 118 122 130 112 136 C 105 136 101 132 101 126 Z" fill="url(#gLeaf)" />
                </G>
              )}
              {level === 2 && (
                <G id="garden-2-seedling">
                  <Path d="M 100 158 Q 98 135 100 106" stroke="url(#gStem)" strokeWidth="5.5" strokeLinecap="round" />
                  <Path d="M 99 136 C 78 130 74 144 86 148 C 94 148 99 140 99 136 Z" fill="url(#gLeaf)" />
                  <Path d="M 101 130 C 122 122 126 136 114 142 C 106 142 101 135 101 130 Z" fill="url(#gLeaf)" />
                  <Path d="M 99 114 C 84 104 80 116 90 122 C 96 122 99 118 99 114 Z" fill="url(#gLeaf)" />
                  <Path d="M 101 108 C 118 98 122 110 112 118 C 105 118 101 114 101 108 Z" fill="url(#gLeaf)" />
                </G>
              )}
              {level === 3 && (
                <G id="garden-3-blossom">
                  <Path d="M 100 158 Q 99 125 100 88" stroke="url(#gStem)" strokeWidth="6" strokeLinecap="round" />
                  <Path d="M 98 136 C 72 128 66 145 82 150 C 92 150 98 142 98 136 Z" fill="url(#gLeaf)" />
                  <Path d="M 102 128 C 128 118 134 135 118 142 C 108 142 102 134 102 128 Z" fill="url(#gLeaf)" />
                  <Ellipse cx="100" cy="82" rx="9" ry="12" fill="#EC4899" />
                  <Circle cx="100" cy="74" r="4" fill="#FDE047" />
                </G>
              )}
              {level === 4 && (
                <G id="garden-4-bloom">
                  <Path d="M 100 158 Q 98 115 100 78" stroke="url(#gStem)" strokeWidth="6.5" strokeLinecap="round" />
                  <Path d="M 98 134 C 68 122 62 142 80 148 C 92 148 98 140 98 134 Z" fill="url(#gLeaf)" />
                  <Path d="M 102 124 C 132 112 138 132 120 140 C 108 140 102 130 102 124 Z" fill="url(#gLeaf)" />
                  <Circle cx="74" cy="90" r="10" fill="#F43F5E" />
                  <Circle cx="126" cy="84" r="10" fill="#F43F5E" />
                  <Circle cx="74" cy="90" r="4" fill="#FEF08A" />
                  <Circle cx="126" cy="84" r="4" fill="#FEF08A" />
                </G>
              )}
              {level === 5 && (
                <G id="garden-5-bonsai">
                  <Path d="M 94 158 Q 84 130 92 104 Q 100 80 96 62" stroke="#92400E" strokeWidth="11" strokeLinecap="round" />
                  <Ellipse cx="96" cy="56" rx="28" ry="18" fill="url(#gLeaf)" />
                  <Ellipse cx="58" cy="84" rx="22" ry="14" fill="url(#gLeaf)" />
                  <Ellipse cx="130" cy="62" rx="24" ry="15" fill="url(#gLeaf)" />
                </G>
              )}
              {level === 6 && (
                <G id="garden-6-orchard">
                  <Path d="M 93 158 Q 88 120 95 86 Q 102 60 100 48" stroke="#92400E" strokeWidth="13" strokeLinecap="round" />
                  <Circle cx="100" cy="54" r="38" fill="url(#gLeaf)" />
                  <Circle cx="68" cy="66" r="26" fill="url(#gLeaf)" />
                  <Circle cx="132" cy="66" r="26" fill="url(#gLeaf)" />
                  <Circle cx="76" cy="64" r="6" fill="url(#gGold)" />
                  <Circle cx="122" cy="64" r="6" fill="url(#gGold)" />
                  <Circle cx="98" cy="46" r="6.5" fill="url(#gGold)" />
                </G>
              )}
            </G>
          )}

          {/* ==================== REALM 2: FLAME ==================== */}
          {realmId === 'flame' && (
            <G id="flame-mascot">
              {level === 1 && (
                <G id="flame-1-spark">
                  <Circle cx="100" cy="155" r="14" fill="url(#gFire)" />
                  <Circle cx="100" cy="155" r="7" fill="#FEF08A" />
                  <Circle cx="94" cy="132" r="3" fill="#F59E0B" />
                  <Circle cx="108" cy="126" r="2.5" fill="#FEF08A" />
                </G>
              )}
              {level === 2 && (
                <G id="flame-2-campfire">
                  <Path d="M 100 115 Q 120 145 115 175 Q 85 175 85 145 Q 85 130 100 115 Z" fill="url(#gFire)" />
                  <Path d="M 100 135 Q 110 155 106 172 Q 92 172 92 155 Z" fill="#FEF08A" />
                  <Line x1="85" y1="172" x2="115" y2="180" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
                  <Line x1="115" y1="172" x2="85" y2="180" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
                </G>
              )}
              {level === 3 && (
                <G id="flame-3-torch">
                  <Rect x="94" y="145" width="12" height="35" rx="3" fill="#78350F" />
                  <Polygon points="90,145 110,145 106,138 94,138" fill="#F59E0B" />
                  <Path d="M 100 80 Q 130 115 120 140 Q 80 140 80 115 Q 85 96 100 80 Z" fill="url(#gFire)" />
                  <Path d="M 100 105 Q 115 125 110 138 Q 90 138 90 125 Z" fill="#FEF08A" />
                </G>
              )}
              {level === 4 && (
                <G id="flame-4-plasma">
                  <Path d="M 100 68 Q 138 115 125 168 Q 75 168 75 115 Q 80 90 100 68 Z" fill="url(#gBlueFire)" />
                  <Path d="M 100 95 Q 120 130 114 162 Q 86 162 86 130 Z" fill="#E0F2FE" />
                  <Circle cx="100" cy="120" r="10" fill="#FFFFFF" />
                  <Ellipse cx="100" cy="120" rx="35" ry="12" stroke="#38BDF8" strokeWidth="2" fill="none" transform="rotate(25 100 120)" />
                </G>
              )}
              {level === 5 && (
                <G id="flame-5-phoenix">
                  <Path d="M 100 90 Q 100 130 100 160" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  <Path d="M 100 110 Q 40 70 30 115 Q 65 125 100 120 Z" fill="url(#gFire)" />
                  <Path d="M 100 110 Q 160 70 170 115 Q 135 125 100 120 Z" fill="url(#gFire)" />
                  <Circle cx="100" cy="80" r="12" fill="#FEF08A" />
                  <Polygon points="100,64 94,80 106,80" fill="#EF4444" />
                  <Path d="M 100 160 Q 80 185 70 195" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                  <Path d="M 100 160 Q 120 185 130 195" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                </G>
              )}
              {level === 6 && (
                <G id="flame-6-supernova">
                  <Circle cx="100" cy="110" r="38" fill="url(#gFire)" />
                  <Circle cx="100" cy="110" r="26" fill="#FEF08A" />
                  <Circle cx="100" cy="110" r="16" fill="#FFFFFF" />
                  <Path d="M 100 50 L 100 30" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
                  <Path d="M 100 170 L 100 190" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
                  <Path d="M 40 110 L 20 110" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
                  <Path d="M 160 110 L 180 110" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
                  <Path d="M 55 65 L 40 50" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                  <Path d="M 145 65 L 160 50" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                  <Path d="M 55 155 L 40 170" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                  <Path d="M 145 155 L 160 170" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                </G>
              )}
            </G>
          )}

          {/* ==================== REALM 3: DRAGON ==================== */}
          {realmId === 'dragon' && (
            <G id="dragon-mascot">
              {level === 1 && (
                <G id="dragon-1-egg">
                  <Ellipse cx="100" cy="140" rx="26" ry="34" fill="url(#gDragon)" />
                  <Path d="M 94 125 Q 100 135 96 150" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
                  <Circle cx="100" cy="138" r="8" fill="#FDE047" opacity={0.6} />
                </G>
              )}
              {level === 2 && (
                <G id="dragon-2-hatchling">
                  <Path d="M 75 160 Q 100 185 125 160 Q 120 148 100 152 Q 80 148 75 160 Z" fill="#E2E8F0" />
                  <Ellipse cx="100" cy="136" rx="18" ry="20" fill="url(#gDragon)" />
                  <Circle cx="100" cy="106" r="16" fill="url(#gDragon)" />
                  <Path d="M 86 130 Q 70 120 75 140 Z" fill="#A855F7" />
                  <Path d="M 114 130 Q 130 120 125 140 Z" fill="#A855F7" />
                  <Circle cx="95" cy="105" r="4" fill="#FEF08A" />
                  <Circle cx="105" cy="105" r="4" fill="#FEF08A" />
                  <Circle cx="95" cy="105" r="2" fill="#1E1B4B" />
                  <Circle cx="105" cy="105" r="2" fill="#1E1B4B" />
                </G>
              )}
              {level === 3 && (
                <G id="dragon-3-drake">
                  <Ellipse cx="100" cy="138" rx="22" ry="26" fill="url(#gDragon)" />
                  <Circle cx="100" cy="96" r="18" fill="url(#gDragon)" />
                  <Polygon points="88,82 82,70 93,78" fill="#FACC15" />
                  <Polygon points="112,82 118,70 107,78" fill="#FACC15" />
                  <Path d="M 80 130 Q 55 105 64 138 Z" fill="#A855F7" />
                  <Path d="M 120 130 Q 145 105 136 138 Z" fill="#A855F7" />
                  <Circle cx="94" cy="95" r="3.5" fill="#FEF08A" />
                  <Circle cx="106" cy="95" r="3.5" fill="#FEF08A" />
                  <Circle cx="100" cy="76" r="6" fill="#F97316" opacity={0.8} />
                  <Circle cx="92" cy="68" r="4" fill="#94A3B8" opacity={0.5} />
                </G>
              )}
              {level === 4 && (
                <G id="dragon-4-armored">
                  <Ellipse cx="100" cy="130" rx="26" ry="32" fill="url(#gDragon)" />
                  <Polygon points="90,118 110,118 106,145 94,145" fill="url(#gGold)" />
                  <Circle cx="100" cy="85" r="20" fill="url(#gDragon)" />
                  <Polygon points="84,70 74,48 92,62" fill="url(#gGold)" />
                  <Polygon points="116,70 126,48 108,62" fill="url(#gGold)" />
                  <Path d="M 76 120 Q 35 85 45 135 Z" fill="#7C3AED" />
                  <Path d="M 124 120 Q 165 85 155 135 Z" fill="#7C3AED" />
                  <Circle cx="93" cy="84" r="4" fill="#FEF08A" />
                  <Circle cx="107" cy="84" r="4" fill="#FEF08A" />
                </G>
              )}
              {level === 5 && (
                <G id="dragon-5-guardian">
                  <Ellipse cx="100" cy="120" rx="24" ry="30" fill="url(#gDragon)" transform="rotate(-15 100 120)" />
                  <Circle cx="112" cy="78" r="18" fill="url(#gDragon)" />
                  <Path d="M 80 110 Q 20 60 30 125 Q 60 125 80 115 Z" fill="url(#gGold)" />
                  <Path d="M 120 110 Q 180 60 170 125 Q 140 125 120 115 Z" fill="url(#gGold)" />
                  <Polygon points="104,64 100,42 114,56" fill="#FACC15" />
                  <Polygon points="122,66 130,44 122,58" fill="#FACC15" />
                  <Circle cx="60" cy="160" r="3.5" fill="#38BDF8" />
                  <Circle cx="80" cy="175" r="4" fill="#FEF08A" />
                  <Circle cx="130" cy="165" r="3" fill="#C084FC" />
                </G>
              )}
              {level === 6 && (
                <G id="dragon-6-celestial-wyrm">
                  <Path d="M 100 160 Q 60 130 85 100 Q 115 70 100 45" stroke="url(#gDragon)" strokeWidth="22" strokeLinecap="round" fill="none" />
                  <Circle cx="100" cy="45" r="22" fill="url(#gGold)" />
                  <Polygon points="84,32 80,14 90,26 100,10 110,26 120,14 116,32" fill="#F59E0B" />
                  <Path d="M 86 52 Q 60 60 50 75" stroke="#FEF08A" strokeWidth="2.5" fill="none" />
                  <Path d="M 114 52 Q 140 60 150 75" stroke="#FEF08A" strokeWidth="2.5" fill="none" />
                  <Circle cx="93" cy="44" r="4.5" fill="#EF4444" />
                  <Circle cx="107" cy="44" r="4.5" fill="#EF4444" />
                  <Circle cx="100" cy="90" r="10" fill="url(#gGold)" />
                </G>
              )}
            </G>
          )}

          {/* ==================== REALM 4: SPACE ==================== */}
          {realmId === 'space' && (
            <G id="space-mascot">
              {level === 1 && (
                <G id="space-1-rover">
                  <Rect x="80" y="140" width="40" height="26" rx="6" fill="#38BDF8" />
                  <Circle cx="86" cy="168" r="7" fill="#1E293B" />
                  <Circle cx="114" cy="168" r="7" fill="#1E293B" />
                  <Line x1="100" y1="140" x2="100" y2="120" stroke="#38BDF8" strokeWidth="3" />
                  <Circle cx="100" cy="116" r="5" fill="#FDE047" />
                </G>
              )}
              {level === 2 && (
                <G id="space-2-rocket">
                  <Path d="M 100 70 Q 115 95 115 145 L 85 145 Q 85 95 100 70 Z" fill="url(#gRocket)" />
                  <Polygon points="85,125 65,148 85,148" fill="#EF4444" />
                  <Polygon points="115,125 135,148 115,148" fill="#EF4444" />
                  <Circle cx="100" cy="100" r="8" fill="#0284C7" />
                  <Polygon points="92,148 108,148 100,175" fill="url(#gFire)" />
                </G>
              )}
              {level === 3 && (
                <G id="space-3-station">
                  <Circle cx="100" cy="110" r="22" fill="url(#gRocket)" />
                  <Circle cx="100" cy="110" r="12" fill="#0284C7" />
                  <Rect x="35" y="102" width="40" height="16" rx="2" fill="#0284C7" />
                  <Rect x="125" y="102" width="40" height="16" rx="2" fill="#0284C7" />
                  <Line x1="75" y1="110" x2="125" y2="110" stroke="#FFFFFF" strokeWidth="4" />
                </G>
              )}
              {level === 4 && (
                <G id="space-4-cruiser">
                  <Polygon points="100,55 135,145 100,135 65,145" fill="url(#gRocket)" />
                  <Polygon points="100,75 115,120 100,115 85,120" fill="#38BDF8" />
                  <Rect x="64" y="125" width="8" height="24" rx="2" fill="#1E293B" />
                  <Rect x="128" y="125" width="8" height="24" rx="2" fill="#1E293B" />
                  <Polygon points="65,149 71,149 68,168" fill="url(#gBlueFire)" />
                  <Polygon points="129,149 135,149 132,168" fill="url(#gBlueFire)" />
                </G>
              )}
              {level === 5 && (
                <G id="space-5-nebula-probe">
                  <Circle cx="100" cy="110" r="24" fill="#6366F1" />
                  <Path d="M 70 85 Q 100 65 130 85" stroke="#FFFFFF" strokeWidth="4" fill="none" />
                  <Line x1="100" y1="75" x2="100" y2="55" stroke="#FDE047" strokeWidth="3" />
                  <Circle cx="100" cy="52" r="4" fill="#FDE047" />
                  <Circle cx="75" cy="135" r="7" fill="#38BDF8" />
                  <Circle cx="125" cy="135" r="7" fill="#38BDF8" />
                  <Ellipse cx="100" cy="155" rx="45" ry="14" fill="#C084FC" opacity={0.35} />
                </G>
              )}
              {level === 6 && (
                <G id="space-6-galactic-core">
                  <Circle cx="100" cy="110" r="26" fill="#FFFFFF" />
                  <Circle cx="100" cy="110" r="16" fill="#A855F7" />
                  <Path d="M 100 110 Q 145 90 155 135 Q 140 165 100 155" stroke="#38BDF8" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <Path d="M 100 110 Q 55 130 45 85 Q 60 55 100 65" stroke="#EC4899" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <Circle cx="160" cy="90" r="6" fill="#FACC15" />
                  <Circle cx="40" cy="130" r="5" fill="#34D399" />
                  <Circle cx="120" cy="50" r="4" fill="#F43F5E" />
                </G>
              )}
            </G>
          )}

          {/* ==================== REALM 5: GEMSTONE ==================== */}
          {realmId === 'gemstone' && (
            <G id="gem-mascot">
              {level === 1 && (
                <G id="gem-1-geode">
                  <Polygon points="75,150 100,120 125,150 100,170" fill="#78716C" />
                  <Line x1="94" y1="135" x2="106" y2="155" stroke="#F472B6" strokeWidth="3" />
                  <Circle cx="100" cy="145" r="4" fill="#F472B6" />
                </G>
              )}
              {level === 2 && (
                <G id="gem-2-quartz">
                  <Polygon points="82,155 100,95 118,155 100,172" fill="url(#gGem)" />
                  <Polygon points="100,95 118,155 100,172" fill="#BE185D" opacity={0.6} />
                  <Line x1="100" y1="95" x2="100" y2="172" stroke="#FFFFFF" strokeWidth="2" opacity={0.6} />
                </G>
              )}
              {level === 3 && (
                <G id="gem-3-emerald">
                  <Polygon points="70,115 85,95 115,95 130,115 115,155 85,155" fill="#10B981" />
                  <Polygon points="85,110 115,110 105,145 95,145" fill="#34D399" />
                  <Polygon points="85,95 115,95 115,110 85,110" fill="#6EE7B7" />
                </G>
              )}
              {level === 4 && (
                <G id="gem-4-amethyst">
                  <Polygon points="90,155 100,80 110,155" fill="#9333EA" />
                  <Polygon points="75,160 85,105 95,160" fill="#A855F7" />
                  <Polygon points="105,160 118,110 128,160" fill="#7E22CE" />
                  <Polygon points="65,115 70,105 75,115 70,125" fill="#C084FC" />
                  <Polygon points="128,95 134,85 140,95 134,105" fill="#E879F9" />
                </G>
              )}
              {level === 5 && (
                <G id="gem-5-diamond-prism">
                  <Polygon points="65,110 80,85 120,85 135,110 100,165" fill="#E0F2FE" />
                  <Polygon points="80,85 120,85 110,110 90,110" fill="#38BDF8" />
                  <Polygon points="90,110 110,110 100,165" fill="#0284C7" />
                  <Line x1="130" y1="95" x2="165" y2="75" stroke="#F43F5E" strokeWidth="2.5" />
                  <Line x1="135" y1="105" x2="170" y2="100" stroke="#FBBF24" strokeWidth="2.5" />
                  <Line x1="130" y1="115" x2="165" y2="125" stroke="#38BDF8" strokeWidth="2.5" />
                </G>
              )}
              {level === 6 && (
                <G id="gem-6-infinity-core">
                  <Circle cx="100" cy="115" r="22" fill="url(#gGold)" />
                  <Circle cx="100" cy="115" r="14" fill="#FFFFFF" />
                  <Ellipse cx="100" cy="115" rx="46" ry="16" stroke="#FEF08A" strokeWidth="3" fill="none" transform="rotate(-25 100 115)" />
                  <Ellipse cx="100" cy="115" rx="46" ry="16" stroke="#38BDF8" strokeWidth="3" fill="none" transform="rotate(35 100 115)" />
                  <Circle cx="140" cy="100" r="5" fill="#38BDF8" />
                  <Circle cx="60" cy="130" r="4.5" fill="#EC4899" />
                </G>
              )}
            </G>
          )}

          {/* ==================== REALM 6: KINGDOM ==================== */}
          {realmId === 'kingdom' && (
            <G id="kingdom-mascot">
              {level === 1 && (
                <G id="kingdom-1-tent">
                  <Polygon points="70,165 100,110 130,165" fill="#D97706" />
                  <Polygon points="90,165 100,135 110,165" fill="#451A03" />
                  <Line x1="100" y1="110" x2="100" y2="95" stroke="#F59E0B" strokeWidth="2" />
                  <Polygon points="100,95 115,100 100,105" fill="#EF4444" />
                </G>
              )}
              {level === 2 && (
                <G id="kingdom-2-cottage">
                  <Rect x="75" y="130" width="50" height="35" rx="2" fill="#CBD5E1" />
                  <Polygon points="68,130 100,95 132,130" fill="#B91C1C" />
                  <Rect x="94" y="142" width="12" height="23" fill="#78350F" />
                  <Rect x="78" y="140" width="10" height="10" fill="#FEF08A" />
                  <Rect x="115" y="105" width="8" height="18" fill="#475569" />
                  <Circle cx="119" cy="98" r="4" fill="#94A3B8" opacity={0.6} />
                  <Circle cx="123" cy="88" r="5" fill="#94A3B8" opacity={0.4} />
                </G>
              )}
              {level === 3 && (
                <G id="kingdom-3-watchtower">
                  <Rect x="85" y="90" width="30" height="75" fill="#94A3B8" />
                  <Rect x="80" y="80" width="40" height="12" fill="#64748B" />
                  <Rect x="80" y="74" width="8" height="8" fill="#64748B" />
                  <Rect x="96" y="74" width="8" height="8" fill="#64748B" />
                  <Rect x="112" y="74" width="8" height="8" fill="#64748B" />
                  <Line x1="100" y1="74" x2="100" y2="52" stroke="#475569" strokeWidth="2.5" />
                  <Polygon points="100,54 125,60 100,66" fill="#3B82F6" />
                </G>
              )}
              {level === 4 && (
                <G id="kingdom-4-keep">
                  <Rect x="72" y="105" width="56" height="60" fill="#94A3B8" />
                  <Rect x="64" y="95" width="18" height="70" fill="#64748B" />
                  <Rect x="118" y="95" width="18" height="70" fill="#64748B" />
                  <Polygon points="64,95 73,78 82,95" fill="#1E40AF" />
                  <Polygon points="118,95 127,78 136,95" fill="#1E40AF" />
                  <Path d="M 90 165 L 90 142 Q 100 135 110 142 L 110 165 Z" fill="#451A03" />
                  <Circle cx="100" cy="120" r="6" fill="#FBBF24" />
                </G>
              )}
              {level === 5 && (
                <G id="kingdom-5-citadel">
                  <Rect x="68" y="105" width="64" height="60" fill="#CBD5E1" />
                  <Rect x="58" y="90" width="16" height="75" fill="#94A3B8" />
                  <Rect x="126" y="90" width="16" height="75" fill="#94A3B8" />
                  <Rect x="90" y="70" width="20" height="95" fill="#E2E8F0" />
                  <Polygon points="58,90 66,68 74,90" fill="#EC4899" />
                  <Polygon points="126,90 134,68 142,90" fill="#EC4899" />
                  <Polygon points="90,70 100,42 110,70" fill="#DB2777" />
                  <Circle cx="100" cy="95" r="8" fill="#FACC15" />
                </G>
              )}
              {level === 6 && (
                <G id="kingdom-6-sky-metropolis">
                  <Rect x="65" y="95" width="70" height="70" fill="#FFFFFF" />
                  <Circle cx="100" cy="95" r="20" fill="url(#gGold)" />
                  <Circle cx="75" cy="105" r="14" fill="url(#gGold)" />
                  <Circle cx="125" cy="105" r="14" fill="url(#gGold)" />
                  <Path d="M 94 165 L 94 195" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                  <Path d="M 106 165 L 106 195" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                  <Ellipse cx="70" cy="165" rx="16" ry="8" fill="#E2E8F0" />
                  <Ellipse cx="130" cy="165" rx="16" ry="8" fill="#E2E8F0" />
                  <Ellipse cx="100" cy="170" rx="22" ry="10" fill="#F8FAFC" />
                </G>
              )}
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
