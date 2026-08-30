import React from 'react';
import { motion } from 'motion/react';

interface PlantIllustrationProps {
  level: number; // 1 to 6
  hydrationPercent: number; // 0 to 100
  isWateredToday: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  level,
  hydrationPercent,
  isWateredToday,
  size = 'md',
}) => {
  const isHealthy = hydrationPercent > 0 || isWateredToday;
  const isFullyWatered = isWateredToday || hydrationPercent >= 100;

  // Viewbox dimensions
  const vbWidth = 200;
  const vbHeight = 220;

  // Scaled dimensions
  const svgClass =
    size === 'sm'
      ? 'w-14 h-14'
      : size === 'lg'
      ? 'w-44 h-44 sm:w-52 sm:h-52'
      : 'w-24 h-24 sm:w-28 sm:h-28';

  // Dynamic growth parameters based on stage level (1 to 6)
  // Level 1: Tiny Sprout (sprout height 25px, 2 tiny seed leaves)
  // Level 2: Seedling (stem height 50px, 4 leaves)
  // Level 3: Potted Bloom (stem height 75px, multiple branches, lush leaves)
  // Level 4: Flowering Flora (tall stem, big blossoms with opening petals)
  // Level 5: Master Bonsai (thick curved trunk, layered canopy)
  // Level 6: Golden Orchard Tree (grand tree, lush canopy + shining golden apples)

  // Leaf spring animations
  const leafWind = {
    rotate: isWateredToday ? [-3, 3, -3] : [-1.5, 1.5, -1.5],
    transition: {
      repeat: Infinity,
      duration: isWateredToday ? 2.5 : 4.5,
      ease: 'easeInOut' as const,
    },
  };

  // Water droplets flowing animation when watered
  return (
    <div className={`relative flex items-center justify-center ${svgClass} select-none`}>
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="w-full h-full drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pot Gradients */}
          <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isFullyWatered ? '#382210' : '#451a03'} />
            <stop offset="100%" stopColor={isFullyWatered ? '#1c1108' : '#291102'} />
          </linearGradient>

          {/* Stem & Leaf Gradients */}
          <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>

          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>

          <linearGradient id="goldAppleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>

        {/* --- 1. BASE POT & SOIL --- */}
        <g id="pot-group">
          {/* Ground shadow */}
          <ellipse cx="100" cy="208" rx="55" ry="8" fill="#000000" fillOpacity="0.35" />

          {/* Terracotta Plant Pot */}
          <path
            d="M 65 160 L 74 200 C 75 204 78 206 82 206 L 118 206 C 122 206 125 204 126 200 L 135 160 Z"
            fill="url(#potGrad)"
            stroke="#92400e"
            strokeWidth="1.5"
          />

          {/* Pot Rim */}
          <rect
            x="60"
            y="152"
            width="80"
            height="10"
            rx="4"
            fill="url(#potGrad)"
            stroke="#92400e"
            strokeWidth="1.5"
          />

          {/* Soil Bed */}
          <ellipse cx="100" cy="155" rx="34" ry="4.5" fill="url(#soilGrad)" />

          {/* Soil moist sparkle when watered */}
          {isFullyWatered && (
            <>
              <circle cx="85" cy="155" r="1" fill="#38bdf8" />
              <circle cx="115" cy="156" r="1.2" fill="#38bdf8" />
              <circle cx="100" cy="154" r="0.8" fill="#bae6fd" />
            </>
          )}
        </g>

        {/* --- 2. DYNAMIC GROWTH STAGES --- */}

        {/* ================= STAGE 1: LITTLE SPROUT (🌱 Level 1) ================= */}
        {level === 1 && (
          <motion.g
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            id="stage-sprout"
          >
            {/* Sprout Stem */}
            <motion.path
              d="M 100 155 Q 98 135 100 120"
              stroke="url(#stemGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              animate={leafWind}
              style={{ originX: '100px', originY: '155px' }}
            />

            {/* Left Baby Leaf */}
            <motion.path
              d="M 100 120 C 85 116 80 128 100 132 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ originX: '100px', originY: '120px' }}
            />

            {/* Right Baby Leaf */}
            <motion.path
              d="M 100 120 C 115 116 120 128 100 132 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [4, -4, 4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ originX: '100px', originY: '120px' }}
            />

            {/* Little sprout dew drop */}
            {isFullyWatered && (
              <motion.circle
                cx="100"
                cy="116"
                r="3"
                fill="#38bdf8"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </motion.g>
        )}

        {/* ================= STAGE 2: GROWING SEEDLING (🌿 Level 2) ================= */}
        {level === 2 && (
          <motion.g
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            id="stage-seedling"
          >
            {/* Taller curvy stem */}
            <motion.path
              d="M 100 155 Q 94 130 102 105 Q 104 90 100 82"
              stroke="url(#stemGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              animate={leafWind}
              style={{ originX: '100px', originY: '155px' }}
            />

            {/* Lower Left Leaf */}
            <motion.path
              d="M 98 130 C 72 125 70 144 98 140 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [-5, 3, -5] }}
              transition={{ repeat: Infinity, duration: 3.2 }}
              style={{ originX: '98px', originY: '135px' }}
            />

            {/* Lower Right Leaf */}
            <motion.path
              d="M 101 122 C 126 116 130 134 101 132 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [5, -3, 5] }}
              transition={{ repeat: Infinity, duration: 3.2 }}
              style={{ originX: '101px', originY: '127px' }}
            />

            {/* Top Leaf Left */}
            <motion.path
              d="M 100 86 C 80 75 75 92 100 95 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [-6, 2, -6] }}
              transition={{ repeat: Infinity, duration: 2.8 }}
              style={{ originX: '100px', originY: '90px' }}
            />

            {/* Top Leaf Right */}
            <motion.path
              d="M 100 86 C 120 75 125 92 100 95 Z"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={{ rotate: [6, -2, 6] }}
              transition={{ repeat: Infinity, duration: 2.8 }}
              style={{ originX: '100px', originY: '90px' }}
            />

            {/* Crown sproutlet */}
            <circle cx="100" cy="80" r="3.5" fill="#86efac" />
          </motion.g>
        )}

        {/* ================= STAGE 3: BUDDING BLOSSOM (🪴 Level 3) ================= */}
        {level === 3 && (
          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            id="stage-potted-bloom"
          >
            {/* Main Bushy Stem */}
            <path
              d="M 100 155 Q 92 125 100 80"
              stroke="url(#stemGrad)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Side branch left */}
            <path
              d="M 98 125 Q 80 110 70 100"
              stroke="url(#stemGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Side branch right */}
            <path
              d="M 99 115 Q 115 100 130 92"
              stroke="url(#stemGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Dense Lush Leaves */}
            {/* Left Cluster */}
            <motion.ellipse
              cx="65"
              cy="95"
              rx="18"
              ry="10"
              transform="rotate(-25 65 95)"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={leafWind}
            />
            {/* Right Cluster */}
            <motion.ellipse
              cx="135"
              cy="88"
              rx="18"
              ry="10"
              transform="rotate(25 135 88)"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
              animate={leafWind}
            />
            {/* Center Mid Leaves */}
            <ellipse
              cx="85"
              cy="120"
              rx="16"
              ry="9"
              transform="rotate(-35 85 120)"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
            />
            <ellipse
              cx="115"
              cy="122"
              rx="16"
              ry="9"
              transform="rotate(35 115 122)"
              fill="url(#leafGrad)"
              stroke="#15803d"
              strokeWidth="1"
            />

            {/* Top Flower Bud preparing to open */}
            <motion.g
              animate={{ scale: isFullyWatered ? [1, 1.15, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ellipse cx="100" cy="72" rx="10" ry="14" fill="url(#flowerGrad)" />
              <ellipse cx="96" cy="74" rx="6" ry="12" fill="#f43f5e" opacity="0.6" />
              <ellipse cx="104" cy="74" rx="6" ry="12" fill="#fb7185" opacity="0.8" />
              <circle cx="100" cy="65" r="3" fill="#fef08a" />
            </motion.g>
          </motion.g>
        )}

        {/* ================= STAGE 4: FLORA IN BLOOM (🌸 Level 4) ================= */}
        {level === 4 && (
          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            id="stage-flowering"
          >
            {/* Tall Elegant Stem */}
            <path
              d="M 100 155 Q 94 110 100 70"
              stroke="url(#stemGrad)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 98 120 Q 75 105 60 90"
              stroke="url(#stemGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 99 105 Q 120 90 140 75"
              stroke="url(#stemGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Lush Foliage Leaves */}
            <ellipse cx="62" cy="115" rx="20" ry="11" transform="rotate(-30 62 115)" fill="url(#leafGrad)" />
            <ellipse cx="138" cy="112" rx="20" ry="11" transform="rotate(30 138 112)" fill="url(#leafGrad)" />
            <ellipse cx="80" cy="85" rx="18" ry="10" transform="rotate(-15 80 85)" fill="url(#leafGrad)" />

            {/* Left Blossom */}
            <g transform="translate(60, 85)">
              <circle cx="-6" cy="0" r="7" fill="url(#flowerGrad)" />
              <circle cx="6" cy="0" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="-6" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="6" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="0" r="4.5" fill="#fef08a" />
            </g>

            {/* Right Blossom */}
            <g transform="translate(140, 72)">
              <circle cx="-6" cy="0" r="7" fill="url(#flowerGrad)" />
              <circle cx="6" cy="0" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="-6" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="6" r="7" fill="url(#flowerGrad)" />
              <circle cx="0" cy="0" r="4.5" fill="#fef08a" />
            </g>

            {/* Main Magnificent Crown Flower */}
            <motion.g
              transform="translate(100, 60)"
              animate={{ rotate: [-2, 2, -2], scale: isFullyWatered ? [1, 1.08, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 3.5 }}
            >
              <circle cx="-11" cy="0" r="11" fill="url(#flowerGrad)" />
              <circle cx="11" cy="0" r="11" fill="url(#flowerGrad)" />
              <circle cx="0" cy="-11" r="11" fill="url(#flowerGrad)" />
              <circle cx="0" cy="11" r="11" fill="url(#flowerGrad)" />
              <circle cx="-8" cy="-8" r="9" fill="#f43f5e" opacity="0.85" />
              <circle cx="8" cy="-8" r="9" fill="#f43f5e" opacity="0.85" />
              <circle cx="-8" cy="8" r="9" fill="#f43f5e" opacity="0.85" />
              <circle cx="8" cy="8" r="9" fill="#f43f5e" opacity="0.85" />
              {/* Core Golden Center */}
              <circle cx="0" cy="0" r="7" fill="#facc15" stroke="#eab308" strokeWidth="1" />
              <circle cx="0" cy="0" r="3" fill="#fef08a" />
            </motion.g>
          </motion.g>
        )}

        {/* ================= STAGE 5: ZEN BONSAI TREE (🌳 Level 5) ================= */}
        {level === 5 && (
          <motion.g
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            id="stage-bonsai"
          >
            {/* Thick sculpted Bonsai Trunk with natural curves */}
            <path
              d="M 94 155 C 90 135 115 125 110 95 C 108 80 95 70 96 55"
              stroke="url(#trunkGrad)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Left limb */}
            <path
              d="M 102 125 C 80 115 65 110 52 100"
              stroke="url(#trunkGrad)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Right limb */}
            <path
              d="M 108 95 C 130 90 145 80 152 70"
              stroke="url(#trunkGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Bonsai Cloud Foliage Cluster 1 (Left) */}
            <motion.g animate={leafWind} style={{ originX: '50px', originY: '100px' }}>
              <ellipse cx="50" cy="98" rx="22" ry="14" fill="url(#leafGrad)" />
              <ellipse cx="40" cy="95" rx="14" ry="10" fill="#15803d" opacity="0.7" />
              <ellipse cx="58" cy="94" rx="16" ry="11" fill="#4ade80" opacity="0.9" />
            </motion.g>

            {/* Bonsai Cloud Foliage Cluster 2 (Right) */}
            <motion.g animate={leafWind} style={{ originX: '150px', originY: '70px' }}>
              <ellipse cx="150" cy="68" rx="24" ry="15" fill="url(#leafGrad)" />
              <ellipse cx="140" cy="65" rx="16" ry="11" fill="#15803d" opacity="0.7" />
              <ellipse cx="158" cy="64" rx="17" ry="12" fill="#4ade80" opacity="0.9" />
            </motion.g>

            {/* Bonsai Cloud Foliage Cluster 3 (Top Master Canopy) */}
            <motion.g animate={leafWind} style={{ originX: '96px', originY: '50px' }}>
              <ellipse cx="96" cy="48" rx="36" ry="20" fill="url(#leafGrad)" />
              <ellipse cx="80" cy="45" rx="22" ry="14" fill="#15803d" opacity="0.7" />
              <ellipse cx="112" cy="44" rx="24" ry="15" fill="#4ade80" opacity="0.9" />
              <ellipse cx="96" cy="38" rx="26" ry="14" fill="#86efac" opacity="0.8" />
            </motion.g>

            {/* Zen Stone decoration in pot */}
            <ellipse cx="80" cy="154" rx="6" ry="3" fill="#64748b" />
            <ellipse cx="118" cy="155" rx="5" ry="2.5" fill="#94a3b8" />
          </motion.g>
        )}

        {/* ================= STAGE 6: GOLDEN ORCHARD TREE (🍎 Level 6) ================= */}
        {level === 6 && (
          <motion.g
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            id="stage-golden-orchard"
          >
            {/* Grand Ancient Majestic Trunk */}
            <path
              d="M 100 155 C 92 130 108 105 100 65"
              stroke="url(#trunkGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Spreading strong boughs */}
            <path
              d="M 98 115 C 68 100 50 85 40 70"
              stroke="url(#trunkGrad)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 102 105 C 132 90 150 78 160 62"
              stroke="url(#trunkGrad)"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Massive Enchanted Canopy */}
            <motion.g animate={leafWind} style={{ originX: '100px', originY: '60px' }}>
              {/* Lower Cloud Foliage */}
              <ellipse cx="45" cy="65" rx="28" ry="18" fill="url(#leafGrad)" />
              <ellipse cx="155" cy="58" rx="30" ry="20" fill="url(#leafGrad)" />
              <ellipse cx="75" cy="45" rx="32" ry="22" fill="#15803d" />
              <ellipse cx="125" cy="42" rx="34" ry="22" fill="#22c55e" />

              {/* Apex Golden Crown */}
              <ellipse cx="100" cy="32" rx="42" ry="25" fill="url(#leafGrad)" />
              <ellipse cx="100" cy="25" rx="34" ry="18" fill="#86efac" opacity="0.9" />
            </motion.g>

            {/* Shining Golden Fruit & Apples */}
            {/* Fruit 1 (Left) */}
            <motion.g
              animate={{ y: [-1, 2, -1], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              <circle cx="45" cy="72" r="8" fill="url(#goldAppleGrad)" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="43" cy="69" r="2.5" fill="#ffffff" opacity="0.8" />
              <path d="M 45 64 Q 47 61 45 59" stroke="#713f12" strokeWidth="1.5" />
            </motion.g>

            {/* Fruit 2 (Center) */}
            <motion.g
              animate={{ y: [2, -1, 2], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, delay: 0.4 }}
            >
              <circle cx="98" cy="48" r="9.5" fill="url(#goldAppleGrad)" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="95" cy="44" r="3" fill="#ffffff" opacity="0.8" />
              <path d="M 98 39 Q 101 36 98 33" stroke="#713f12" strokeWidth="1.5" />
            </motion.g>

            {/* Fruit 3 (Right) */}
            <motion.g
              animate={{ y: [-1.5, 1.5, -1.5], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
            >
              <circle cx="152" cy="66" r="8.5" fill="url(#goldAppleGrad)" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="149" cy="63" r="2.8" fill="#ffffff" opacity="0.8" />
              <path d="M 152 58 Q 155 55 152 52" stroke="#713f12" strokeWidth="1.5" />
            </motion.g>

            {/* Fruit 4 (Upper Right) */}
            <motion.g
              animate={{ y: [1, -2, 1], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.2 }}
            >
              <circle cx="120" cy="28" r="7.5" fill="url(#goldAppleGrad)" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="118" cy="26" r="2" fill="#ffffff" opacity="0.8" />
            </motion.g>
          </motion.g>
        )}

        {/* --- 3. ANIMATED WATERING CAN / RAIN DROPLETS PARTICLES --- */}
        {isFullyWatered && (
          <g id="water-particles">
            <motion.circle
              cx="75"
              cy="95"
              r="2.5"
              fill="#38bdf8"
              animate={{ y: [0, 60], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeIn' }}
            />
            <motion.circle
              cx="125"
              cy="80"
              r="2.8"
              fill="#38bdf8"
              animate={{ y: [0, 75], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, delay: 0.3, ease: 'easeIn' }}
            />
            <motion.circle
              cx="100"
              cy="70"
              r="2.2"
              fill="#bae6fd"
              animate={{ y: [0, 85], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 1.3, delay: 0.6, ease: 'easeIn' }}
            />
          </g>
        )}
      </svg>
    </div>
  );
};
