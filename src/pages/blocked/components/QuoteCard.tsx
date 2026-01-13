/**
 * Quote Card Component
 * Displays motivational quotes with appropriate styling
 */

import React from 'react'
import { motion } from 'framer-motion'

interface QuoteCardProps {
  quote: string
  icon?: string
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, icon = '⚔️' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="font-serif text-xl md:text-2xl font-medium tracking-wide leading-relaxed text-accent text-center py-6 px-8 relative max-w-2xl mx-auto"
    >
      <div className="text-3xl text-gold mb-2 drop-shadow-sm">{icon}</div>
      <span className="opacity-80">「</span>
      <span className="mx-2">{quote}</span>
      <span className="opacity-80">」</span>
    </motion.div>
  )
}
