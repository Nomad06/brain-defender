/**
 * Phrase Card Component
 * Displays simple motivational phrases for default theme
 */

import React from 'react'
import { motion } from 'framer-motion'

interface PhraseCardProps {
  phrase: string
}

export const PhraseCard: React.FC<PhraseCardProps> = ({ phrase }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/60 backdrop-blur-md border-2 border-accent p-8 mb-6 text-center rounded-xl shadow-zen max-w-lg mx-auto"
    >
      <div className="text-xl md:text-2xl font-semibold leading-relaxed text-sumi-black">
        {phrase}
      </div>
    </motion.div>
  )
}
