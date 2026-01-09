/**
 * Options Page React App for Brain Defender
 * Full settings and management interface
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

type Tab = 'sites' | 'stats' | 'achievements'

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

  // Load data and language
  useEffect(() => {
    const init = async () => {
      // Initialize i18n first
      await initI18n()
      const currentLang = getCurrentLanguage()
      setLanguageState(currentLang)
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
    <div className="container" style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="h1">{t('options.title')}</div>
            <div className="h2" style={{ fontSize: '14px', color: 'var(--muted)' }}>
              {t('options.subtitle')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kbd">{sites.length}</div>
            <select
              className="btn"
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="ru">{t('options.languageRu')}</option>
              <option value="en">{t('options.languageEn')}</option>
            </select>
          </div>
        </div>

        <div className="space"></div>

        {/* Add Site Section */}
        <div className="card" style={{ padding: '16px', background: 'var(--card2)' }}>
          <div className="h2">{t('options.manualAdd')}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              value={newSiteInput}
              onChange={e => setNewSiteInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddSite()}
              placeholder={t('options.inputPlaceholder')}
              style={{ flex: 1 }}
            />
            <button className="btn primary" onClick={handleAddSite}>
              {t('options.addButton')}
            </button>
          </div>
          <div className="space"></div>
          <button className="btn" onClick={handleAddCurrentSite}>
            ➕ {t('options.addCurrent')}
          </button>
          <div className="space"></div>
          <div className="muted" style={{ fontSize: '12px' }}>
            {t('options.normalizationHint')}
          </div>
        </div>

        <div className="space"></div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <button
            className="btn"
            onClick={() => setActiveTab('sites')}
            style={{
              borderRadius: 0,
              borderBottom: `2px solid ${activeTab === 'sites' ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            {t('options.tabSites')}
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('stats')}
            style={{
              borderRadius: 0,
              borderBottom: `2px solid ${activeTab === 'stats' ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            {t('options.tabStats')}
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('achievements')}
            style={{
              borderRadius: 0,
              borderBottom: `2px solid ${activeTab === 'achievements' ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            {t('options.tabAchievements')}
          </button>
        </div>

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="h2">{t('options.currentList')}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                <button className="btn" onClick={handleExport}>
                  {t('options.export')}
                </button>
                <button
                  className="btn"
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
                >
                  {t('options.import')}
                </button>
              </div>
            </div>

            {/* Selection Bar */}
            {selectedSites.size > 0 && (
              <div className="card" style={{ padding: '12px', background: 'var(--card2)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="kbd">{selectedSites.size} {t('options.selected')}</span>
                    <button className="btn" onClick={handleSelectAll} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      {t('options.selectAll')}
                    </button>
                    <button className="btn" onClick={handleDeselectAll} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      {t('options.deselectAll')}
                    </button>
                  </div>
                  <button className="btn danger" onClick={handleBulkDelete} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    {t('options.deleteSelected')}
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Add Section */}
            <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
              <div className="h2">{t('options.bulkAdd')}</div>
              <div className="space"></div>
              <textarea
                className="input"
                value={bulkSitesInput}
                onChange={e => setBulkSitesInput(e.target.value)}
                placeholder={t('options.bulkAddPlaceholder')}
                style={{ minHeight: '100px', fontFamily: 'var(--mono)', fontSize: '12px', resize: 'vertical', width: '100%' }}
              />
              <div className="space"></div>
              <button className="btn primary" onClick={handleBulkAdd}>
                {t('options.addAll')}
              </button>
            </div>

            <div className="space"></div>

            {/* Sites List */}
            <div className="list">
              {filteredSites.length === 0 ? (
                <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
                  {t('options.noSites')}
                </div>
              ) : (
                filteredSites.map(site => (
                  <div
                    key={site.host}
                    className="card"
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedSites.has(site.host)}
                        onChange={() => handleToggleSite(site.host)}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{site.host}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                          {site.category && (
                            <span className="muted" style={{ fontSize: '11px' }}>
                              {site.category}
                            </span>
                          )}
                          {site.schedule && (
                            <span className="kbd" style={{ fontSize: '10px', padding: '2px 6px' }}>
                              📅 {t('options.scheduleLabel')}
                            </span>
                          )}
                          {site.conditionalRules && site.conditionalRules.length > 0 && (
                            <span className="kbd" style={{ fontSize: '10px', padding: '2px 6px' }}>
                              🔀 {t('options.conditionsLabel')} ({site.conditionalRules.length})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn"
                        onClick={() => handleOpenSchedule(site.host)}
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                        title={t('options.scheduleButtonTitle')}
                      >
                        📅
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleOpenConditionalRules(site.host)}
                        style={{ fontSize: '11px', padding: '6px 10px' }}
                        title={t('options.conditionsButtonTitle')}
                      >
                        🔀
                      </button>
                      <button className="btn danger" onClick={() => handleRemoveSite(site.host)} style={{ fontSize: '12px' }}>
                        {t('common.remove')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div>
            <div className="card" style={{ padding: '16px', background: 'var(--card2)' }}>
              <div className="h2">{t('options.overallStats')}</div>
              <div className="space"></div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="card" style={{ padding: '16px', flex: 1, minWidth: '150px' }}>
                  <div className="muted">{t('stats.totalBlocks')}</div>
                  <div className="h1">{stats.totalBlocks}</div>
                </div>
                <div className="card" style={{ padding: '16px', flex: 1, minWidth: '150px' }}>
                  <div className="muted">{t('stats.streakDays')}</div>
                  <div className="h1">{stats.streakDays}</div>
                </div>
                <div className="card" style={{ padding: '16px', flex: 1, minWidth: '150px' }}>
                  <div className="muted">{t('stats.totalSites')}</div>
                  <div className="h1">{stats.totalSites}</div>
                </div>
              </div>
            </div>

            <div className="space"></div>

            <div className="h2">{t('stats.bySite')}</div>
            <div className="space"></div>
            <div className="list">
              {Object.entries(stats.bySite)
                .sort(([, a], [, b]) => b.blocks - a.blocks)
                .map(([host, siteStats]) => (
                  <div key={host} className="card" style={{ padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{host}</div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {t('stats.blocks')}: {siteStats.blocks}
                    </div>
                  </div>
                ))}
            </div>

            <div className="space"></div>
            <button className="btn danger" onClick={handleClearStats}>
              {t('options.clearStats')}
            </button>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && achievements && achievementProgress && (
          <div>
            {/* Progress Summary */}
            <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '16px' }}>
              <div className="h1">{achievements.unlocked.length} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length}</div>
              <div className="muted">{t('options.achievementsUnlocked')}</div>
              <div className="space"></div>
              <div style={{ height: '12px', background: 'var(--card)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((achievements.unlocked.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100)}%`,
                    background: 'var(--accent)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Achievements Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
                const achievementType = type as AchievementType
                const progress = achievementProgress[achievementType]
                const isUnlocked = achievements.unlocked.includes(achievementType)

                return (
                  <div
                    key={type}
                    className="card"
                    style={{
                      padding: '16px',
                      opacity: isUnlocked ? 1 : 0.6,
                      border: isUnlocked ? '2px solid var(--accent)' : '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>
                      {def.icon}
                    </div>
                    <div style={{ fontWeight: '600', textAlign: 'center', marginBottom: '4px' }}>
                      {def.name}
                    </div>
                    <div className="muted" style={{ fontSize: '11px', textAlign: 'center', marginBottom: '8px' }}>
                      {def.description}
                    </div>
                    {isUnlocked ? (
                      <div
                        style={{
                          color: 'var(--accent)',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        ✓ {t('options.unlocked')}
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            height: '6px',
                            background: 'var(--card2)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginTop: '8px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${progress?.progress || 0}%`,
                              background: 'var(--accent)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        {progress && 'current' in progress && 'target' in progress && (
                          <div className="muted" style={{ fontSize: '10px', textAlign: 'center', marginTop: '4px' }}>
                            {progress.current} / {progress.target}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deletion Challenge Modal */}
      {deletingHosts.length > 0 && (
        <DeleteChallengeModal hosts={deletingHosts} onConfirm={confirmRemoveSites} onCancel={cancelRemoveSites} />
      )}

      {/* Schedule Modal */}
      {schedulingHost && (
        <ScheduleModal
          host={schedulingHost.host}
          initialSchedule={schedulingHost.schedule}
          onSave={handleSaveSchedule}
          onCancel={handleCancelSchedule}
        />
      )}

      {/* Conditional Rules Modal */}
      {conditionalRulesHost && (
        <ConditionalRulesModal
          host={conditionalRulesHost.host}
          initialRules={conditionalRulesHost.rules}
          onSave={handleSaveConditionalRules}
          onClose={() => setConditionalRulesHost(null)}
        />
      )}
    </div>
  )
}

export default App
