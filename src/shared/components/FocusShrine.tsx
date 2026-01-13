/**
 * Focus Shrine Component for Focusan
 * Visual progress tracker showing growing bonsai tree
 * Growth based on focus sessions completed and sites blocked
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Stats } from '../domain/stats'

interface FocusShrineProps {
  stats: Stats | null
  width?: number
  height?: number
}

/**
 * Calculate bonsai growth level (0-100)
 * Based on total blocks only (focus sessions tracked separately)
 */
function calculateGrowthLevel(stats: Stats | null): number {
  if (!stats) return 0

  const totalBlocks = stats.totalBlocks || 0

  // Growth formula: each block = 0.2 points
  // 500 blocks = 100% growth (fully mature bonsai)
  const growthPoints = totalBlocks * 0.2

  // Cap at 100
  return Math.min(100, growthPoints)
}

/**
 * Get growth stage based on level
 */
function getGrowthStage(level: number): {
  stage: number
  name: string
  description: string
} {
  if (level < 10) {
    return { stage: 0, name: 'Seed', description: 'Your journey begins' }
  } else if (level < 25) {
    return { stage: 1, name: 'Sprout', description: 'First signs of growth' }
  } else if (level < 50) {
    return { stage: 2, name: 'Sapling', description: 'Growing stronger' }
  } else if (level < 75) {
    return { stage: 3, name: 'Young Tree', description: 'Steady progress' }
  } else if (level < 100) {
    return { stage: 4, name: 'Mature Bonsai', description: 'Almost complete' }
  } else {
    return { stage: 5, name: 'Master Bonsai', description: 'Perfect balance achieved' }
  }
}

const FocusShrine: React.FC<FocusShrineProps> = ({ stats, width = 300, height = 400 }) => {
  const [growthLevel, setGrowthLevel] = useState(0)
  const [growthStage, setGrowthStage] = useState(getGrowthStage(0))

  useEffect(() => {
    const level = calculateGrowthLevel(stats)
    setGrowthLevel(level)
    setGrowthStage(getGrowthStage(level))
  }, [stats])

  // Calculate visual elements based on growth
  const branchCount = Math.floor((growthLevel / 100) * 8) + 2 // 2 to 10 branches
  const leafDensity = growthLevel / 100 // 0 to 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-lg border-2 border-border shadow-zen-lg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'linear-gradient(180deg, var(--washi-white) 0%, var(--kinari-cream) 100%)',
      }}
    >
      {/* Background elements */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-b from-transparent to-[#c8b8a0]"
        style={{
          borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
        }}
      />

      {/* Shrine platform */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[80%] h-2 bg-sumi-gray rounded-sm" />

      {/* Bonsai pot */}
      <div className="absolute bottom-[calc(10%+8px)] left-1/2 -translate-x-1/2 w-[100px] h-[40px] rounded-b-lg border-2 border-[#5a4428] bg-gradient-to-b from-[#8b6f47] to-[#6b5435]" />

      {/* Bonsai tree SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute top-0 left-0"
      >
        {/* Trunk */}
        <motion.path
          d={`M ${width / 2} ${height * 0.5} Q ${width / 2 - 10} ${height * 0.65} ${width / 2} ${height * 0.75}`}
          fill="none"
          stroke="#4a3728"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Branches - drawn based on growth level */}
        {growthLevel > 10 && (
          <>
            {/* Left branch 1 */}
            <motion.path
              d={`M ${width / 2} ${height * 0.55} Q ${width / 2 - 30} ${height * 0.52} ${width / 2 - 45} ${height * 0.48}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: growthLevel > 15 ? 1 : 0.5 }}
              transition={{ duration: 1 }}
            />

            {/* Right branch 1 */}
            <motion.path
              d={`M ${width / 2} ${height * 0.58} Q ${width / 2 + 25} ${height * 0.55} ${width / 2 + 40} ${height * 0.52}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: growthLevel > 20 ? 1 : 0.5 }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </>
        )}

        {growthLevel > 30 && (
          <>
            {/* Left branch 2 */}
            <motion.path
              d={`M ${width / 2} ${height * 0.62} Q ${width / 2 - 20} ${height * 0.60} ${width / 2 - 35} ${height * 0.58}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />

            {/* Right branch 2 */}
            <motion.path
              d={`M ${width / 2} ${height * 0.65} Q ${width / 2 + 30} ${height * 0.63} ${width / 2 + 42} ${height * 0.60}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </>
        )}

        {/* Leaves - more appear as growth increases */}
        {growthLevel > 25 &&
          Array.from({ length: branchCount }).map((_, i) => {
            const angle = (i / branchCount) * Math.PI * 2
            const radius = 30 + (growthLevel / 100) * 20
            const x = width / 2 + Math.cos(angle) * radius
            const y = height * 0.45 + Math.sin(angle) * (radius * 0.6)
            const size = 8 + (growthLevel / 100) * 6

            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={size}
                fill="#6b8e23"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 + leafDensity * 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            )
          })}

        {/* Cherry blossoms for high growth */}
        {growthLevel > 60 &&
          [0, 1, 2, 3, 4].map(i => {
            const angle = (i / 5) * Math.PI * 2
            const radius = 35 + (growthLevel / 100) * 15
            const x = width / 2 + Math.cos(angle + Math.PI / 4) * radius
            const y = height * 0.42 + Math.sin(angle + Math.PI / 4) * (radius * 0.5)

            return (
              <motion.circle
                key={`blossom-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill="#ffb7c5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ duration: 0.6, delay: 1 + i * 0.1 }}
              />
            )
          })}
      </svg>

      {/* Growth info panel */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded border-2 border-gold shadow-zen text-center"
      >
        <div className="text-[11px] text-muted mb-1 font-mono">
          {growthStage.name}
        </div>
        <div className="text-xl font-bold text-accent font-serif">
          {Math.floor(growthLevel)}%
        </div>
        <div className="text-[10px] text-muted italic">
          {growthStage.description}
        </div>
      </motion.div>

      {/* Growth progress bar */}
      <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/30 rounded-full overflow-hidden border border-border">
        <motion.div
          className="h-full bg-gradient-to-r from-bamboo-green to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${growthLevel}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Milestone indicators */}
      <AnimatePresence>
        {growthLevel >= 100 && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FocusShrine
