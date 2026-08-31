export type StreakRealmId = 'garden' | 'flame' | 'dragon' | 'space' | 'gemstone' | 'kingdom';

export interface RealmStage {
  level: number;
  name: string;
  emoji: string;
  minStreak: number;
  description: string;
  accentColor: string;
  badge: string;
}

export interface StreakRealm {
  id: StreakRealmId;
  name: string;
  emoji: string;
  tagline: string;
  requiredStreak: number;
  monthNumber: number;
  primaryColor: string;
  bgColor: string;
  lightBgColor: string;
  bgGradient: [string, string];
  stages: RealmStage[];
}

export const STREAK_REALMS: StreakRealm[] = [
  {
    id: 'garden',
    name: 'Living Garden',
    emoji: '🌱',
    tagline: 'Your daily habits water and grow your enchanted flora',
    requiredStreak: 0,
    monthNumber: 1,
    primaryColor: '#00E599',
    bgColor: '#071A12',
    lightBgColor: '#F0FDF4',
    bgGradient: ['#0A2419', '#05120C'],
    stages: [
      {
        level: 1,
        name: 'Little Sprout',
        emoji: '🌱',
        minStreak: 0,
        description: 'A delicate green sprout emerging from rich soil. Water it with daily habit check-ins!',
        accentColor: '#10b981',
        badge: 'Stage 1 • Sprout',
      },
      {
        level: 2,
        name: 'Growing Seedling',
        emoji: '🌿',
        minStreak: 3,
        description: 'Stronger stem and fresh vibrant leaves reaching up towards the sunlight.',
        accentColor: '#22c55e',
        badge: 'Stage 2 • Seedling',
      },
      {
        level: 3,
        name: 'Budding Blossom',
        emoji: '🪴',
        minStreak: 7,
        description: 'A lush bush developing tight pink flower buds. A full week of consistency!',
        accentColor: '#14b8a6',
        badge: 'Stage 3 • Blossom',
      },
      {
        level: 4,
        name: 'Flora in Bloom',
        emoji: '🌸',
        minStreak: 14,
        description: 'Vibrant flowers burst open with sweet fragrance. Two weeks unbroken streak.',
        accentColor: '#ec4899',
        badge: 'Stage 4 • Flora',
      },
      {
        level: 5,
        name: 'Zen Bonsai Tree',
        emoji: '🌳',
        minStreak: 21,
        description: 'A sculpted masterwork tree with thick curved trunk and serene cloud pads.',
        accentColor: '#8b5cf6',
        badge: 'Stage 5 • Bonsai',
      },
      {
        level: 6,
        name: 'Golden Orchard',
        emoji: '🍎',
        minStreak: 30,
        description: 'An enchanted celestial tree bearing glowing golden apples! 30-day mastery.',
        accentColor: '#f59e0b',
        badge: 'Stage 6 • Orchard',
      },
    ],
  },
  {
    id: 'flame',
    name: 'Cosmic Flame',
    emoji: '🔥',
    tagline: 'Feed the eternal fire with your unstoppable momentum',
    requiredStreak: 30,
    monthNumber: 2,
    primaryColor: '#FF6B00',
    bgColor: '#1A0B05',
    lightBgColor: '#FFF7ED',
    bgGradient: ['#281007', '#120401'],
    stages: [
      {
        level: 1,
        name: 'Flickering Spark',
        emoji: '✨',
        minStreak: 0,
        description: 'A tiny glowing ember floating gently with micro-sparks.',
        accentColor: '#F59E0B',
        badge: 'Stage 1 • Spark',
      },
      {
        level: 2,
        name: 'Campfire Flame',
        emoji: '🔥',
        minStreak: 3,
        description: 'A warm, cozy dancing orange flame crackling with energy.',
        accentColor: '#F97316',
        badge: 'Stage 2 • Campfire',
      },
      {
        level: 3,
        name: 'Blazing Torch',
        emoji: '🏮',
        minStreak: 7,
        description: 'A brilliant golden beacon casting light through darkness.',
        accentColor: '#EF4444',
        badge: 'Stage 3 • Torch',
      },
      {
        level: 4,
        name: 'Blue Plasma Fire',
        emoji: '⚡',
        minStreak: 14,
        description: 'Ultra-hot cobalt-blue plasma pulsating with intense electrical aura.',
        accentColor: '#38BDF8',
        badge: 'Stage 4 • Plasma',
      },
      {
        level: 5,
        name: 'Phoenix Firebird',
        emoji: '🦅',
        minStreak: 21,
        description: 'A majestic fiery bird flapping wings with radiant golden plumage.',
        accentColor: '#EC4899',
        badge: 'Stage 5 • Phoenix',
      },
      {
        level: 6,
        name: 'Solar Supernova',
        emoji: '☀️',
        minStreak: 30,
        description: 'A celestial miniature sun blazing with coronal solar flares!',
        accentColor: '#FBBF24',
        badge: 'Stage 6 • Supernova',
      },
    ],
  },
  {
    id: 'dragon',
    name: 'Dragon Hatchery',
    emoji: '🐉',
    tagline: 'Nurture and evolve your mythical dragon companion',
    requiredStreak: 60,
    monthNumber: 3,
    primaryColor: '#A855F7',
    bgColor: '#140A1F',
    lightBgColor: '#FAF5FF',
    bgGradient: ['#220F36', '#0E0417'],
    stages: [
      {
        level: 1,
        name: 'Mystic Egg',
        emoji: '🥚',
        minStreak: 0,
        description: 'An iridescent dragon egg wobbling gently with a warm internal heartbeat.',
        accentColor: '#C084FC',
        badge: 'Stage 1 • Mystic Egg',
      },
      {
        level: 2,
        name: 'Baby Hatchling',
        emoji: '🐣',
        minStreak: 3,
        description: 'A cute newborn dragon with big curious eyes and tiny fluttering wings.',
        accentColor: '#A855F7',
        badge: 'Stage 2 • Hatchling',
      },
      {
        level: 3,
        name: 'Playful Drake',
        emoji: '🐲',
        minStreak: 7,
        description: 'A bouncy young drake learning to breathe tiny puffs of smoke.',
        accentColor: '#7C3AED',
        badge: 'Stage 3 • Drake',
      },
      {
        level: 4,
        name: 'Armored Dragon',
        emoji: '🛡️',
        minStreak: 14,
        description: 'A proud standing dragon with gleaming scales and horn crests.',
        accentColor: '#6366F1',
        badge: 'Stage 4 • Armored',
      },
      {
        level: 5,
        name: 'Sky Guardian',
        emoji: '🌌',
        minStreak: 21,
        description: 'A soaring leviathan leaving a trail of stardust across the heavens.',
        accentColor: '#38BDF8',
        badge: 'Stage 5 • Guardian',
      },
      {
        level: 6,
        name: 'Celestial Wyrm',
        emoji: '👑',
        minStreak: 30,
        description: 'An ancient crowned golden wyrm radiating mythical celestial power!',
        accentColor: '#FBBF24',
        badge: 'Stage 6 • Celestial Wyrm',
      },
    ],
  },
  {
    id: 'space',
    name: 'Space Odyssey',
    emoji: '🚀',
    tagline: 'Fuel your starship and travel deeper into deep space',
    requiredStreak: 90,
    monthNumber: 4,
    primaryColor: '#38BDF8',
    bgColor: '#061320',
    lightBgColor: '#F0F9FF',
    bgGradient: ['#0A2035', '#030B14'],
    stages: [
      {
        level: 1,
        name: 'Launch Rover',
        emoji: '🛰️',
        minStreak: 0,
        description: 'A cute lunar rover scanning terrain under a starry horizon.',
        accentColor: '#38BDF8',
        badge: 'Stage 1 • Rover',
      },
      {
        level: 2,
        name: 'Orbital Rocket',
        emoji: '🚀',
        minStreak: 3,
        description: 'A sleek rocket accelerating through clouds with bright thrusters.',
        accentColor: '#0EA5E9',
        badge: 'Stage 2 • Rocket',
      },
      {
        level: 3,
        name: 'Space Station',
        emoji: '🛰️',
        minStreak: 7,
        description: 'An orbital laboratory with revolving solar wings in planetary orbit.',
        accentColor: '#6366F1',
        badge: 'Stage 3 • Station',
      },
      {
        level: 4,
        name: 'Star Cruiser',
        emoji: '🛸',
        minStreak: 14,
        description: 'An interstellar cruiser engaging warp drive through asteroid fields.',
        accentColor: '#818CF8',
        badge: 'Stage 4 • Cruiser',
      },
      {
        level: 5,
        name: 'Nebula Explorer',
        emoji: '🌌',
        minStreak: 21,
        description: 'A deep-space vessel drifting inside luminous multicolored cosmic dust.',
        accentColor: '#C084FC',
        badge: 'Stage 5 • Nebula',
      },
      {
        level: 6,
        name: 'Galactic Core',
        emoji: '🪐',
        minStreak: 30,
        description: 'A breathtaking spiral galaxy core surrounded by orbiting exoplanets!',
        accentColor: '#F43F5E',
        badge: 'Stage 6 • Galactic Core',
      },
    ],
  },
  {
    id: 'gemstone',
    name: 'Sacred Crystals',
    emoji: '💎',
    tagline: 'Polish raw minerals into priceless radiant artifacts',
    requiredStreak: 120,
    monthNumber: 5,
    primaryColor: '#EC4899',
    bgColor: '#1C0B16',
    lightBgColor: '#FDF2F8',
    bgGradient: ['#2E1023', '#12040D'],
    stages: [
      {
        level: 1,
        name: 'Rough Geode',
        emoji: '🪨',
        minStreak: 0,
        description: 'A natural rugged stone with a faint glowing crystal fracture.',
        accentColor: '#A8A29E',
        badge: 'Stage 1 • Geode',
      },
      {
        level: 2,
        name: 'Polished Quartz',
        emoji: '🔮',
        minStreak: 3,
        description: 'A translucent quartz stone radiating a gentle calming glow.',
        accentColor: '#E879F9',
        badge: 'Stage 2 • Quartz',
      },
      {
        level: 3,
        name: 'Radiant Emerald',
        emoji: '💚',
        minStreak: 7,
        description: 'A finely cut emerald reflecting shimmering geometric facets.',
        accentColor: '#10B981',
        badge: 'Stage 3 • Emerald',
      },
      {
        level: 4,
        name: 'Amethyst Shards',
        emoji: '💜',
        minStreak: 14,
        description: 'A multi-cluster formation with levitating orbiting crystal shards.',
        accentColor: '#A855F7',
        badge: 'Stage 4 • Amethyst',
      },
      {
        level: 5,
        name: 'Diamond Prism',
        emoji: '💎',
        minStreak: 21,
        description: 'A flawless diamond casting brilliant rainbow caustic light beams.',
        accentColor: '#38BDF8',
        badge: 'Stage 5 • Prism',
      },
      {
        level: 6,
        name: 'Infinity Core',
        emoji: '💠',
        minStreak: 30,
        description: 'A mystical spinning relic encased in golden gyroscopic orbital rings!',
        accentColor: '#FACC15',
        badge: 'Stage 6 • Infinity Core',
      },
    ],
  },
  {
    id: 'kingdom',
    name: 'Kingdom Empire',
    emoji: '🏰',
    tagline: 'Lay stones every day to construct a legendary civilization',
    requiredStreak: 150,
    monthNumber: 6,
    primaryColor: '#F59E0B',
    bgColor: '#1C1304',
    lightBgColor: '#FEFCE8',
    bgGradient: ['#2C1E07', '#120B02'],
    stages: [
      {
        level: 1,
        name: 'Campfire Tent',
        emoji: '⛺',
        minStreak: 0,
        description: 'A cozy canvas tent with a crackling campfire under clear stars.',
        accentColor: '#F59E0B',
        badge: 'Stage 1 • Camp',
      },
      {
        level: 2,
        name: 'Stone Cottage',
        emoji: '🏡',
        minStreak: 3,
        description: 'A charming stone cottage with smoking brick chimney and warm windows.',
        accentColor: '#84CC16',
        badge: 'Stage 2 • Cottage',
      },
      {
        level: 3,
        name: 'Guard Watchtower',
        emoji: '🗼',
        minStreak: 7,
        description: 'A fortified stone tower flying colored heraldry banners.',
        accentColor: '#06B6D4',
        badge: 'Stage 3 • Watchtower',
      },
      {
        level: 4,
        name: 'Fortified Keep',
        emoji: '🛡️',
        minStreak: 14,
        description: 'A castle keep with stone battlements, wooden gate, and moat.',
        accentColor: '#6366F1',
        badge: 'Stage 4 • Keep',
      },
      {
        level: 5,
        name: 'Royal Citadel',
        emoji: '🏰',
        minStreak: 21,
        description: 'A grand spired palace with glowing stained glass and courtyard.',
        accentColor: '#EC4899',
        badge: 'Stage 5 • Citadel',
      },
      {
        level: 6,
        name: 'Sky Metropolis',
        emoji: '👑',
        minStreak: 30,
        description: 'A mythical floating cloud city with waterfalls and golden spires!',
        accentColor: '#EAB308',
        badge: 'Stage 6 • Metropolis',
      },
    ],
  },
];

/**
 * Get active realm and relative stage based on current streak
 */
export function getActiveRealmProgress(overallStreak: number) {
  // Each realm covers 30 days
  const realmIndex = Math.min(
    Math.floor(overallStreak / 30),
    STREAK_REALMS.length - 1
  );
  const activeRealm = STREAK_REALMS[realmIndex];

  // Relative streak within the current 30-day month (0-30)
  const relativeStreak = overallStreak % 30;

  // Determine stage within this realm
  let activeStageIndex = 0;
  for (let i = activeRealm.stages.length - 1; i >= 0; i--) {
    if (relativeStreak >= activeRealm.stages[i].minStreak) {
      activeStageIndex = i;
      break;
    }
  }

  const stage = activeRealm.stages[activeStageIndex];
  const nextStage =
    activeStageIndex < activeRealm.stages.length - 1
      ? activeRealm.stages[activeStageIndex + 1]
      : null;
  const daysToNextStage = nextStage ? Math.max(0, nextStage.minStreak - relativeStreak) : 0;

  return {
    activeRealm,
    relativeStreak,
    stage,
    nextStage,
    daysToNextStage,
    realmIndex,
  };
}
