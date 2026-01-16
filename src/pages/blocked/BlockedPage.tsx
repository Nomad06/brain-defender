import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { t, initI18n } from '../../shared/i18n'
import { useLanguage } from '../../shared/i18n/useLanguage'
import { messagingClient } from '../../shared/messaging/client'
import { useThemeContent } from '../../shared/themes/useThemeContent'
import { BreathingCircles } from './components/BreathingCircles'
import { ZenCard } from './components/ZenCard'
import { ZenQuoteFooter } from './components/ZenQuoteFooter'
import { getRandomZenPhrase, getRandomZenQuote } from '../../shared/japanese-zen'

const BlockedPage: React.FC = () => {
  // Use theme content hook for abstraction
  const { theme } = useThemeContent()

  // Use reactive language hook (updates when language changes in storage)
  const currentLanguage = useLanguage()

  // Japanese zen content
  const [zenPhrase] = useState(() => getRandomZenPhrase())
  const [zenQuote] = useState(() => getRandomZenQuote())

  useEffect(() => {
    // Initialize i18n
    initI18n()

    // Get blocked URL from query params
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url') || window.location.href
    let hostname = ''
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      hostname = url
    }

    // Record block in statistics
    if (hostname) {
      messagingClient.recordBlock(hostname).catch(err => {
        console.error('[Blocked] Failed to record block:', err)
      })
    }
  }, [])

  const handleCloseTab = () => {
    window.close()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-sumi-black overflow-x-hidden">
      {/* Main Block Content - Centered Zen Layout */}
      <div className="w-full max-w-4xl min-h-[80vh] flex flex-col items-center justify-center relative shoji-slide-enter shoji-slide-enter-active">
        <div className="w-full flex flex-col items-center justify-center text-center z-10">

          {/* Theme-aware Motivational Content */}
          <div className="mb-20">
            <BreathingCircles size={200} />
          </div>
          <ZenCard zenPhrase={zenPhrase} language={currentLanguage} />

          {/* Focusan Zen Quote Footer */}
          {theme?.metadata.id === 'focusan' && (
            <ZenQuoteFooter quote={zenQuote} language={currentLanguage} />
          )}
        </div>
      </div>

      {/* Zen Close Button - Minimalist style for Focusan theme */}
      <div className="w-full max-w-4xl mt-12 flex justify-center">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          onClick={handleCloseTab}
          className="px-10 py-4 border border-sumi-black/50 text-sumi-black text-base tracking-widest hover:bg-black/5 transition-colors font-serif"
        >
          {t('common.close')}
        </motion.button>
      </div>
    </div>
  )
}

export default BlockedPage
