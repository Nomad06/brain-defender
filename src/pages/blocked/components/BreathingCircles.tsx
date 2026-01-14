/**
 * Breathing Circles Component
 * Meditative breathing animation for Japanese Zen theme
 * Two concentric circles that expand/contract in a soothing rhythm
 */

import React from 'react'
import { motion } from 'framer-motion'

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
      <motion.div
        className="absolute inset-[-20%] rounded-full bg-gradient-to-br from-orange-400/20 to-transparent blur-2xl"
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Outer Halo (Breathing) */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-danger/40 to-orange-500/30 blur-xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* The Sun (Nisshō) */}
      <motion.div
        className="absolute inset-[15%] rounded-full bg-gradient-to-br from-danger to-[#a52622] shadow-[0_0_30px_rgba(199,62,58,0.4)] border border-white/10"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />

      {/* Inner light reflection (Subtle depth) */}
      <motion.div
        className="absolute top-[20%] right-[20%] w-[15%] h-[15%] rounded-full bg-white/20 blur-md"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
