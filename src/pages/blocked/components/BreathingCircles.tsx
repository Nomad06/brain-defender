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
      {/* Outer breathing circle (Sun Halo) */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/20 to-gold/10 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Inner breathing circle (Sun Core) */}
      <motion.div
        className="absolute inset-[25%] rounded-full bg-gradient-to-br from-accent/30 to-gold/20 backdrop-blur-sm border border-white/10 shadow-zen"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />

      {/* Core dot */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-gold/50 shadow-[0_0_10px_var(--gold)]"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
