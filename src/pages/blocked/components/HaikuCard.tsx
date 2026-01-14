/**
 * Haiku Card Component
 * Displays a haiku poem with appropriate styling
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { Haiku } from '../../../shared/haiku'

interface HaikuCardProps {
  haiku: Haiku
  language: 'en' | 'ru'
}

export const HaikuCard: React.FC<HaikuCardProps> = ({ haiku, language }) => {
  // Use Russian translation if available and language is Russian
  const lines = (language === 'ru' && haiku.linesRu) ? haiku.linesRu : haiku.lines

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="washi-card border-2 border-border p-8 mb-6 text-center max-w-md mx-auto relative overflow-hidden"
    >
      {/* Decorative vertical line */}
      <div className="absolute left-6 top-6 bottom-6 w-[1px] bg-border/30" />

      <div className="font-serif italic text-lg leading-loose text-sumi-black tracking-wide pl-4">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className="mb-3 last:mb-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.5, duration: 1 }}
          >
            {line}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
