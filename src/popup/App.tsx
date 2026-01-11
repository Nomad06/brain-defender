/**
 * Popup React App for Brain Defender
 * Main extension popup component
 */

import React, { useState, useEffect } from 'react'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, initI18n } from '../shared/i18n'
import { SessionState, type FocusSession } from '../shared/domain/focus-sessions'

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
      <div className="container">
        <div className="card" style={{ padding: '14px' }}>
          <div className="h1">{t('popup.title')}</div>
          <div className="muted" style={{ marginTop: '12px', textAlign: 'center' }}>
            {t('common.loading')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ width: '350px', minHeight: '500px', display: 'flex', flexDirection: 'column', background: 'var(--washi-white)', padding: '24px', boxSizing: 'border-box' }}>
      {showPomodoroModal ? (
        <PomodoroModal
          onClose={() => setShowPomodoroModal(false)}
          onStart={async () => {
            await loadFocusSession()
            setShowPomodoroModal(false)
          }}
        />
      ) : (
        <>
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sumi-black)', fontWeight: 600, fontSize: '1.1rem' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent)', borderRadius: '50%', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />
              </div>
              <span>Focusan</span>
            </div>
            <button
              onClick={handleOpenOptions}
              style={{ color: 'var(--color-stone)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15A1.65 1.65 0 0 0 20.2 12A1.65 1.65 0 0 0 19.4 9M12 21A1.65 1.65 0 0 0 15 20.2A1.65 1.65 0 0 0 12 19.4M4.6 15A1.65 1.65 0 0 0 3.8 12A1.65 1.65 0 0 0 4.6 9M12 3A1.65 1.65 0 0 0 9 3.8A1.65 1.65 0 0 0 12 4.6M16.24 16.24A1.65 1.65 0 0 0 18.36 14.12A1.65 1.65 0 0 0 16.24 16.24M16.24 7.76A1.65 1.65 0 0 0 14.12 5.64A1.65 1.65 0 0 0 16.24 7.76M7.76 16.24A1.65 1.65 0 0 0 5.64 18.36A1.65 1.65 0 0 0 7.76 16.24M7.76 7.76A1.65 1.65 0 0 0 9.88 5.64A1.65 1.65 0 0 0 7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            {/* Zen Quote */}
            <div style={{ textAlign: 'center', color: 'var(--color-stone)', animation: 'fadeIn 1s ease-out' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-family-serif)', fontSize: '1.5rem', color: 'var(--sumi-black)', marginBottom: '2px' }}>没頭</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Bottō — Immersion</span>
            </div>

            {/* Timer Circle */}
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="110" cy="110" r="100" stroke="var(--color-sumi-light)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="110" cy="110" r="100"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 100}
                    strokeDashoffset={isSessionActive && currentSession ? (2 * Math.PI * 100) * (1 - (remainingTime / (currentSession.duration * 60))) : 0}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.35s' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 300, color: 'var(--sumi-black)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {isSessionActive ? formatTime(remainingTime) : '25:00'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-take)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', fontWeight: 500 }}>
                    {isSessionActive
                      ? (currentSession?.state === SessionState.PAUSED ? 'Paused' : 'Focus')
                      : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {isSessionActive ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handlePauseFocusSession}
                    style={{ padding: '12px 32px', borderRadius: '9999px', fontWeight: 500, fontSize: '1rem', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow)' }}
                  >
                    {currentSession?.state === SessionState.PAUSED ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleStopFocusSession}
                    style={{ padding: '12px 24px', borderRadius: '9999px', fontWeight: 500, fontSize: '1rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer' }}
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartFocusSession}
                  style={{ padding: '12px 32px', borderRadius: '9999px', fontWeight: 500, fontSize: '1rem', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow)' }}
                >
                  Start Focus
                </button>
              )}
            </div>

            {/* Footer / Status Card */}
            <div style={{
              marginTop: 'auto',
              width: '100%',
              background: 'var(--card2)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6-8 10-8 10z" />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protected</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sumi-black)' }}>{sitesCount} Sites</span>
                </div>
              </div>

              {!isSessionActive && currentHost && (
                <button
                  onClick={handleAddCurrentSite}
                  style={{
                    background: 'var(--bg1)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--sumi-black)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--sumi-black)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                  title={`Block ${currentHost}`}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span> Block
                </button>
              )}
            </div>
          </main>

          {/* Spacer to replace old footer margin if needed, but the main content now handles it */}
        </>
      )}
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
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div className="h2">{t('focusSession.selectSites')}</div>
        <button
          className="btn"
          onClick={onClose}
          style={{ padding: '4px 8px', fontSize: '18px', minWidth: 'auto' }}
        >
          ✕
        </button>
      </div>

      <div className="muted" style={{ marginBottom: '12px', fontSize: '11px' }}>
        {t('focusSession.selectSitesHint')}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div className="muted">{t('common.loading')}</div>
        </div>
      ) : (
        <>
          {/* Duration Input */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card2)', padding: '8px 12px', borderRadius: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '12px', flex: 1 }}>
              Duration (minutes):
            </label>
            <input
              type="number"
              className="input"
              value={duration}
              onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 25))}
              min="1"
              max="180"
              style={{ width: '60px', fontSize: '12px', padding: '4px 8px' }}
            />
          </div>

          {/* Main sites list */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '12px' }}>
              {t('focusSession.mainSites')}:
            </label>
            <div
              style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '4px',
                background: 'var(--card2)',
              }}
            >
              {sites.length === 0 ? (
                <div className="muted" style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                  {t('focusSession.noSites')}
                </div>
              ) : (
                sites.map(site => (
                  <label
                    key={site.host}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--card)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMainSites.has(site.host)}
                      onChange={() => handleToggleMainSite(site.host)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: '11px', userSelect: 'none' }}>{site.host}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Additional sites */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '12px' }}>
              {t('focusSession.additionalSites')}:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="input"
                value={newSiteInput}
                onChange={e => setNewSiteInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddAdditionalSite()}
                placeholder="example.com"
                style={{ flex: 1, fontSize: '11px' }}
              />
              <button
                className="btn"
                onClick={handleAddAdditionalSite}
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                {t('common.add')}
              </button>
            </div>
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '20px' }}>
              {additionalSites.map(host => (
                <div
                  key={host}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 6px',
                    background: 'var(--card2)',
                    borderRadius: '4px',
                    fontSize: '10px',
                  }}
                >
                  <span style={{ userSelect: 'none' }}>{host}</span>
                  <button
                    className="btn"
                    onClick={() => handleRemoveAdditionalSite(host)}
                    style={{
                      padding: '2px 4px',
                      fontSize: '9px',
                      marginLeft: '2px',
                      minWidth: 'auto',
                      lineHeight: '1',
                    }}
                    title={t('common.remove')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <button className="btn" onClick={onClose} style={{ flex: 1, fontSize: '11px' }}>
              {t('common.cancel')}
            </button>
            <button
              className="btn primary"
              onClick={handleStartSession}
              style={{ flex: 1, fontSize: '11px' }}
            >
              {t('focusSession.startSession')}
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default App
