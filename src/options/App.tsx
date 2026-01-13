/**
 * Options Page React App for Focusan
 * Full settings and management interface with Japanese aesthetics
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
}

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
  const [deletingHosts, setDeletingHosts] = useState<string[]>([])
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
      await initI18n()
      const themes = getAllThemes()
      setAvailableThemes(themes)
      const themeId = await getCurrentThemeId()
      setCurrentThemeId(themeId)
      const theme = await getCurrentTheme()
      setCurrentTheme(theme)
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

  const handleThemeChange = async (themeId: string) => {
    const success = await switchTheme(themeId)
    if (success) {
      setCurrentThemeId(themeId)
      const theme = await getCurrentTheme()
      setCurrentTheme(theme)
    }
  }

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

  const handleRemoveSite = (host: string) => {
    setDeletingHosts([host])
  }

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

  const cancelRemoveSites = () => {
    setDeletingHosts([])
  }

  const handleOpenSchedule = (host: string) => {
    const site = sites.find(s => s.host === host)
    setSchedulingHost({
      host,
      schedule: (site?.schedule as Schedule) || null,
    })
  }

  const handleSaveSchedule = async (schedule: Schedule | null) => {
    if (!schedulingHost) return

    try {
      await messagingClient.updateSite(schedulingHost.host, { schedule })
      await loadSites()
      setSchedulingHost(null)
    } catch (err) {
      console.error('[Options] Error saving schedule:', err)
      alert('Failed to save schedule')
    }
  }

  const handleCancelSchedule = () => {
    setSchedulingHost(null)
  }

  const handleOpenConditionalRules = (host: string) => {
    const site = sites.find(s => s.host === host)
    setConditionalRulesHost({
      host,
      rules: (site?.conditionalRules as ConditionalRule[]) || [],
    })
  }

  const handleSaveConditionalRules = async (rules: ConditionalRule[]) => {
    if (!conditionalRulesHost) return

    try {
      await messagingClient.updateSite(conditionalRulesHost.host, { conditionalRules: rules })
      await loadSites()
      setConditionalRulesHost(null)
    } catch (err) {
      console.error('[Options] Error saving conditional rules:', err)
      alert('Failed to save conditional rules')
    }
  }

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

  const handleSelectAll = () => {
    const filteredSites = getFilteredSites()
    setSelectedSites(new Set(filteredSites.map(s => s.host)))
  }

  const handleDeselectAll = () => {
    setSelectedSites(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedSites.size === 0) return
    setDeletingHosts(Array.from(selectedSites))
  }

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

  const handleLanguageChange = async (lang: string) => {
    try {
      await setLanguage(lang as 'ru' | 'en')
    } catch (err) {
      console.error('[Options] Error changing language:', err)
    }
  }

  const getFilteredSites = (): SiteObject[] => {
    if (categoryFilter === 'all') {
      return sites
    }
    return sites.filter(s => s.category === categoryFilter)
  }

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
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold font-serif mb-2">{t('options.title')}</div>
          <div className="text-sumi-gray">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-washi flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/60 backdrop-blur-md border-r border-border flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 flex flex-col items-center border-b border-border/50">
          <motion.img
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            src="/logo.svg"
            alt="Focusan Logo"
            className="w-16 h-16 drop-shadow-md mb-3"
          />
          <h1 className={`text-xl font-bold text-sumi-black ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
            {currentTheme?.metadata.name || 'Focusan'}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
              <motion.button
                key={tab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => setActiveTab(tab as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                  ? 'bg-accent/10 text-accent font-semibold shadow-sm'
                  : 'text-sumi-gray hover:bg-black/5 hover:text-sumi-black'
                  }`}
              >
                <span className="text-lg">{icons[tab as keyof typeof icons]}</span>
                <span>{labels[tab as keyof typeof labels]}</span>
              </motion.button>
            )
          })}
        </nav>

        <div className={`p-6 text-center text-xs text-sumi-gray border-t border-border/50 ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : ''}`}>
          {currentTheme?.metadata.id === 'japanese' ? '一期一会' : 'One thing at a time'}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header Area */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-bold text-sumi-black mb-1 ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : ''}`}>
              {activeTab === 'sites' && t('options.blocklist')}
              {activeTab === 'stats' && t('options.dashboard')}
              {activeTab === 'achievements' && t('options.achievements')}
              {activeTab === 'appearance' && t('options.appearance')}
            </h2>
            <p className={`text-sumi-gray ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : ''}`}>
              {activeTab === 'sites' && (currentTheme?.metadata.id === 'japanese' ? '心を乱すサイト' : 'Sites that disturb your peace')}
              {activeTab === 'stats' && (currentTheme?.metadata.id === 'japanese' ? '集中の道' : 'Your journey of focus')}
              {activeTab === 'achievements' && (currentTheme?.metadata.id === 'japanese' ? '道の節目' : 'Milestones on your path')}
              {activeTab === 'appearance' && (currentTheme?.metadata.id === 'japanese' ? '外観の設定' : 'Customize your experience')}
            </p>
          </div>
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="px-4 py-2 rounded-full border border-border bg-white text-sm focus:border-accent outline-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
          >
            <option value="ru">🇷🇺 {t('options.languageRu')}</option>
            <option value="en">🇬🇧 {t('options.languageEn')}</option>
          </select>
        </div>

        <AnimatePresence mode="wait">
          {/* Sites Tab */}
          {activeTab === 'sites' && (
            <motion.div
              key="sites"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-xl border border-border shadow-sm">
                <div className="flex gap-3 mb-4">
                  <input
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-white focus:border-accent outline-none transition-all shadow-sm"
                    value={newSiteInput}
                    onChange={e => setNewSiteInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                    placeholder={t('options.inputPlaceholder')}
                  />
                  <button
                    className="btn primary px-8"
                    onClick={handleAddSite}
                  >
                    {t('options.addButton')}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${newSiteSchedule
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-sumi-gray hover:bg-black/5'
                      }`}
                    onClick={() => setShowNewScheduleModal(true)}
                  >
                    <span>📅</span>
                    {t('options.scheduleButtonTitle') || 'Schedule'}
                    {newSiteSchedule && <span className="text-xs">✓</span>}
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${newSiteRules.length > 0
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-sumi-gray hover:bg-black/5'
                      }`}
                    onClick={() => setShowNewRulesModal(true)}
                  >
                    <span>🔀</span>
                    {t('options.conditionsButtonTitle') || 'Conditions'}
                    {newSiteRules.length > 0 && <span className="text-xs">({newSiteRules.length})</span>}
                  </button>
                </div>
              </div>

              {/* Selection Bar */}
              {selectedSites.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/80 backdrop-blur-md border border-border shadow-sm sticky top-4 z-20"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-semibold">
                      {selectedSites.size} selected
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-sumi-gray hover:text-sumi-black px-3 py-1 rounded hover:bg-black/5 transition-colors"
                    >All</button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-sumi-gray hover:text-sumi-black px-3 py-1 rounded hover:bg-black/5 transition-colors"
                    >None</button>
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="btn danger text-sm px-4 py-1.5"
                  >Delete</button>
                </motion.div>
              )}

              {/* Bulk Add */}
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-xl border border-border shadow-sm">
                <div className="font-semibold mb-3 text-sumi-black text-sm">Bulk Add</div>
                <textarea
                  className="w-full min-h-[80px] mb-3 text-sm font-mono p-3 rounded-lg bg-white/90 border border-border focus:border-accent outline-none transition-all"
                  value={bulkSitesInput}
                  onChange={e => setBulkSitesInput(e.target.value)}
                  placeholder="example.com&#10;another.com"
                />
                <button
                  onClick={handleBulkAdd}
                  className="btn bg-accent/10 text-accent border border-accent hover:bg-accent hover:text-white rounded-full px-6 py-1.5 text-sm font-semibold transition-all"
                >Add All</button>
              </div>

              {/* Sites List */}
              <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-border bg-white/40">
                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      className="px-3 py-1.5 text-sm rounded border border-border text-sumi-gray hover:bg-white hover:text-sumi-black transition-colors"
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
                      className="px-3 py-1.5 text-sm rounded border border-border text-sumi-gray hover:bg-white hover:text-sumi-black transition-colors"
                    >{t('options.import')}</button>
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-full border border-border bg-white/50 focus:border-accent outline-none"
                  >
                    <option value="all">{t('options.allCategories')}</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="divide-y divide-border/50">
                  {filteredSites.length === 0 ? (
                    <div className={`text-center py-16 px-6 text-sumi-gray/70 text-base ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
                      {t('options.noSites')}
                    </div>
                  ) : (
                    filteredSites.map((site) => (
                      <motion.div
                        variants={itemVariants}
                        key={site.host}
                        className="flex justify-between items-center p-5 hover:bg-white/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedSites.has(site.host)}
                            onChange={() => handleToggleSite(site.host)}
                            className="w-5 h-5 accent-accent cursor-pointer rounded border-gray-300"
                          />
                          <div>
                            <div className="font-medium text-base text-sumi-black font-mono">
                              {site.host}
                            </div>
                            <div className="flex gap-2 mt-1.5">
                              {site.category && (
                                <span className="text-[10px] uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full font-bold">{site.category}</span>
                              )}
                              {site.schedule && (
                                <span className="text-[10px] uppercase tracking-wider text-sumi-gray bg-black/5 px-2.5 py-0.5 rounded-full font-bold">📅 Schedule</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenSchedule(site.host)}
                            title={t('options.scheduleButtonTitle')}
                            className="p-2 rounded hover:bg-black/5 text-sumi-gray transition-colors"
                          >📅</button>
                          <button
                            onClick={() => handleOpenConditionalRules(site.host)}
                            title={t('options.conditionsButtonTitle')}
                            className="p-2 rounded hover:bg-black/5 text-sumi-gray transition-colors"
                          >🔀</button>
                          <button
                            onClick={() => handleRemoveSite(site.host)}
                            title={t('common.delete')}
                            className="p-2 rounded hover:bg-danger hover:text-white text-danger transition-colors"
                          >✕</button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <motion.div
              key="stats"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: t('stats.totalBlocks'), value: stats.totalBlocks, emoji: '🛡️' },
                  { label: t('stats.streakDays'), value: stats.streakDays, emoji: '🔥' },
                  { label: t('stats.totalSites'), value: stats.totalSites, emoji: '📊' }
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-md p-8 rounded-xl border border-border shadow-sm text-center transform transition-transform hover:-translate-y-1"
                  >
                    <div className="text-4xl mb-3">{stat.emoji}</div>
                    <div className="text-sm text-sumi-gray mb-2 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className={`text-4xl font-bold text-accent ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div>
                <h3 className={`text-xl font-semibold mb-5 text-sumi-black ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
                  {t('stats.bySite')}
                </h3>
                <div className="bg-white/60 backdrop-blur-md rounded-xl border border-border shadow-sm overflow-hidden">
                  {Object.entries(stats.bySite)
                    .sort(([, a], [, b]) => b.blocks - a.blocks)
                    .map(([host, siteStats]) => (
                      <motion.div
                        variants={itemVariants}
                        key={host}
                        className="flex justify-between p-5 border-b border-border/50 last:border-none hover:bg-white/50 transition-colors"
                      >
                        <div className="font-medium text-sumi-black font-mono text-base">{host}</div>
                        <div className="text-accent font-semibold text-sm">{siteStats.blocks} blocks</div>
                      </motion.div>
                    ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleClearStats}
                  className="btn danger px-8 py-3 rounded-full font-semibold shadow-sm"
                >{t('options.clearStats')}</button>
              </div>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && achievements && achievementProgress && (
            <motion.div
              key="achievements"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              <div className="bg-white/60 backdrop-blur-md p-8 rounded-xl border border-border shadow-sm">
                <div className={`text-2xl font-bold mb-4 text-sumi-black ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
                  {achievements.unlocked.length} / {Object.keys(ACHIEVEMENT_DEFINITIONS).length} Unlocked
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((achievements.unlocked.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
                  const achievementType = type as AchievementType
                  const progress = achievementProgress[achievementType]
                  const isUnlocked = achievements.unlocked.includes(achievementType)

                  return (
                    <motion.div
                      variants={itemVariants}
                      key={type}
                      className={`bg-white/60 backdrop-blur-md p-7 rounded-xl transition-all duration-300 ${isUnlocked
                        ? 'border-2 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                        : 'border border-border grayscale opacity-80 bg-gray-50/50'
                        }`}
                    >
                      <div className="text-5xl text-center mb-4">{def.icon}</div>
                      <div className="font-semibold text-center mb-2 text-lg text-sumi-black">
                        {def.name}
                      </div>
                      <div className="text-sm text-center text-sumi-gray mb-4 leading-relaxed">
                        {def.description}
                      </div>
                      {isUnlocked ? (
                        <div className="text-gold text-center font-bold text-sm bg-gold/10 p-2 rounded-full border border-gold/20">
                          ✓ Unlocked
                        </div>
                      ) : (
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-auto">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent to-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress?.progress || 0}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="bg-white/60 backdrop-blur-md p-8 rounded-xl border border-border shadow-sm">
                <div className={`text-xl font-semibold mb-6 text-sumi-black ${currentTheme?.metadata.id === 'japanese' ? 'font-serif' : 'font-sans'}`}>
                  Seasonal Themes
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {availableThemes.map((theme) => (
                    <motion.button
                      variants={itemVariants}
                      key={theme.metadata.id}
                      onClick={() => handleThemeChange(theme.metadata.id)}
                      className={`p-6 rounded-2xl backdrop-blur-md cursor-pointer flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${currentThemeId === theme.metadata.id
                        ? 'border-2 border-accent bg-accent/10'
                        : 'border border-border bg-white/40 hover:bg-white/80'
                        }`}
                    >
                      <div className="w-12 h-12 rounded-full shadow-lg" style={{ background: theme.colors.accent }} />
                      <div>
                        <div className="text-2xl mb-1 text-center">{theme.metadata.emoji}</div>
                        <div className="font-semibold text-base text-sumi-black text-center">
                          {theme.metadata.name}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showNewScheduleModal && (
          <ScheduleModal
            key="schedule-modal"
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
            key="rules-modal"
            host={newSiteInput || 'New Site'}
            initialRules={newSiteRules}
            onSave={(rules) => {
              setNewSiteRules(rules)
              setShowNewRulesModal(false)
            }}
            onClose={() => setShowNewRulesModal(false)}
          />
        )}

        {deletingHosts.length > 0 && (
          <DeleteChallengeModal
            key="delete-modal"
            hosts={deletingHosts}
            onConfirm={confirmRemoveSites}
            onCancel={cancelRemoveSites}
          />
        )}

        {schedulingHost && (
          <ScheduleModal
            key="edit-schedule-modal"
            host={schedulingHost.host}
            initialSchedule={schedulingHost.schedule}
            onSave={handleSaveSchedule}
            onCancel={handleCancelSchedule}
          />
        )}

        {conditionalRulesHost && (
          <ConditionalRulesModal
            key="edit-rules-modal"
            host={conditionalRulesHost.host}
            initialRules={conditionalRulesHost.rules}
            onSave={handleSaveConditionalRules}
            onClose={() => setConditionalRulesHost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
