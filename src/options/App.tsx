/**
 * Options Page React App for Focusan
 * Full settings and management interface with Japanese aesthetics
 */

import React, { useState, useEffect } from 'react'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, setLanguage, initI18n } from '../shared/i18n'
import { useLanguage } from '../shared/i18n/useLanguage'
import type { SiteObject } from '../shared/storage/schemas'
import type { Stats } from '../shared/domain/stats'
import type { AchievementsData } from '../shared/domain/achievements'
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress, type AchievementProgress, type AchievementType } from '../shared/domain/achievements'
import { type Schedule } from '../shared/domain/schedule'
import DeleteChallengeModal from './DeleteChallengeModal'
import ScheduleModal from './ScheduleModal'
import ConditionalRulesModal from './ConditionalRulesModal'
import type { ConditionalRule } from '../shared/domain/conditional-rules'
import { getAllThemes, getCurrentThemeId, switchTheme, getCurrentTheme, type Theme } from '../shared/themes'

type Tab = 'sites' | 'stats' | 'achievements' | 'appearance'

const App: React.FC = () => {
  // New site configuration state
  const [newSiteSchedule, setNewSiteSchedule] = useState<Schedule | null>(null)
  const [newSiteRules, setNewSiteRules] = useState<ConditionalRule[]>([])
  const [showNewScheduleModal, setShowNewScheduleModal] = useState<boolean>(false)
  const [showNewRulesModal, setShowNewRulesModal] = useState<boolean>(false)

  const [sites, setSites] = useState<SiteObject[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<AchievementsData | null>(null)
  const [achievementProgress, setAchievementProgress] = useState<Record<AchievementType, AchievementProgress> | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('sites')
  const [loading, setLoading] = useState<boolean>(true)
  const [newSiteInput, setNewSiteInput] = useState<string>('')
  const [bulkSitesInput, setBulkSitesInput] = useState<string>('')
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deletingHosts, setDeletingHosts] = useState<string[]>([])  // Changed to array
  const [schedulingHost, setSchedulingHost] = useState<{ host: string; schedule: Schedule | null } | null>(null)
  const [conditionalRulesHost, setConditionalRulesHost] = useState<{ host: string; rules: ConditionalRule[] } | null>(null)
  const [currentThemeId, setCurrentThemeId] = useState<string>('default')
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([])

  // Reactive language hook
  const language = useLanguage()

  // Load data and language
  useEffect(() => {
    const init = async () => {
      // Initialize i18n first
      await initI18n()
      // Load themes
      const themes = getAllThemes()
      setAvailableThemes(themes)
      const themeId = await getCurrentThemeId()
      setCurrentThemeId(themeId)
      const theme = await getCurrentTheme()
      setCurrentTheme(theme)
      // Then load data
      loadAllData()
    }
    init()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [sitesData, statsData, achievementsData] = await Promise.all([
        messagingClient.getSites(),
        messagingClient.getStats(),
        messagingClient.getAchievements(),
      ])
      setSites(sitesData)
      setStats(statsData)
      setAchievements(achievementsData as AchievementsData)

      // Calculate achievement progress
      if (statsData) {
        const progress = await getAchievementProgress(statsData, sitesData)
        setAchievementProgress(progress)
      }
    } catch (err) {
      console.error('[Options] Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const sitesData = await messagingClient.getSites()
      setSites(sitesData)
    } catch (err) {
      console.error('[Options] Error loading sites:', err)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await messagingClient.getStats()
      setStats(statsData)
    } catch (err) {
      console.error('[Options] Error loading stats:', err)
    }
  }

  // Handle theme change
  const handleThemeChange = async (themeId: string) => {
    const success = await switchTheme(themeId)
    if (success) {
      setCurrentThemeId(themeId)
      const theme = await getCurrentTheme()
      setCurrentTheme(theme)
    }
  }

  // Add single site
  const handleAddSite = async () => {
    const host = normalizeHost(newSiteInput)
    if (!host) {
      alert(t('errors.invalidDomain'))
      return
    }

    if (sites.some(s => s.host === host)) {
      alert(t('errors.siteAlreadyAdded'))
      return
    }

    try {
      await messagingClient.addSite(host, {
        schedule: newSiteSchedule,
        conditionalRules: newSiteRules.length > 0 ? newSiteRules : undefined
      })
      setNewSiteInput('')
      setNewSiteSchedule(null)
      setNewSiteRules([])
      await loadSites()
    } catch (err) {
      console.error('[Options] Error adding site:', err)
      alert(t('errors.failedToAdd'))
    }
  }

  // Add bulk sites
  const handleBulkAdd = async () => {
    const lines = bulkSitesInput.split('\n').filter(l => l.trim())
    const hosts = lines.map(l => normalizeHost(l)).filter(Boolean) as string[]

    if (hosts.length === 0) {
      alert(t('errors.noValidDomains'))
      return
    }

    try {
      for (const host of hosts) {
        if (!sites.some(s => s.host === host)) {
          await messagingClient.addSite(host)
        }
      }
      setBulkSitesInput('')
      await loadSites()
      alert(`${t('common.added')} ${hosts.length} ${t('options.sites')}`)
    } catch (err) {
      console.error('[Options] Error bulk adding sites:', err)
      alert(t('errors.failedToBulkAdd'))
    }
  }

  // Remove site - show deletion challenge modal
  const handleRemoveSite = (host: string) => {
    setDeletingHosts([host])
  }

  // Confirm deletion after challenge passed
  const confirmRemoveSites = async () => {
    if (deletingHosts.length === 0) return

    try {
      for (const host of deletingHosts) {
        await messagingClient.removeSite(host)
      }
      await loadSites()
      setSelectedSites(prev => {
        const newSet = new Set(prev)
        deletingHosts.forEach(h => newSet.delete(h))
        return newSet
      })
      setDeletingHosts([])
    } catch (err) {
      console.error('[Options] Error removing sites:', err)
      alert(t('errors.failedToRemove'))
      setDeletingHosts([])
    }
  }

  // Cancel deletion
  const cancelRemoveSites = () => {
    setDeletingHosts([])
  }

  // Open schedule modal
  const handleOpenSchedule = (host: string) => {
    const site = sites.find(s => s.host === host)
    setSchedulingHost({
      host,
      schedule: (site?.schedule as Schedule) || null,
    })
  }

  // Save schedule
  const handleSaveSchedule = async (schedule: Schedule | null) => {
    if (!schedulingHost) return

    try {
      // Update the site's schedule
      await messagingClient.updateSite(schedulingHost.host, { schedule })
      await loadSites()
      setSchedulingHost(null)
    } catch (err) {
      console.error('[Options] Error saving schedule:', err)
      alert('Failed to save schedule')
    }
  }

  // Cancel schedule editing
  const handleCancelSchedule = () => {
    setSchedulingHost(null)
  }

  // Open conditional rules modal
  const handleOpenConditionalRules = (host: string) => {
    const site = sites.find(s => s.host === host)
    setConditionalRulesHost({
      host,
      rules: (site?.conditionalRules as ConditionalRule[]) || [],
    })
  }

  // Save conditional rules
  const handleSaveConditionalRules = async (rules: ConditionalRule[]) => {
    if (!conditionalRulesHost) return

    try {
      // Update the site's conditional rules
      await messagingClient.updateSite(conditionalRulesHost.host, { conditionalRules: rules })
      await loadSites()
      setConditionalRulesHost(null)
    } catch (err) {
      console.error('[Options] Error saving conditional rules:', err)
      alert('Failed to save conditional rules')
    }
  }

  // Toggle site selection
  const handleToggleSite = (host: string) => {
    setSelectedSites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(host)) {
        newSet.delete(host)
      } else {
        newSet.add(host)
      }
      return newSet
    })
  }

  // Select all sites
  const handleSelectAll = () => {
    const filteredSites = getFilteredSites()
    setSelectedSites(new Set(filteredSites.map(s => s.host)))
  }

  // Deselect all sites
  const handleDeselectAll = () => {
    setSelectedSites(new Set())
  }

  // Bulk delete - show deletion challenge modal
  const handleBulkDelete = () => {
    if (selectedSites.size === 0) return
    setDeletingHosts(Array.from(selectedSites))
  }

  // Export data
  const handleExport = async () => {
    try {
      const data = await messagingClient.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `brain-defender-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Options] Error exporting data:', err)
      alert(t('errors.failedToExport'))
    }
  }

  // Import data
  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      await messagingClient.importData(text)
      await loadAllData()
      alert(t('options.importSuccess'))
    } catch (err) {
      console.error('[Options] Error importing data:', err)
      alert(t('errors.failedToImport'))
    }
  }

  // Clear stats
  const handleClearStats = async () => {
    if (!confirm(t('options.confirmClearStats'))) {
      return
    }

    try {
      await messagingClient.clearStats()
      await loadStats()
      alert(t('options.statsCleared'))
    } catch (err) {
      console.error('[Options] Error clearing stats:', err)
      alert(t('errors.failedToClearStats'))
    }
  }

  // Change language
  const handleLanguageChange = async (lang: string) => {
    try {
      await setLanguage(lang as 'ru' | 'en')
      // No need to reload - useLanguage hook will update automatically
    } catch (err) {
      console.error('[Options] Error changing language:', err)
    }
  }

  // Get filtered sites
  const getFilteredSites = (): SiteObject[] => {
    if (categoryFilter === 'all') {
      return sites
    }
    return sites.filter(s => s.category === categoryFilter)
  }

  // Get unique categories
  const getCategories = (): string[] => {
    const cats = new Set<string>()
    sites.forEach(s => {
      if (s.category) cats.add(s.category)
    })
    return Array.from(cats).sort()
  }

  const filteredSites = getFilteredSites()
  const categories = getCategories()

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="h1">{t('options.title')}</div>
          <div className="muted" style={{ marginTop: '12px', textAlign: 'center' }}>
            {t('common.loading')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="washi-texture" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '64px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', opacity: 0, animation: 'fadeInUp 0.8s ease-out 0.1s forwards' }}>{currentTheme?.metadata.emoji || '🧠'}</span>
          <span style={{ fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em', opacity: 0, animation: 'fadeInUp 0.8s ease-out 0.2s forwards' }}>
            {currentTheme?.metadata.name || 'Brain Defender'}
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {['sites', 'stats', 'achievements', 'appearance'].map((tab, index) => {
            const icons = { sites: '🛡️', stats: '📊', achievements: '🏆', appearance: '🎨' }
            const labels = {
              sites: t('options.blocklist'),
              stats: t('options.dashboard'),
              achievements: t('options.achievements'),
              appearance: t('options.appearance')
            }
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  padding: '14px 20px', borderRadius: '9999px',
                  textAlign: 'center',
                  color: isActive ? 'var(--palette-indigo, var(--accent))' : 'var(--sumi-gray)',
                  background: isActive ? 'rgba(46, 95, 111, 0.08)' : 'transparent',
                  border: isActive ? '1px solid var(--palette-indigo, var(--accent))' : '1px solid transparent',
                  transition: 'all 0.3s ease', cursor: 'pointer',
                  fontSize: '0.95rem', fontWeight: isActive ? 600 : 500,
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s forwards`
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(46, 95, 111, 0.04)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }
                }}
              >
                <span>{icons[tab as keyof typeof icons]}</span>
                {labels[tab as keyof typeof labels]}
              </button>
            )
          })}
        </nav>

        <div style={{
          fontSize: '0.85rem',
          color: 'var(--muted)',
          fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)',
          fontStyle: 'italic',
          opacity: 0,
          animation: 'fadeInUp 1s ease-out 0.8s forwards',
          textAlign: 'center',
          padding: '16px 0',
          borderTop: '1px solid var(--border)',
          marginTop: '24px'
        }}>
          {currentTheme?.metadata.id === 'japanese' ? '一期一会' : 'One thing at a time'}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '48px 80px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', opacity: 0, animation: 'fadeInUp 0.6s ease-out 0.2s forwards' }}>
          <div>
            <h2 style={{
              fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)',
              fontSize: '2.5rem',
              marginBottom: '8px',
              color: 'var(--text)',
              fontWeight: 700,
              letterSpacing: currentTheme?.metadata.id === 'japanese' ? '0.05em' : 'normal'
            }}>
              {activeTab === 'sites' && t('options.blocklist')}
              {activeTab === 'stats' && t('options.dashboard')}
              {activeTab === 'achievements' && t('options.achievements')}
              {activeTab === 'appearance' && t('options.appearance')}
            </h2>
            <p style={{
              color: 'var(--muted)',
              fontSize: '1rem',
              fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)',
              fontStyle: currentTheme?.metadata.id === 'japanese' ? 'normal' : 'normal'
            }}>
              {activeTab === 'sites' && (currentTheme?.metadata.id === 'japanese' ? '心を乱すサイト' : 'Sites that disturb your peace')}
              {activeTab === 'stats' && (currentTheme?.metadata.id === 'japanese' ? '集中の道' : 'Your journey of focus')}
              {activeTab === 'achievements' && (currentTheme?.metadata.id === 'japanese' ? '道の節目' : 'Milestones on your path')}
              {activeTab === 'appearance' && (currentTheme?.metadata.id === 'japanese' ? '外観の設定' : 'Customize your experience')}
            </p>
          </div>
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid var(--border)',
              borderRadius: '9999px',
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            <option value="ru">🇷🇺 {t('options.languageRu')}</option>
            <option value="en">🇬🇧 {t('options.languageEn')}</option>
          </select>
        </div>

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              marginBottom: '24px',
              boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  className="input samurai-transition"
                  value={newSiteInput}
                  onChange={e => setNewSiteInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                  placeholder={t('options.inputPlaceholder')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--text)',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  className="samurai-transition"
                  onClick={handleAddSite}
                  style={{
                    background: 'transparent',
                    border: '2px solid var(--accent)',
                    color: 'var(--accent)',
                    padding: '0 32px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--accent)'
                  }}
                >
                  {t('options.addButton')}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="samurai-transition"
                  onClick={() => setShowNewScheduleModal(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: newSiteSchedule ? 'rgba(46, 95, 111, 0.1)' : 'transparent',
                    color: newSiteSchedule ? 'var(--accent)' : 'var(--sumi-gray)',
                    border: newSiteSchedule ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: newSiteSchedule ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!newSiteSchedule) {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!newSiteSchedule) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--sumi-gray)'
                    }
                  }}
                >
                  <span>{newSiteSchedule ? '📅' : '📅'}</span>
                  {t('options.scheduleButtonTitle') || 'Schedule'}
                  {newSiteSchedule && <span style={{ fontSize: '0.8em', marginLeft: '4px' }}>✓</span>}
                </button>
                <button
                  className="samurai-transition"
                  onClick={() => setShowNewRulesModal(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: newSiteRules.length > 0 ? 'rgba(46, 95, 111, 0.1)' : 'transparent',
                    color: newSiteRules.length > 0 ? 'var(--accent)' : 'var(--sumi-gray)',
                    border: newSiteRules.length > 0 ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: newSiteRules.length > 0 ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (newSiteRules.length === 0) {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newSiteRules.length === 0) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--sumi-gray)'
                    }
                  }}
                >
                  <span>{newSiteRules.length > 0 ? '🔀' : '🔀'}</span>
                  {t('options.conditionsButtonTitle') || 'Conditions'}
                  {newSiteRules.length > 0 && <span style={{ fontSize: '0.8em', marginLeft: '4px' }}>({newSiteRules.length})</span>}
                </button>
              </div>
            </div>

            {/* Selection Bar */}
            {selectedSites.size > 0 && (
              <div style={{
                padding: '16px 24px',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border)',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(46, 95, 111, 0.06)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(46, 95, 111, 0.1)',
                    color: 'var(--accent)',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    {selectedSites.size} selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 16px',
                      background: 'transparent',
                      color: 'var(--sumi-gray)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >All</button>
                  <button
                    onClick={handleDeselectAll}
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 16px',
                      background: 'transparent',
                      color: 'var(--sumi-gray)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >None</button>
                </div>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    fontSize: '0.85rem',
                    padding: '6px 20px',
                    background: 'transparent',
                    border: '2px solid var(--danger)',
                    color: 'var(--danger)',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--danger)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--danger)'
                  }}
                >Delete</button>
              </div>
            )}

            {/* Bulk Add */}
            <div style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(46, 95, 111, 0.06)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text)', fontSize: '0.95rem' }}>Bulk Add</div>
              <textarea
                className="input samurai-transition"
                value={bulkSitesInput}
                onChange={e => setBulkSitesInput(e.target.value)}
                placeholder="example.com&#10;another.com"
                style={{
                  minHeight: '80px',
                  width: '100%',
                  marginBottom: '12px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontFamily: 'var(--mono)'
                }}
              />
              <button
                onClick={handleBulkAdd}
                style={{
                  fontSize: '0.9rem',
                  background: 'transparent',
                  border: '2px solid var(--accent)',
                  color: 'var(--accent)',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
              >Add All</button>
            </div>

            <div style={{
              padding: '0',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleExport}
                    style={{
                      fontSize: '0.85rem',
                      padding: '8px 16px',
                      background: 'transparent',
                      color: 'var(--sumi-gray)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >{t('options.export')}</button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.json'
                      input.onchange = e => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) handleImport(file)
                      }
                      input.click()
                    }}
                    style={{
                      fontSize: '0.85rem',
                      padding: '8px 16px',
                      background: 'transparent',
                      color: 'var(--sumi-gray)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >{t('options.import')}</button>
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">{t('options.allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ padding: '0' }}>
                {filteredSites.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '64px 24px',
                    color: 'var(--muted)',
                    fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)',
                    fontSize: '1rem'
                  }}>
                    {t('options.noSites')}
                  </div>
                ) : (
                  filteredSites.map((site, index) => (
                    <div
                      key={site.host}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        borderBottom: index < filteredSites.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(46, 95, 111, 0.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedSites.has(site.host)}
                          onChange={() => handleToggleSite(site.host)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                            {site.host}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            {site.category && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--accent)',
                                background: 'rgba(46, 95, 111, 0.1)',
                                padding: '3px 10px',
                                borderRadius: '9999px',
                                fontWeight: 500
                              }}>{site.category}</span>
                            )}
                            {site.schedule && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--sumi-gray)',
                                background: 'rgba(0, 0, 0, 0.05)',
                                padding: '3px 10px',
                                borderRadius: '9999px'
                              }}>📅 Schedule</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenSchedule(site.host)}
                          title={t('options.scheduleButtonTitle')}
                          style={{
                            background: 'transparent',
                            color: 'var(--sumi-gray)',
                            border: '1px solid var(--border)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontSize: '1.1rem'
                          }}
                        >📅</button>
                        <button
                          onClick={() => handleOpenConditionalRules(site.host)}
                          title={t('options.conditionsButtonTitle')}
                          style={{
                            background: 'transparent',
                            color: 'var(--sumi-gray)',
                            border: '1px solid var(--border)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontSize: '1.1rem'
                          }}
                        >🔀</button>
                        <button
                          onClick={() => handleRemoveSite(site.host)}
                          style={{
                            background: 'transparent',
                            border: '2px solid var(--danger)',
                            color: 'var(--danger)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1.2rem',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--danger)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--danger)'
                          }}
                        >×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '48px' }}>
              {[
                { label: t('stats.totalBlocks'), value: stats.totalBlocks, emoji: '🛡️' },
                { label: t('stats.streakDays'), value: stats.streakDays, emoji: '🔥' },
                { label: t('stats.totalSites'), value: stats.totalSites, emoji: '📊' }
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '32px',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)',
                    textAlign: 'center',
                    opacity: 0,
                    animation: `fadeInUp 0.6s ease-out ${0.1 + index * 0.1}s forwards`
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{stat.emoji}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text)', fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)' }}>
              {t('stats.bySite')}
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)',
              marginBottom: '24px'
            }}>
              {Object.entries(stats.bySite)
                .sort(([, a], [, b]) => b.blocks - a.blocks)
                .map(([host, siteStats], index, arr) => (
                  <div
                    key={host}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '20px 28px',
                      borderBottom: index < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(46, 95, 111, 0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.95rem' }}>{host}</div>
                    <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{siteStats.blocks} blocks</div>
                  </div>
                ))}
            </div>
            <button
              onClick={handleClearStats}
              style={{
                marginTop: '24px',
                background: 'transparent',
                border: '2px solid var(--danger)',
                color: 'var(--danger)',
                padding: '12px 32px',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--danger)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--danger)'
              }}
            >{t('options.clearStats')}</button>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && achievements && achievementProgress && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              marginBottom: '32px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)'
            }}>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                marginBottom: '16px',
                color: 'var(--text)',
                fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)'
              }}>
                {achievements.unlocked.length} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length} Unlocked
              </div>
              <div style={{ height: '12px', background: 'rgba(46, 95, 111, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((achievements.unlocked.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent) 0%, var(--gold) 100%)',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def], index) => {
                const achievementType = type as AchievementType
                const progress = achievementProgress[achievementType]
                const isUnlocked = achievements.unlocked.includes(achievementType)

                return (
                  <div
                    key={type}
                    style={{
                      padding: '28px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '16px',
                      border: isUnlocked ? '2px solid var(--gold)' : '1px solid var(--border)',
                      boxShadow: isUnlocked ? '0 4px 24px rgba(212, 175, 55, 0.15)' : '0 2px 12px rgba(46, 95, 111, 0.06)',
                      filter: isUnlocked ? 'none' : 'grayscale(0.3) opacity(0.85)',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${0.1 + (index % 3) * 0.1}s forwards`
                    }}
                    onMouseEnter={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(212, 175, 55, 0.25)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(212, 175, 55, 0.15)'
                      }
                    }}
                  >
                    <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '16px' }}>{def.icon}</div>
                    <div style={{ fontWeight: 600, textAlign: 'center', marginBottom: '8px', fontSize: '1.1rem', color: 'var(--text)' }}>
                      {def.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', textAlign: 'center', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                      {def.description}
                    </div>
                    {isUnlocked ? (
                      <div style={{
                        color: 'var(--gold)',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        padding: '8px',
                        borderRadius: '9999px'
                      }}>
                        ✓ Unlocked
                      </div>
                    ) : (
                      <div style={{ height: '8px', background: 'rgba(46, 95, 111, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progress?.progress || 0}%`,
                          background: 'linear-gradient(90deg, var(--accent) 0%, var(--gold) 100%)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(46, 95, 111, 0.08)'
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 600,
                marginBottom: '24px',
                color: 'var(--text)',
                fontFamily: currentTheme?.metadata.id === 'japanese' ? 'var(--font-serif)' : 'var(--font-sans)'
              }}>
                Seasonal Themes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                {availableThemes.map((theme, index) => (
                  <button
                    key={theme.metadata.id}
                    onClick={() => handleThemeChange(theme.metadata.id)}
                    style={{
                      padding: '24px',
                      border: currentThemeId === theme.metadata.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '16px',
                      background: currentThemeId === theme.metadata.id ? 'rgba(46, 95, 111, 0.08)' : 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.3s ease',
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${0.1 + index * 0.1}s forwards`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 95, 111, 0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: theme.colors.accent,
                      boxShadow: `0 4px 16px ${theme.colors.accent}40`
                    }} />
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px', textAlign: 'center' }}>{theme.metadata.emoji}</div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', textAlign: 'center' }}>
                        {theme.metadata.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showNewScheduleModal && (
        <ScheduleModal
          host={newSiteInput || 'New Site'}
          initialSchedule={newSiteSchedule}
          onSave={(schedule) => {
            setNewSiteSchedule(schedule)
            setShowNewScheduleModal(false)
          }}
          onCancel={() => setShowNewScheduleModal(false)}
        />
      )}

      {showNewRulesModal && (
        <ConditionalRulesModal
          host={newSiteInput || 'New Site'}
          initialRules={newSiteRules}
          onSave={(rules) => {
            setNewSiteRules(rules)
            setShowNewRulesModal(false)
          }}
          onClose={() => setShowNewRulesModal(false)}
        />
      )}

      {schedulingHost && (
        <ScheduleModal
          host={schedulingHost.host}
          initialSchedule={schedulingHost.schedule}
          onSave={handleSaveSchedule}
          onCancel={handleCancelSchedule}
        />
      )}

      {conditionalRulesHost && (
        <ConditionalRulesModal
          host={conditionalRulesHost.host}
          initialRules={conditionalRulesHost.rules}
          onSave={handleSaveConditionalRules}
          onClose={() => setConditionalRulesHost(null)}
        />
      )}

      {deletingHosts.length > 0 && (
        <DeleteChallengeModal
          hosts={deletingHosts}
          onConfirm={confirmRemoveSites}
          onCancel={cancelRemoveSites}
        />
      )}
    </div>
  )
}

export default App
