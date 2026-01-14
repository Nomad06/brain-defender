/**
 * Zen Card Component
 * Displays Japanese kanji with meaning and contextual message
 * Used in Japanese theme for blocked page
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { ZenPhrase } from '../../../shared/japanese-zen'

interface ZenCardProps {
  zenPhrase: ZenPhrase
  language: 'en' | 'ru'
}

export const ZenCard: React.FC<ZenCardProps> = ({ zenPhrase, language }) => {
  const meaning = language === 'ru' ? zenPhrase.meaningRu : zenPhrase.meaning
  const message = language === 'ru' ? zenPhrase.messageRu : zenPhrase.message

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.5
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" as const }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center mb-8 relative z-10"
    >
      {/* Large Kanji Title */}
      <motion.h1
        variants={itemVariants}
        className="font-serif text-[clamp(3.5rem,10vw,5rem)] leading-none mb-2 text-sumi-black"
        data-zen
      >
        {zenPhrase.kanji}
      </motion.h1>

      {/* Romanji + Meaning Subtitle */}
      <motion.h2
        variants={itemVariants}
        className="text-lg md:text-xl uppercase tracking-[0.2em] text-sumi-gray mb-6 font-light"
      >
        {zenPhrase.romanji} — {meaning}
      </motion.h2>

      {/* Contextual Message */}
      <motion.p
        variants={itemVariants}
        className="text-lg md:text-xl leading-relaxed text-sumi-black font-light max-w-2xl mx-auto whitespace-pre-line"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}
