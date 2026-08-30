import React from 'react';

interface HabitUpLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'badge' | 'icon' | 'wordmark' | 'banner';
  showSubtitle?: boolean;
}

/**
 * HabitUp Brand Logo Component
 * Compact, refined typography-driven brand lockup:
 * - Rounded bold "habit" in pure white
 * - Neon mint green "up" with iconic upward arrow ascending from 'u'
 * - Golden amber accent dot '.' fully visible with generous canvas buffer
 * - Elegant tracked "DAILY HABIT TRACKER" subtitle
 */
export const HabitUpLogo: React.FC<HabitUpLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  // Balanced size presets with proper aspect ratio to fit the full logo + dot + glow
  const sizeMap = {
    xs: {
      width: 105,
      height: 36,
    },
    sm: {
      width: 130,
      height: 45,
    },
    md: {
      width: 155,
      height: 54,
    },
    lg: {
      width: 195,
      height: 68,
    },
    xl: {
      width: 245,
      height: 85,
    },
    '2xl': {
      width: 300,
      height: 104,
    },
  };

  const { width, height } = sizeMap[size];
  const calculatedHeight = showSubtitle ? height : Math.round(height * 0.75);
  const viewBoxHeight = showSubtitle ? 200 : 160;

  return (
    <div className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}>
      <svg
        viewBox={`0 -8 575 ${viewBoxHeight}`}
        width={width}
        height={calculatedHeight}
        className="max-w-full h-auto overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="habitMintGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#00F298" floodOpacity="0.35" />
          </filter>
          <filter id="habitGoldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFB800" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Wordmark Container */}
        <g id="habitup-brand-mark">
          {/* ================= 'habit' (White) ================= */}
          {/* 'h' */}
          <g fill="#FFFFFF">
            <rect x="14" y="20" width="22" height="100" rx="11" />
            <path d="M 25 64 C 33 48 45 44 58 44 C 73 44 83 54 83 70 L 83 120 C 83 126 78 131 72 131 C 66 131 61 126 61 120 L 61 74 C 61 66 55 62 47 62 C 39 62 31 68 25 76 Z" />
          </g>

          {/* 'a' */}
          <g fill="#FFFFFF">
            <circle cx="124" cy="86" r="34" />
            <rect x="144" y="52" width="22" height="68" rx="11" />
            {/* Cutout hole for 'a' */}
            <circle cx="124" cy="86" r="14.5" fill="#080C16" />
          </g>

          {/* 'b' */}
          <g fill="#FFFFFF">
            <rect x="182" y="20" width="22" height="100" rx="11" />
            <circle cx="222" cy="86" r="34" />
            {/* Cutout hole for 'b' */}
            <circle cx="222" cy="86" r="14.5" fill="#080C16" />
          </g>

          {/* 'i' */}
          <g fill="#FFFFFF">
            <circle cx="272" cy="30" r="11" />
            <rect x="261" y="52" width="22" height="68" rx="11" />
          </g>

          {/* 't' */}
          <g fill="#FFFFFF">
            <rect x="310" y="30" width="22" height="90" rx="11" />
            <rect x="294" y="52" width="50" height="20" rx="10" />
          </g>

          {/* ================= 'up' (Neon Mint Green: #00F298) ================= */}
          <g fill="#00F298">
            {/* 'u' Left Stem */}
            <rect x="368" y="52" width="22" height="46" rx="11" />
            {/* 'u' Bottom Curve */}
            <path d="M 368 82 C 368 110 380 122 404 122 C 424 122 436 112 438 88 L 416 88 C 414 102 408 104 402 104 C 392 104 390 96 390 82 Z" />
            {/* 'u' Right Stem ascending */}
            <rect x="418" y="26" width="22" height="72" rx="11" />

            {/* Upward Arrow on 'u' */}
            <g filter="url(#habitMintGlow)">
              <path d="M 429 -2 L 462 36 C 465 40 462 45 456 45 L 402 45 C 396 45 393 40 396 36 Z" />
            </g>

            {/* 'p' Stem / Descender */}
            <rect x="456" y="52" width="22" height="94" rx="11" />
            {/* 'p' Bowl */}
            <circle cx="494" cy="86" r="34" />
            {/* Cutout hole for 'p' */}
            <circle cx="494" cy="86" r="14.5" fill="#080C16" />
          </g>

          {/* ================= Golden Amber Accent Dot '.' (Fully visible & unclipped) ================= */}
          <g filter="url(#habitGoldGlow)">
            <circle cx="542" cy="110" r="14" fill="#FFB800" />
          </g>
        </g>

        {/* ================= Subtitle: DAILY HABIT TRACKER ================= */}
        {showSubtitle && (
          <text
            x="14"
            y="176"
            fill="#8E9EB5"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="24"
            letterSpacing="8.5"
          >
            DAILY HABIT TRACKER
          </text>
        )}
      </svg>
    </div>
  );
};
