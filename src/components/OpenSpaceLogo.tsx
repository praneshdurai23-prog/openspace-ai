import React from 'react';

export interface OpenSpaceLogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'full' | 'compact' | 'sidebar' | 'favicon' | 'app-icon' | 'loading';
  animated?: boolean;
  showTagline?: boolean;
}

/**
 * OpenSpaceSymbol:
 * Completely original geometric symbol representing "Open Space + Intelligence".
 * Features an abstract open geometric frame (open square with 4 cardinal gateways)
 * framing an illuminated central intelligent core with subtle convergent conduits.
 */
export const OpenSpaceSymbol: React.FC<{
  size?: number;
  className?: string;
  animated?: boolean;
}> = ({ size = 32, className = '', animated = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="OpenSpace AI Symbol"
    >
      <defs>
        {/* Subtle Violet -> Purple -> Cyan Gradient for Open Frame */}
        <linearGradient id="openSpaceGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Central Intelligent Core Radiant Glow */}
        <radialGradient id="openSpaceCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#7C3AED" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>

        {/* Soft Glow Filter for Core Node */}
        <filter id="coreNodeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Negative Space Halo */}
      <circle
        cx="32"
        cy="32"
        r="13"
        fill="url(#openSpaceCoreGlow)"
        opacity={animated ? '0.45' : '0.22'}
        className={animated ? 'animate-pulse' : ''}
      />

      {/* 
        THE OPEN FRAME (4 Cardinal Portals):
        Four refined geometric corner brackets defining the boundary of "Open Space".
      */}
      {/* Top-Left Bracket */}
      <path
        d="M 15 25 L 15 18 C 15 16.34 16.34 15 18 15 L 25 15"
        stroke="url(#openSpaceGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-Right Bracket */}
      <path
        d="M 39 15 L 46 15 C 47.66 15 49 16.34 49 18 L 49 25"
        stroke="url(#openSpaceGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom-Right Bracket */}
      <path
        d="M 49 39 L 49 46 C 49 47.66 47.66 49 46 49 L 39 49"
        stroke="url(#openSpaceGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom-Left Bracket */}
      <path
        d="M 25 49 L 18 49 C 16.34 49 15 47.66 15 46 L 15 39"
        stroke="url(#openSpaceGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 
        CONVERGENT GEOMETRIC RETICLES:
        Micro-conduits pointing diagonally inward from the corner brackets toward the intelligent core
      */}
      <line x1="21" y1="21" x2="25" y2="25" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <line x1="43" y1="21" x2="39" y2="25" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <line x1="43" y1="43" x2="39" y2="39" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <line x1="21" y1="43" x2="25" y2="39" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />

      {/* 
        CENTRAL FLOATING INTELLIGENT CORE:
        Clean rotated geometric diamond floating in the open space center
      */}
      <polygon
        points="32,24.5 39.5,32 32,39.5 24.5,32"
        fill="#101321"
        stroke="url(#openSpaceGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Central Intelligent Nucleus Node */}
      <circle
        cx="32"
        cy="32"
        r="3.2"
        fill="#06B6D4"
        stroke="#F5F7FF"
        strokeWidth="1.2"
        filter="url(#coreNodeGlow)"
        className={animated ? 'animate-pulse' : ''}
      />

      {/* 4 Cardinal Anchor Points (Subtle dots symbolizing infinite expansion) */}
      <circle cx="32" cy="15" r="1.4" fill="#A855F7" opacity="0.8" />
      <circle cx="49" cy="32" r="1.4" fill="#06B6D4" opacity="0.8" />
      <circle cx="32" cy="49" r="1.4" fill="#06B6D4" opacity="0.8" />
      <circle cx="15" cy="32" r="1.4" fill="#7C3AED" opacity="0.8" />
    </svg>
  );
};

export const OpenSpaceLogo: React.FC<OpenSpaceLogoProps> = ({
  size = 32,
  className = '',
  variant = 'full',
  animated = false,
  showTagline = true,
}) => {
  const numericSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 24
      : size === 'lg'
      ? 48
      : 32;

  // 1. Compact: Symbol only
  if (variant === 'compact' || variant === 'favicon') {
    return <OpenSpaceSymbol size={numericSize} className={className} animated={animated} />;
  }

  // 2. Loading State: Symbol with subtle pulsing ring and intelligent glow
  if (variant === 'loading') {
    const boxSize = Math.max(numericSize, 48);
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/20 to-[#06B6D4]/20 animate-ping opacity-25" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101321] border border-[#1E2337] shadow-lg shadow-[#7C3AED]/15">
            <OpenSpaceSymbol size={32} animated={true} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-[#9CA3AF]">
          <span>Loading OpenSpace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" />
        </div>
      </div>
    );
  }

  // 3. Mobile App Icon: Stylized rounded square with OpenSpace Symbol
  if (variant === 'app-icon') {
    const boxSize = Math.max(numericSize, 44);
    const innerSymbolSize = Math.round(boxSize * 0.65);
    return (
      <div
        style={{ width: boxSize, height: boxSize }}
        className={`relative flex items-center justify-center rounded-2xl bg-[#080A12] border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/20 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/15 via-transparent to-[#06B6D4]/15 pointer-events-none" />
        <OpenSpaceSymbol size={innerSymbolSize} animated={animated} />
      </div>
    );
  }

  // 4. Sidebar Logo: Symbol + Wordmark ("OpenSpace" + "AI" badge/gradient) + "Your Space"
  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#101321] border border-[#1E2337] shadow-xs shadow-[#7C3AED]/15 hover:border-[#7C3AED]/50 transition-colors">
          <OpenSpaceSymbol size={22} animated={animated} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center text-sm font-extrabold tracking-tight leading-none font-sans">
            <span className="text-slate-900 dark:text-[#F5F7FF]">OpenSpace</span>
            <span className="bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent ml-1 font-black">
              AI
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-[#9CA3AF] tracking-wider mt-1 leading-none">
            Your Space
          </p>
        </div>
      </div>
    );
  }

  // 5. Full Logo: OpenSpace Symbol + Wordmark + Tagline + Creator attribution
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#101321] border border-[#1E2337] shadow-xl shadow-[#7C3AED]/20 ring-1 ring-[#7C3AED]/30 mb-3 group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 via-transparent to-[#06B6D4]/15 pointer-events-none" />
        <OpenSpaceSymbol size={36} animated={animated} />
      </div>

      <div className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
        <span className="text-slate-900 dark:text-[#F5F7FF]">OpenSpace</span>
        <span className="bg-gradient-to-r from-[#A855F7] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent ml-1.5 font-black">
          AI
        </span>
      </div>

      {showTagline && (
        <div className="mt-1.5">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-[#9CA3AF] tracking-wide">
            Your AI. Your Space.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Created by Pranesh
          </p>
        </div>
      )}
    </div>
  );
};

// Aliases for seamless migration
export const MyAILogo = OpenSpaceLogo;
export const NeuralCoreMSymbol = OpenSpaceSymbol;
