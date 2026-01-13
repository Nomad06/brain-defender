/**
 * Popup React App for Brain Defender
 * Main extension popup component
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, initI18n } from '../shared/i18n'
import { SessionState, type FocusSession } from '../shared/domain/focus-sessions'
import { SettingsIcon, ShieldIcon } from '../shared/components/Icons'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.4
    }
  },
  exit: { opacity: 0 }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
}

const App: React.FC = () => {
  const [sitesCount, setSitesCount] = useState<number>(0)
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentHost, setCurrentHost] = useState<string>('')

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

        // Calculate remaining time
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
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]

      if (!tab?.url) {
        console.error('[Popup] No active tab URL')
        return
      }

      const host = normalizeHost(tab.url)
      if (!host) {
        console.error('[Popup] Could not normalize host from URL:', tab.url)
        return
      }

      const success = await messagingClient.addSite(host)
      if (success) {
        await loadSitesCount()
      } else {
        console.error('[Popup] Failed to add site')
      }
    } catch (err) {
      console.error('[Popup] Error adding current site:', err)
    }
  }

  // Open options page
  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  // Start focus session (opens modal)
  const handleStartFocusSession = () => {
    setShowPomodoroModal(true)
  }

  // Pause focus session
  const handlePauseFocusSession = async () => {
    try {
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

  // Check if session is active
  const isSessionActive =
    currentSession &&
    currentSession.state !== SessionState.IDLE

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-washi">
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold font-serif text-sumi-black">{t('popup.title')}</div>
          <div className="text-sumi-gray">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[320px] min-h-[500px] bg-washi flex flex-col p-4">
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
            className="flex flex-col flex-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.header
              className="flex justify-between items-center mb-6"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 font-semibold text-lg text-sumi-black">
                <img src="/logo.svg" alt="Focusan" className="w-6 h-6" />
                <span className="font-serif tracking-wide">Focusan</span>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleOpenOptions}
                className="text-sumi-gray hover:text-accent transition-colors p-1"
              >
                <SettingsIcon />
              </motion.button>
            </motion.header>

            <main className="flex flex-col items-center gap-6 relative flex-1">
              {/* Zen Quote */}
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <span className="font-serif block text-2xl text-sumi-black mb-1">没頭</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sumi-gray">Bottō — Immersion</span>
              </motion.div>

              {/* Timer Circle */}
              <motion.div
                className="relative w-[180px] h-[180px]"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="180" height="180" className="-rotate-90">
                    <circle cx="90" cy="90" r="80" stroke="rgba(46, 95, 111, 0.1)" strokeWidth="3" fill="transparent" />
                    <motion.circle
                      cx="90" cy="90" r="80"
                      stroke="var(--accent)"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 80}
                      initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                      animate={{
                        strokeDashoffset: isSessionActive && currentSession
                          ? (2 * Math.PI * 80) * (1 - (remainingTime / (currentSession.duration * 60)))
                          : 0
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="font-mono text-[2.8rem] font-light text-sumi-black leading-none tracking-tighter">
                      {isSessionActive ? formatTime(remainingTime) : '25:00'}
                    </span>
                    <motion.span
                      className="text-[0.65rem] text-accent uppercase tracking-[0.15em] mt-2 font-bold"
                      animate={{ opacity: isSessionActive ? [1, 0.5, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {isSessionActive
                        ? (currentSession?.state === SessionState.PAUSED ? 'Paused' : 'Focus Mode')
                        : 'Ready to Focus'}
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div
                className="flex items-center gap-3 w-full justify-center"
                variants={itemVariants}
              >
                {isSessionActive ? (
                  <>
                    <button
                      onClick={handlePauseFocusSession}
                      className="btn bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white"
                    >
                      {currentSession?.state === SessionState.PAUSED ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={handleStopFocusSession}
                      className="btn danger"
                    >
                      Stop
                    </button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartFocusSession}
                    className="btn primary text-lg px-8 py-3 shadow-zen-lg" // Reusing .btn .primary from styles.css via Tailwind
                  >
                    Start Focus
                  </motion.button>
                )}
              </motion.div>
            </main>

            {/* Footer / Status Card */}
            <motion.div
              className="mt-6 p-4 rounded-lg bg-white/60 backdrop-blur border border-border flex justify-between items-center shadow-zen"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent">
                  <ShieldIcon />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-sumi-gray uppercase tracking-wider font-semibold">Protected</span>
                  <span className="text-sm font-semibold text-sumi-black">{sitesCount} Sites</span>
                </div>
              </div>

              {!isSessionActive && currentHost && (
                <button
                  onClick={handleAddCurrentSite}
                  className="px-3 py-1.5 bg-white border border-border rounded text-xs hover:border-accent hover:text-accent transition-colors flex items-center gap-1 shadow-sm"
                  title={`Block ${currentHost}`}
                >
                  <span className="font-bold text-lg leading-none">+</span> Block
                </button>
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
    setAdditionalSites(additionalSites.filter(s => s !== host))
  }

  // Toggle main site selection
  const handleToggleMainSite = (host: string) => {
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
      className="flex flex-col h-full gap-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-serif font-medium text-xl text-sumi-black">{t('focusSession.selectSites')}</h2>
        <button
          className="text-sumi-gray hover:text-sumi-black p-2 text-xl leading-none"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <p className="text-sumi-gray text-xs">
        {t('focusSession.selectSitesHint')}
      </p>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-sumi-gray">{t('common.loading')}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1">
          {/* Duration Input */}
          <div className="bg-white/60 p-3 rounded-lg border border-border flex items-center gap-3 shadow-sm">
            <label className="font-medium text-sm flex-1 text-sumi-black">
              Duration (minutes):
            </label>
            <input
              type="number"
              className="w-20 text-center font-mono p-2 rounded border border-border bg-white focus:border-accent outline-none"
              value={duration}
              onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 25))}
              min="1"
              max="180"
            />
          </div>

          {/* Main sites list */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-xs text-sumi-gray uppercase tracking-wider">
              {t('focusSession.mainSites')}
            </label>
            <div className="bg-white/40 border border-border rounded-lg p-2 max-h-48 overflow-y-auto">
              {sites.length === 0 ? (
                <div className="text-sumi-gray text-center p-4 text-xs">
                  {t('focusSession.noSites')}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {sites.map(site => (
                    <label
                      key={site.host}
                      className="flex items-center gap-2 p-2 cursor-pointer rounded hover:bg-black/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="accent-accent w-4 h-4 cursor-pointer"
                        checked={selectedMainSites.has(site.host)}
                        onChange={() => handleToggleMainSite(site.host)}
                      />
                      <span className="font-mono flex-1 text-xs text-sumi-black">{site.host}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional sites */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-xs text-sumi-gray uppercase tracking-wider">
              {t('focusSession.additionalSites')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 text-xs p-2 rounded border border-border bg-white focus:border-accent outline-none"
                value={newSiteInput}
                onChange={e => setNewSiteInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddAdditionalSite()}
                placeholder="example.com"
              />
              <button
                className="btn text-xs px-3 py-2 bg-white border border-border hover:bg-gray-50"
                onClick={handleAddAdditionalSite}
              >
                {t('common.add')}
              </button>
            </div>

            {additionalSites.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalSites.map(host => (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={host}
                    className="flex items-center gap-2 px-3 py-1 bg-kinari-cream rounded-full text-xs border border-border"
                  >
                    <span className="font-mono text-sumi-black">{host}</span>
                    <button
                      onClick={() => handleRemoveAdditionalSite(host)}
                      className="text-sumi-gray hover:text-danger"
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
          className="btn w-1/3 bg-white border border-border hover:bg-gray-50"
          onClick={onClose}
        >
          {t('common.cancel')}
        </button>
        <button
          className="btn primary flex-1"
          onClick={handleStartSession}
        >
          {t('focusSession.startSession')}
        </button>
      </div>
    </motion.div>
  )
}

export default App
