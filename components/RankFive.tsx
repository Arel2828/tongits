"use client";

interface RankFiveProps {
  color?: string;
  className?: string;
}

/**
 * A custom pixel-perfect SVG for the number '5' to ensure it's clearly
 * distinguishable from '8' in the pixel UI.
 */
export default function RankFive({ color = "currentColor", className }: RankFiveProps) {
  return (
    <svg 
      viewBox="0 0 10 14" 
      className={`w-3 h-4 sm:w-4 sm:h-5 md:w-6 md:h-8 ${className || ""}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 5x7 Pixel Structure (each pixel is 2x2 units) */}
      
      {/* Top Bar */}
      <rect x="0" y="0" width="10" height="2" fill="currentColor" />
      
      {/* Top Left Pillar */}
      <rect x="0" y="2" width="2" height="4" fill="currentColor" />
      
      {/* Middle Bar */}
      <rect x="0" y="6" width="10" height="2" fill="currentColor" />
      
      {/* Bottom Right Pillar */}
      <rect x="8" y="8" width="2" height="4" fill="currentColor" />
      
      {/* Bottom Bar */}
      <rect x="0" y="12" width="10" height="2" fill="currentColor" />
    </svg>
  );
}
