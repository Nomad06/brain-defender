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
    <div className="container">
      <div className="card" style={{ padding: '14px' }}>
        {/* Show Pomodoro modal or main content */}
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
            <div className="h1">{t('popup.title')}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            <span>{t('popup.blockList')}</span>{' '}
            <span className="kbd">{sitesCount}</span>
          </div>

          <div className="space"></div>

          <div className="col">
            <button className="btn primary" onClick={handleAddCurrentSite}>
              ➕ {t('popup.addCurrent')}
            </button>
            <button className="btn" onClick={handleOpenOptions}>
              ⚙️ {t('popup.openOptions')}
            </button>
          </div>

          <div className="space"></div>
          <div className="muted" style={{ fontSize: '12px' }}>
            {t('popup.hint', { example: 'news.example.com' })}
          </div>

          {/* Focus Session - Active */}
          {isSessionActive && (
            <div
              className="card"
              style={{
                padding: '12px',
                background: 'var(--card2)',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  🍅 {t('focusSession.title')}
                </div>
                <div className="kbd" style={{ fontSize: '16px' }}>
                  {formatTime(remainingTime)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="btn"
                  onClick={handlePauseFocusSession}
                  style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                >
                  {currentSession?.state === SessionState.PAUSED
                    ? t('focusSession.resume')
                    : t('focusSession.pause')}
                </button>
                <button
                  className="btn"
                  onClick={handleStopFocusSession}
                  style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                >
                  {t('focusSession.stop')}
                </button>
              </div>
            </div>
          )}

          {/* Focus Session - Start */}
          {!isSessionActive && (
            <div
              className="card"
              style={{
                padding: '12px',
                background: 'var(--card2)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                🍅 {t('focusSession.startTitle')}
              </div>
              <button
                className="btn primary"
                onClick={handleStartFocusSession}
                style={{ width: '100%', fontSize: '12px' }}
              >
                {t('focusSession.start25min')}
              </button>
            </div>
          )}
          </>
        )}
      </div>
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
      await messagingClient.startFocusSession(25, sitesToBlock)
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
