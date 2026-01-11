/**
 * Options Page React App for Focusan
 * Full settings and management interface with Japanese aesthetics
 */

import React, { useState, useEffect } from 'react'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, setLanguage, getCurrentLanguage, initI18n } from '../shared/i18n'
import type { SiteObject } from '../shared/storage/schemas'
import type { Stats } from '../shared/domain/stats'
import type { AchievementsData } from '../shared/domain/achievements'
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress, type AchievementProgress, type AchievementType } from '../shared/domain/achievements'
import { type Schedule } from '../shared/domain/schedule'
import DeleteChallengeModal from './DeleteChallengeModal'
import ScheduleModal from './ScheduleModal'
import ConditionalRulesModal from './ConditionalRulesModal'
import type { ConditionalRule } from '../shared/domain/conditional-rules'
import { getAllThemes, getCurrentThemeId, switchTheme, type Theme } from '../shared/themes'

type Tab = 'sites' | 'stats' | 'achievements' | 'appearance'

const App: React.FC = () => {
  const [sites, setSites] = useState<SiteObject[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<AchievementsData | null>(null)
  const [achievementProgress, setAchievementProgress] = useState<Record<AchievementType, AchievementProgress> | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('sites')
  const [loading, setLoading] = useState<boolean>(true)
  const [newSiteInput, setNewSiteInput] = useState<string>('')
  const [bulkSitesInput, setBulkSitesInput] = useState<string>('')
  const [language, setLanguageState] = useState<string>('ru')
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deletingHosts, setDeletingHosts] = useState<string[]>([])  // Changed to array
  const [schedulingHost, setSchedulingHost] = useState<{ host: string; schedule: Schedule | null } | null>(null)
  const [conditionalRulesHost, setConditionalRulesHost] = useState<{ host: string; rules: ConditionalRule[] } | null>(null)
  const [currentThemeId, setCurrentThemeId] = useState<string>('default')
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([])

  // Load data and language
  useEffect(() => {
    const init = async () => {
      // Initialize i18n first
      await initI18n()
      const currentLang = getCurrentLanguage()
      setLanguageState(currentLang)
      // Load themes
      const themes = getAllThemes()
      setAvailableThemes(themes)
      const themeId = await getCurrentThemeId()
      setCurrentThemeId(themeId)
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
      await messagingClient.addSite(host)
      setNewSiteInput('')
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

  // Add current tab
  const handleAddCurrentSite = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]

      if (!tab?.url) {
        alert(t('errors.noActiveTab'))
        return
      }

      const host = normalizeHost(tab.url)
      if (!host) {
        alert(t('errors.invalidDomain'))
        return
      }

      if (sites.some(s => s.host === host)) {
        alert(t('errors.siteAlreadyAdded'))
        return
      }

      await messagingClient.addSite(host)
      await loadSites()
    } catch (err) {
      console.error('[Options] Error adding current site:', err)
      alert(t('errors.failedToAdd'))
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
      // Reload page to apply language changes
      window.location.reload()
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-washi)', fontFamily: 'var(--font-family-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'white', borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px', fontWeight: 600, color: 'var(--color-ai-indigo)' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--color-seigaiha)', borderRadius: '50%' }} />
          <span>Focusan</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('sites')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderRadius: '8px',
              textAlign: 'left', color: activeTab === 'sites' ? 'white' : 'var(--color-stone)',
              background: activeTab === 'sites' ? 'var(--color-ai-indigo)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🛡️</span> Blocklist
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderRadius: '8px',
              textAlign: 'left', color: activeTab === 'stats' ? 'white' : 'var(--color-stone)',
              background: activeTab === 'stats' ? 'var(--color-ai-indigo)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderRadius: '8px',
              textAlign: 'left', color: activeTab === 'achievements' ? 'white' : 'var(--color-stone)',
              background: activeTab === 'achievements' ? 'var(--color-ai-indigo)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🏆</span> Achievements
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderRadius: '8px',
              textAlign: 'left', color: activeTab === 'appearance' ? 'white' : 'var(--color-stone)',
              background: activeTab === 'appearance' ? 'var(--color-ai-indigo)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🎨</span> Appearance
          </button>
        </nav>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)', fontStyle: 'italic', opacity: 0.8 }}>
          "One thing at a time."
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '2rem', marginBottom: '8px', color: 'var(--color-ai-indigo)' }}>
              {activeTab === 'sites' && 'Blocklist'}
              {activeTab === 'stats' && 'Overview'}
              {activeTab === 'achievements' && 'Achievements'}
              {activeTab === 'appearance' && 'Appearance'}
            </h2>
            <p style={{ color: 'var(--color-stone)' }}>
              {activeTab === 'sites' && 'Sites that disturb your peace.'}
              {activeTab === 'stats' && 'Your journey of focus.'}
              {activeTab === 'achievements' && 'Milestones on your path.'}
              {activeTab === 'appearance' && 'Customize your experience.'}
            </p>
          </div>
          <select
            className="btn samurai-transition"
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '12px', background: 'white' }}
          >
            <option value="ru">🇷🇺 {t('options.languageRu')}</option>
            <option value="en">🇬🇧 {t('options.languageEn')}</option>
          </select>
        </div>

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="card bamboo-grid" style={{ padding: '24px', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  className="input"
                  value={newSiteInput}
                  onChange={e => setNewSiteInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                  placeholder={t('options.inputPlaceholder')}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                />
                <button className="btn primary samurai-transition" onClick={handleAddSite} style={{ background: 'var(--color-ai-indigo)', color: 'white', padding: '0 24px' }}>
                  {t('options.addButton')}
                </button>
              </div>
              <button className="btn samurai-transition" onClick={handleAddCurrentSite} style={{ width: '100%', padding: '10px', background: 'var(--color-mizu)', color: 'var(--color-seigaiha)', border: 'none' }}>
                🌐 {t('options.addCurrent')}
              </button>
            </div>

            {/* Selection Bar */}
            {selectedSites.size > 0 && (
              <div className="card" style={{ padding: '12px', background: 'var(--card2)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="kbd">{selectedSites.size} selected</span>
                  <button className="btn" onClick={handleSelectAll} style={{ fontSize: '12px', padding: '6px 12px' }}>All</button>
                  <button className="btn" onClick={handleDeselectAll} style={{ fontSize: '12px', padding: '6px 12px' }}>None</button>
                </div>
                <button className="btn danger" onClick={handleBulkDelete} style={{ fontSize: '12px', padding: '6px 12px' }}>Delete</button>
              </div>
            )}

            {/* Bulk Add */}
            <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Bulk Add</div>
              <textarea
                className="input"
                value={bulkSitesInput}
                onChange={e => setBulkSitesInput(e.target.value)}
                placeholder="example.com\nanother.com"
                style={{ minHeight: '60px', width: '100%', marginBottom: '8px', fontSize: '12px' }}
              />
              <button className="btn primary" onClick={handleBulkAdd} style={{ fontSize: '12px' }}>Add All</button>
            </div>

            <div className="card" style={{ padding: '8px', background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn" onClick={handleExport} style={{ fontSize: '12px' }}>{t('options.export')}</button>
                  <button className="btn" onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.json'
                    input.onchange = e => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleImport(file)
                    }
                    input.click()
                  }} style={{ fontSize: '12px' }}>{t('options.import')}</button>
                </div>
                <select
                  className="btn"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <option value="all">{t('options.allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="list" style={{ padding: '0' }}>
                {filteredSites.length === 0 ? (
                  <div className="muted" style={{ textAlign: 'center', padding: '40px' }}>{t('options.noSites')}</div>
                ) : (
                  filteredSites.map(site => (
                    <div key={site.host} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedSites.has(site.host)}
                          onChange={() => handleToggleSite(site.host)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-ai-indigo)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '1rem' }}>{site.host}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            {site.category && <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', background: 'var(--color-mizu)', padding: '2px 6px', borderRadius: '4px' }}>{site.category}</span>}
                            {site.schedule && <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', background: 'var(--color-sumi-light)', padding: '2px 6px', borderRadius: '4px' }}>📅 Schedule</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" onClick={() => handleOpenSchedule(site.host)} title={t('options.scheduleButtonTitle')}>📅</button>
                        <button className="btn" onClick={() => handleOpenConditionalRules(site.host)} title={t('options.conditionsButtonTitle')}>🔀</button>
                        <button className="btn danger" onClick={() => handleRemoveSite(site.host)}>×</button>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-stone)', marginBottom: '8px' }}>{t('stats.totalBlocks')}</span>
                <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-ai-indigo)' }}>{stats.totalBlocks}</span>
              </div>
              <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-stone)', marginBottom: '8px' }}>{t('stats.streakDays')}</span>
                <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-ai-indigo)' }}>{stats.streakDays}</span>
              </div>
              <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-stone)', marginBottom: '8px' }}>{t('stats.totalSites')}</span>
                <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-ai-indigo)' }}>{stats.totalSites}</span>
              </div>
            </div>

            <div className="h2" style={{ marginBottom: '16px' }}>{t('stats.bySite')}</div>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
              {Object.entries(stats.bySite)
                .sort(([, a], [, b]) => b.blocks - a.blocks)
                .map(([host, siteStats]) => (
                  <div key={host} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: 500 }}>{host}</div>
                    <div className="muted">{siteStats.blocks} blocks</div>
                  </div>
                ))}
            </div>
            <button className="btn danger" onClick={handleClearStats} style={{ marginTop: '24px' }}>{t('options.clearStats')}</button>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && achievements && achievementProgress && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="card" style={{ padding: '24px', background: 'white', marginBottom: '24px', borderRadius: '12px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>{achievements.unlocked.length} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length} Unlocked</div>
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((achievements.unlocked.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100)}%`, background: 'var(--color-ai-indigo)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
                const achievementType = type as AchievementType
                const progress = achievementProgress[achievementType]
                const isUnlocked = achievements.unlocked.includes(achievementType)

                return (
                  <div key={type} className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: isUnlocked ? '2px solid var(--color-gold)' : '1px solid rgba(0,0,0,0.05)', opacity: isUnlocked ? 1 : 0.7 }}>
                    <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>{def.icon}</div>
                    <div style={{ fontWeight: 600, textAlign: 'center', marginBottom: '4px' }}>{def.name}</div>
                    <div style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--color-stone)', marginBottom: '12px' }}>{def.description}</div>
                    {isUnlocked ? (
                      <div style={{ color: 'var(--color-take)', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem' }}>✓ Unlocked</div>
                    ) : (
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '999px', overflow: 'hidden', marginTop: 'auto' }}>
                        <div style={{ height: '100%', width: `${progress?.progress || 0}%`, background: 'var(--color-gold)' }} />
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
            <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="h2" style={{ marginBottom: '16px' }}>Seasonal Themes</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                {availableThemes.map(theme => (
                  <button
                    key={theme.metadata.id}
                    onClick={() => handleThemeChange(theme.metadata.id)}
                    style={{
                      padding: '16px',
                      border: currentThemeId === theme.metadata.id ? '2px solid var(--color-ai-indigo)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      background: currentThemeId === theme.metadata.id ? 'var(--color-mizu)' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: theme.colors.accent }} />
                    <span style={{ fontWeight: 500 }}>{theme.metadata.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
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
