/**
 * Zen Quote Footer Component
 * Displays a bottom quote with fade-in animation
 * Used in Japanese theme for blocked page
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { ZenQuote } from '../../../shared/japanese-zen'

interface ZenQuoteFooterProps {
  quote: ZenQuote
  language: 'en' | 'ru'
}

export const ZenQuoteFooter: React.FC<ZenQuoteFooterProps> = ({ quote, language }) => {
  const text = language === 'ru' ? quote.textRu : quote.text

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ duration: 2, delay: 2, ease: "easeOut" }}
      className="text-center mt-12 px-4"
    >
      <p
        className="font-serif italic text-sumi-gray text-sm md:text-base leading-relaxed"
        data-zen
      >
        "{text}"
        {quote.author && (
          <span className="block mt-2 text-xs md:text-sm not-italic opacity-80">
            — {quote.author}
          </span>
        )}
      </p>
    </motion.div>
  )
}
