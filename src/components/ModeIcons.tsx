import React from 'react';
import { AIMode } from '../types.ts';

interface ModeIconProps {
  mode: AIMode;
  size?: number;
  className?: string;
  active?: boolean;
}

/**
 * Original minimal icons created specifically for OpenSpace AI's 5 workflow modes,
 * aligned with the violet (#7C3AED) & cyan (#06B6D4) design language.
 */

// 1. Normal Mode: Neural Core Matrix Node
export const NormalModeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Central intelligence node */}
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    {/* 4 Cardinal neural pathways with endpoint nodes */}
    <path d="M 12 3 L 12 8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M 12 15.2 L 12 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M 3 12 L 8.8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M 15.2 12 L 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="3" r="1.2" fill="currentColor" />
    <circle cx="12" cy="21" r="1.2" fill="currentColor" />
    <circle cx="3" cy="12" r="1.2" fill="currentColor" />
    <circle cx="21" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

// 2. Study Mode: Geometric Knowledge Prism
export const StudyModeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Upper pyramid prism facet */}
    <path
      d="M 12 3 L 21 8.5 L 12 14 L 3 8.5 Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Center core line */}
    <path d="M 12 14 L 12 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Lower structural support angles */}
    <path
      d="M 5 9.7 L 5 16 L 12 20.5 L 19 16 L 19 9.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="8.5" r="1.3" fill="currentColor" />
  </svg>
);

// 3. Coding Mode: Hexagonal Tech Code Node
export const CodingModeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Left bracket vector */}
    <path
      d="M 8 7 L 3.5 12 L 8 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right bracket vector */}
    <path
      d="M 16 7 L 20.5 12 L 16 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Tech diagonal forward slash */}
    <path
      d="M 14 5 L 10 19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// 4. Writing Mode: Cyber Stylus Vector
export const WritingModeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Sleek digital stylus tip & barrel */}
    <path
      d="M 18.5 3.5 L 20.5 5.5 L 8 18 L 3.5 20.5 L 6 16 Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Grip incision / sensor ring */}
    <path d="M 15 7 L 17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Digital ink trajectory */}
    <path
      d="M 10 21 C 14 21, 16 19, 21 19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 2"
      opacity="0.75"
    />
  </svg>
);

// 5. File Analysis Mode: Spectral Document Scanner Node
export const FileAnalysisModeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Document container outline */}
    <path
      d="M 5 4 C 5 3.4 5.4 3 6 3 L 14 3 L 19 8 L 19 20 C 19 20.6 18.6 21 18 21 L 6 21 C 5.4 21 5 20.6 5 20 Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Fold corner */}
    <path d="M 14 3 L 14 8 L 19 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Analysis scan line with radar node */}
    <path d="M 3 13 L 21 13" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="13" r="2" fill="#06B6D4" />
  </svg>
);

export const ModeIcon: React.FC<ModeIconProps> = ({
  mode,
  size = 18,
  className = '',
  active = false,
}) => {
  const iconClass = `${active ? 'text-[#06B6D4]' : 'currentColor'} ${className}`;

  switch (mode) {
    case 'study':
      return <StudyModeIcon size={size} className={iconClass} />;
    case 'coding':
      return <CodingModeIcon size={size} className={iconClass} />;
    case 'writing':
      return <WritingModeIcon size={size} className={iconClass} />;
    case 'file_analysis':
      return <FileAnalysisModeIcon size={size} className={iconClass} />;
    case 'normal':
    default:
      return <NormalModeIcon size={size} className={iconClass} />;
  }
};
