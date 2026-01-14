/**
 * Popup React App for Brain Defender
 * High-end Japanese Zen Redesign
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, initI18n } from '../shared/i18n'
import { SessionState, type FocusSession } from '../shared/domain/focus-sessions'
import { SettingsIcon, SamuraiShieldIcon } from '../shared/components/Icons'
import { playSound, SoundType } from '../shared/sound'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const // Fix explicit type
    }
  },
  exit: { opacity: 0 }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 }
  }
}

const breathingVariants = {
  inhale: { scale: 1.05, opacity: 0.9, transition: { duration: 4, ease: "easeInOut" as const } },
  exhale: { scale: 1, opacity: 0.7, transition: { duration: 4, ease: "easeInOut" as const } }
}

const App: React.FC = () => {
  const [sitesCount, setSitesCount] = useState<number>(0)
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentHost, setCurrentHost] = useState<string>('')
  const [breathState, setBreathState] = useState<'inhale' | 'exhale'>('inhale')

  // Detect current host
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0]
      if (tab?.url) {
        const host = normalizeHost(tab.url)
        if (host) setCurrentHost(host)
      }
    })
  }, [])

  // Breathing cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathState(prev => prev === 'inhale' ? 'exhale' : 'inhale')
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Load sites count
  const loadSitesCount = async () => {
    try {
      const sites = await messagingClient.getSites()
      setSitesCount(sites.length)
    } catch (err) {
      console.error('[Popup] Error loading sites count:', err)
      setSitesCount(0)
    }
  }

  // Load current focus session
  const loadFocusSession = async () => {
    try {
      const session = await messagingClient.getCurrentSession()
      if (session) {
        setCurrentSession(session)
        if (session.state === SessionState.WORKING || session.state === SessionState.BREAK) {
          const now = Date.now()
          const remaining = Math.max(0, Math.floor((session.endTime - now) / 1000))
          setRemainingTime(remaining)
        } else {
          setRemainingTime(0)
        }
      } else {
        setCurrentSession(null)
        setRemainingTime(0)
      }
    } catch (err) {
      console.error('[Popup] Error loading focus session:', err)
      setCurrentSession(null)
      setRemainingTime(0)
    }
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      await initI18n()
      await loadSitesCount()
      await loadFocusSession()
      setLoading(false)
    }
    init()
  }, [])

  // Timer for focus session
  useEffect(() => {
    if (!currentSession || currentSession.state === SessionState.IDLE || currentSession.state === SessionState.PAUSED) {
      return
    }

    const interval = setInterval(() => {
      loadFocusSession()
    }, 1000)

    return () => clearInterval(interval)
  }, [currentSession])

  // Add current site to block list
  const handleAddCurrentSite = async () => {
    try {
      playSound(SoundType.BAMBOO_STRIKE)
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]

      if (!tab?.url) return
      const host = normalizeHost(tab.url)
      if (!host) return

      const success = await messagingClient.addSite(host)
      if (success) {
        await loadSitesCount()
      }
    } catch (err) {
      console.error('[Popup] Error adding current site:', err)
    }
  }

  // Open options page
  const handleOpenOptions = () => {
    playSound(SoundType.KOTO_PLUCK)
    chrome.runtime.openOptionsPage()
  }

  // Start focus session
  const handleStartFocusSession = () => {
    playSound(SoundType.TEMPLE_BELL)
    setShowPomodoroModal(true)
  }

  // Pause focus session
  const handlePauseFocusSession = async () => {
    try {
      playSound(SoundType.SOFT_GONG)
      if (currentSession?.state === SessionState.PAUSED) {
        await messagingClient.resumeFocusSession()
      } else {
        await messagingClient.pauseFocusSession()
      }
      await loadFocusSession()
    } catch (err) {
      console.error('[Popup] Error pausing/resuming focus session:', err)
    }
  }

  // Stop focus session
  const handleStopFocusSession = async () => {
    playSound(SoundType.SOFT_GONG)
    try {
      await messagingClient.stopFocusSession()
      await loadFocusSession()
    } catch (err) {
      console.error('[Popup] Error stopping focus session:', err)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const isSessionActive = currentSession && currentSession.state !== SessionState.IDLE

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-washi transition-all duration-500">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <div className="text-2xl font-serif text-sumi-black tracking-widest">Focusan</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-[340px] min-h-[520px] bg-washi flex flex-col p-5 font-sans overflow-hidden relative">
      <AnimatePresence mode="wait">
        {showPomodoroModal ? (
          <PomodoroModal
            key="modal"
            onClose={() => setShowPomodoroModal(false)}
            onStart={async () => {
              await loadFocusSession()
              setShowPomodoroModal(false)
            }}
          />
        ) : (
          <motion.div
            key="main"
            className="flex flex-col flex-1 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.header
              className="flex justify-between items-center mb-8"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <img src="/zen-circle.png" alt="Focusan" className="w-8 h-8 drop-shadow-sm opacity-90 hover:opacity-100 transition-opacity" />
                <div className="flex flex-col">
                  <span className="font-serif text-lg text-sumi-black tracking-wide leading-none">Focusan</span>
                  <span className="text-[12px] font-serif tracking-[0.2em] text-accent mt-0.5">集中</span>
                </div>
              </div>
              <motion.button
                whileHover={{ rotate: 45, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleOpenOptions}
                className="text-sumi-gray hover:text-accent transition-colors p-2 rounded-full hover:bg-black/5"
              >
                <SettingsIcon />
              </motion.button>
            </motion.header>

            <main className="flex flex-col items-center gap-8 relative flex-1 justify-center">
              {/* Timer Circle with Breathing Effect */}
              <motion.div
                className="relative w-[220px] h-[220px] flex items-center justify-center"
                variants={itemVariants}
              >
                {/* Breathing Glow Background */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent/5 blur-2xl" // Increased blur for airier feel
                  variants={breathingVariants}
                  animate={breathState}
                />

                {/* SVG Ring */}
                <svg width="220" height="220" className="-rotate-90 drop-shadow-sm">
                  {/* Track - Thinner and more transparent */}
                  <circle cx="110" cy="110" r="95" stroke="rgba(46, 95, 111, 0.05)" strokeWidth="1" fill="transparent" />

                  {/* Progress - Thinner stroke */}
                  <motion.circle
                    cx="110" cy="110" r="95"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 95}
                    strokeLinecap="round"
                    animate={{
                      strokeDashoffset: isSessionActive && currentSession
                        ? (2 * Math.PI * 95) * (1 - (remainingTime / (currentSession.duration * 60)))
                        : (2 * Math.PI * 95)
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="drop-shadow-sm" // Reduced shadow intensity
                  />
                </svg>

                {/* Center Text - Scaled down for more air */}
                <div className="absolute flex flex-col items-center text-center z-10 transform scale-75">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    className="text-[10px] uppercase tracking-[0.3em] text-sumi-gray mb-2 font-serif"
                  >
                    Total Immersion
                  </motion.div>

                  <motion.span
                    className="font-mono text-[3.5rem] font-light text-sumi-black leading-none tracking-tighter tabular-nums"
                  >
                    {isSessionActive ? formatTime(remainingTime) : '25:00'}
                  </motion.span>

                  <motion.div
                    className="mt-3 flex flex-col items-center gap-1"
                    animate={{ opacity: isSessionActive ? 1 : 0.6 }}
                  >
                    <span className="text-xs font-serif text-sumi-gray uppercase tracking-[0.2em]">
                      {isSessionActive
                        ? (currentSession?.state === SessionState.PAUSED ? t('focusSession.paused') : t('focusSession.active'))
                        : t('focusSession.ready')}
                    </span>
                    {isSessionActive && (
                      <motion.div
                        className="w-1 h-1 rounded-full bg-accent"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Minimalist Controls */}
              <motion.div
                className="flex items-center gap-4 w-full justify-center px-4"
                variants={itemVariants}
              >
                {isSessionActive ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePauseFocusSession}
                      className="btn secondary flex-1 shadow-sm font-serif"
                    >
                      {currentSession?.state === SessionState.PAUSED ? 'Resume' : 'Pause'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStopFocusSession}
                      className="btn danger w-auto px-6 font-serif"
                    >
                      Stop
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartFocusSession}
                    className="btn primary w-full py-3.5 text-lg shadow-lantern tracking-wide font-serif"
                  >
                    Start Focus
                  </motion.button>
                )}
              </motion.div>
            </main>

            {/* Footer / Status Card */}
            <motion.div
              className="mt-8 washi-card p-4 border border-border flex justify-between items-center"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/5 text-accent border border-accent/20">
                  <SamuraiShieldIcon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-sumi-gray uppercase tracking-wider font-semibold">Protected</span>
                  <span className="text-sm font-semibold text-sumi-black font-mono">{sitesCount} Sites</span>
                </div>
              </div>

              {!isSessionActive && currentHost && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddCurrentSite}
                  className="px-3 py-1.5 bg-white border border-border rounded text-xs hover:border-accent hover:text-accent transition-colors flex items-center gap-1 shadow-sm font-medium text-sumi-gray"
                  title={`Block ${currentHost}`}
                >
                  <span className="font-bold text-lg leading-none mb-0.5">+</span> Block
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface PomodoroModalProps {
  onClose: () => void
  onStart: () => void
}

const PomodoroModal: React.FC<PomodoroModalProps> = ({ onClose, onStart }) => {
  const [sites, setSites] = useState<Array<{ host: string; addedAt: number }>>([])
  const [selectedMainSites, setSelectedMainSites] = useState<Set<string>>(new Set())
  const [additionalSites, setAdditionalSites] = useState<string[]>([])
  const [newSiteInput, setNewSiteInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [duration, setDuration] = useState<number>(25)

  // Load sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const sites = await messagingClient.getSites()
        setSites(sites)
      } catch (err) {
        console.error('[PomodoroModal] Error loading sites:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSites()
  }, [])

  // Add additional site
  const handleAddAdditionalSite = () => {
    playSound(SoundType.KOTO_PLUCK)
    const host = normalizeHost(newSiteInput)
    if (!host) {
      alert(t('errors.invalidDomain'))
      return
    }

    if (additionalSites.includes(host)) {
      alert(t('errors.siteAlreadyAdded'))
      return
    }

    setAdditionalSites([...additionalSites, host])
    setNewSiteInput('')
  }

  // Remove additional site
  const handleRemoveAdditionalSite = (host: string) => {
    playSound(SoundType.BAMBOO_STRIKE)
    setAdditionalSites(additionalSites.filter(s => s !== host))
  }

  // Toggle main site selection
  const handleToggleMainSite = (host: string) => {
    playSound(SoundType.KOTO_PLUCK)
    const newSet = new Set(selectedMainSites)
    if (newSet.has(host)) {
      newSet.delete(host)
    } else {
      newSet.add(host)
    }
    setSelectedMainSites(newSet)
  }

  // Start session with selected sites
  const handleStartSession = async () => {
    try {
      playSound(SoundType.TEMPLE_BELL)
      const sitesToBlock = [...Array.from(selectedMainSites), ...additionalSites]
      await messagingClient.startFocusSession(duration, sitesToBlock)
      onStart()
    } catch (err) {
      console.error('[PomodoroModal] Error starting session:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full gap-4 relative z-10"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-serif font-medium text-xl text-sumi-black">{t('focusSession.selectSites')}</h2>
        <button
          className="text-sumi-gray hover:text-sumi-black p-2 text-xl leading-none transition-transform hover:rotate-90"
          onClick={() => { playSound(SoundType.SOFT_GONG); onClose(); }}
        >
          ✕
        </button>
      </div>

      <p className="text-sumi-gray text-xs font-serif italic opacity-80">
        {t('focusSession.selectSitesHint')}
      </p>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-sumi-gray animate-pulse font-serif">{t('common.loading')}...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* Duration Input */}
          <div className="washi-card p-4 border border-border flex items-center gap-4 shadow-sm">
            <label className="font-medium text-sm flex-1 text-sumi-black font-serif">
              Duration (min)
            </label>
            <input
              type="number"
              className="w-20 text-center font-mono p-2 rounded border border-border bg-white focus:border-accent outline-none text-lg text-accent font-bold"
              value={duration}
              onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 25))}
              min="1"
              max="180"
            />
          </div>

          {/* Main sites list */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[10px] text-sumi-gray uppercase tracking-widest pl-1">
              {t('focusSession.mainSites')}
            </label>
            <div className="washi-card border border-border p-2 max-h-48 overflow-y-auto">
              {sites.length === 0 ? (
                <div className="text-sumi-gray text-center p-4 text-xs italic">
                  {t('focusSession.noSites')}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {sites.map(site => (
                    <label
                      key={site.host}
                      className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-black/5 transition-colors group"
                    >
                      <input
                        type="checkbox"
                        className="accent-accent w-4 h-4 cursor-pointer"
                        checked={selectedMainSites.has(site.host)}
                        onChange={() => handleToggleMainSite(site.host)}
                      />
                      <span className="font-mono flex-1 text-xs text-sumi-black group-hover:text-accent transition-colors">{site.host}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional sites */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[10px] text-sumi-gray uppercase tracking-widest pl-1">
              {t('focusSession.additionalSites')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 text-xs p-2.5 rounded border border-border bg-white focus:border-accent outline-none font-mono"
                value={newSiteInput}
                onChange={e => setNewSiteInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddAdditionalSite()}
                placeholder="example.com"
              />
              <button
                className="btn secondary text-xs px-4"
                onClick={handleAddAdditionalSite}
              >
                {t('common.add')}
              </button>
            </div>

            {additionalSites.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {additionalSites.map(host => (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={host}
                    className="flex items-center gap-2 px-3 py-1 bg-kinari-cream rounded-full text-xs border border-border text-sumi-black shadow-sm"
                  >
                    <span className="font-mono">{host}</span>
                    <button
                      onClick={() => handleRemoveAdditionalSite(host)}
                      className="text-sumi-gray hover:text-danger w-4 h-4 flex items-center justify-center rounded-full hover:bg-danger/10"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-auto pt-4 border-t border-border">
        <button
          className="btn secondary w-1/3"
          onClick={() => { playSound(SoundType.SOFT_GONG); onClose(); }}
        >
          {t('common.cancel')}
        </button>
        <button
          className="btn primary flex-1 shadow-lantern"
          onClick={handleStartSession}
        >
          {t('focusSession.startSession')}
        </button>
      </div>
    </motion.div>
  )
}

export default App
