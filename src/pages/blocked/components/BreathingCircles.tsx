/**
 * Breathing Circles Component
 * Meditative breathing animation for Japanese Zen theme
 * Two concentric circles that expand/contract in a soothing rhythm
 */

import React from 'react'


interface BreathingCirclesProps {
  size?: number
}

export const BreathingCircles: React.FC<BreathingCirclesProps> = ({ size = 200 }) => {
  return (
    <div
      className="relative flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Sun Rays / Glow (The "Rising" effect) */}
      <div className="absolute inset-[-20%] rounded-full bg-gradient-to-br from-orange-400/20 to-transparent blur-2xl animate-breathing-rays" />

      {/* Outer Halo (Breathing) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-danger/40 to-orange-500/30 blur-xl animate-breathing-halo" />

      {/* The Sun (Nisshō) */}
      <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-danger to-[#a52622] shadow-[0_0_30px_rgba(199,62,58,0.4)] border border-white/10 animate-breathing-sun" />

      {/* Inner light reflection (Subtle depth) */}
      <div className="absolute top-[20%] right-[20%] w-[15%] h-[15%] rounded-full bg-white/20 blur-md animate-breathing-reflection" />
    </div>
  )
}
