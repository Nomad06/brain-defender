/**
 * Options Page React App for Focusan
 * High-end Japanese Zen Redesign
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { messagingClient } from '../shared/messaging/client'
import { normalizeHost } from '../shared/utils/domain'
import { t, setLanguage, initI18n } from '../shared/i18n'
import { useLanguage } from '../shared/i18n/useLanguage'
import type { SiteObject } from '../shared/storage/schemas'
import {
  SamuraiShieldIcon,
  ScrollIcon,
  KatanakakeIcon,
  CalendarIcon,
  ShuffleIcon,
  XIcon,
  LeafIcon,
  LayoutIcon,
  FlameIcon,
  ShieldIcon
} from '../shared/components/Icons'
import type { Stats } from '../shared/domain/stats'
import type { AchievementsData } from '../shared/domain/achievements'
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress, type AchievementProgress, type AchievementType } from '../shared/domain/achievements'
import { type Schedule } from '../shared/domain/schedule'
import ChallengeModal from './ChallengeModal'
import ScheduleModal from './ScheduleModal'
import ConditionalRulesModal from './ConditionalRulesModal'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import type { ConditionalRule } from '../shared/domain/conditional-rules'

type Tab = 'sites' | 'stats' | 'achievements'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
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

  const [schedulingHost, setSchedulingHost] = useState<{ host: string; schedule: Schedule | null } | null>(null)
  const [conditionalRulesHost, setConditionalRulesHost] = useState<{ host: string; rules: ConditionalRule[] } | null>(null)

  // Pending action for security challenge
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'save'
    title?: string
    description?: string
    onConfirm: () => Promise<void>
  } | null>(null)


  // Reactive language hook
  const language = useLanguage()

  // Load data and language
  useEffect(() => {
    const init = async () => {
      await initI18n()
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
    setPendingAction({
      type: 'delete',
      description: t('options.deleteChallengeDescription', { host }),
      onConfirm: async () => {
        await performRemoveSites([host])
      }
    })
  }

  const performRemoveSites = async (hostsToDelete: string[]) => {
    if (hostsToDelete.length === 0) return

    try {
      for (const host of hostsToDelete) {
        await messagingClient.removeSite(host)
      }
      await loadSites()
      setSelectedSites(prev => {
        const newSet = new Set(prev)
        hostsToDelete.forEach(h => newSet.delete(h))
        return newSet
      })
    } catch (err) {
      console.error('[Options] Error removing sites:', err)
      alert(t('errors.failedToRemove'))
    } finally {
      setPendingAction(null)
    }
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

    setPendingAction({
      type: 'save',
      description: t('options.securityChallengeDescription'),
      onConfirm: async () => {
        try {
          await messagingClient.updateSite(schedulingHost.host, { schedule })
          await loadSites()
          setSchedulingHost(null)
          setPendingAction(null)
        } catch (err) {
          console.error('[Options] Error saving schedule:', err)
          alert('Failed to save schedule')
        }
      }
    })
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

    setPendingAction({
      type: 'save',
      description: t('options.securityChallengeDescription'),
      onConfirm: async () => {
        try {
          await messagingClient.updateSite(conditionalRulesHost.host, { conditionalRules: rules })
          await loadSites()
          setConditionalRulesHost(null)
          setPendingAction(null)
        } catch (err) {
          console.error('[Options] Error saving conditional rules:', err)
          alert('Failed to save conditional rules')
        }
      }
    })
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
    // setDeletingHosts is not used anymore directly, use pendingAction
    const hosts = Array.from(selectedSites)
    setPendingAction({
      type: 'delete',
      description: t('deleteChallenge.multipleDescription', { count: hosts.length }),
      onConfirm: async () => {
        await performRemoveSites(hosts)
      }
    })
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
          <div className="text-xl font-bold font-serif mb-2 text-sumi-black">{t('options.title')}</div>
          <div className="text-sumi-gray font-serif">{t('common.loading')}...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-washi flex text-sumi-black font-sans">
      {/* Floating Sidebar */}
      <aside className="w-[280px] bg-white/60 backdrop-blur-xl border-r border-border/60 flex flex-col fixed h-full z-20 shadow-[0_0_30px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-border/30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-white to-gray-50 shadow-inner border border-white/50"
          >
            <img src="/zen-circle.png" alt="Focusan Logo" className="w-12 h-12 drop-shadow-sm opacity-90" />
          </motion.div>
          <h1 className="text-2xl font-serif text-sumi-black tracking-tight mb-1">Focusan</h1>
          <span className="text-[14px] font-serif tracking-[0.25em] text-accent opacity-80">{t('options.zenFocus')}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {['sites', 'stats', 'achievements'].map((tab) => {
            const icons = {
              sites: <SamuraiShieldIcon size={24} />,
              stats: <ScrollIcon size={24} />,
              achievements: <KatanakakeIcon size={24} />,
            }
            const labels = {
              sites: t('options.blocklist'),
              stats: t('options.dashboard'),
              achievements: t('options.achievements'),
            }
            const isActive = activeTab === tab

            return (
              <div key={tab} className="relative group">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <button
                  onClick={() => setActiveTab(tab as Tab)}
                  className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive ? 'text-accent font-medium' : 'text-sumi-gray hover:text-sumi-black'
                    }`}
                >
                  <span className="text-xl opacity-90">{icons[tab as keyof typeof icons]}</span>
                  <span className="text-sm tracking-wide">{labels[tab as keyof typeof labels]}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-4 w-1.5 h-1.5 rounded-full bg-accent"
                    />
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="p-6 border-t border-border/30">
          <div className="text-center">
            <p className="font-serif text-xs text-sumi-gray/60 italic">
              {'"一期一会"'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] p-8 lg:p-12 max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-end mb-10 pb-4 border-b border-border/30">
          <div>
            <h2 className="text-3xl font-serif text-sumi-black mb-2 tracking-tight">
              {activeTab === 'sites' && t('options.blocklist')}
              {activeTab === 'stats' && t('options.dashboard')}
              {activeTab === 'achievements' && t('options.achievements')}
            </h2>
            <p className="text-sumi-gray font-sans text-sm tracking-wide opacity-80">
              {activeTab === 'sites' && t('options.subtitleSites')}
              {activeTab === 'stats' && t('options.subtitleStats')}
              {activeTab === 'achievements' && t('options.subtitleAchievements')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLang={language} onLanguageChange={handleLanguageChange} />
          </div>
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
              className="space-y-8"
            >
              <div className="washi-card p-6 border border-border/60 shadow-[var(--shadow-lg)]">
                <div className="flex gap-4 mb-6">
                  <input
                    className="flex-1 px-5 py-3 rounded-lg border border-border bg-white/50 focus:bg-white focus:border-accent outline-none transition-all shadow-inner font-mono text-sm placeholder:font-sans"
                    value={newSiteInput}
                    onChange={e => setNewSiteInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddSite()}
                    placeholder={t('options.inputPlaceholder')}
                  />
                  <button
                    className="btn primary px-8 shadow-md hover:shadow-lg transition-shadow"
                    onClick={handleAddSite}
                  >
                    {t('options.addButton')}
                  </button>
                </div>

                <div className="flex gap-4 border-t border-border/30 pt-6">
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-sm font-medium ${newSiteSchedule
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-dashed border-border text-sumi-gray hover:border-sumi-gray hover:bg-black/5'
                      }`}
                    onClick={() => setShowNewScheduleModal(true)}
                  >
                    <CalendarIcon className="w-4 h-4 opacity-70" />
                    {t('options.scheduleButtonTitle') || t('options.setSchedule')}
                    {newSiteSchedule && <span className="ml-1 text-xs bg-accent text-white px-1.5 rounded-full">✓</span>}
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-sm font-medium ${newSiteRules.length > 0
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-dashed border-border text-sumi-gray hover:border-sumi-gray hover:bg-black/5'
                      }`}
                    onClick={() => setShowNewRulesModal(true)}
                  >
                    <ShuffleIcon className="w-4 h-4 opacity-70" />
                    {t('options.conditionsButtonTitle') || t('options.setConditions')}
                    {newSiteRules.length > 0 && <span className="ml-1 text-xs bg-accent text-white px-1.5 rounded-full">{newSiteRules.length}</span>}
                  </button>
                </div>
              </div>

              {/* Selection Actions */}
              <AnimatePresence>
                {selectedSites.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-accent text-white shadow-lg sticky top-4 z-30"
                  >
                    <div className="flex items-center gap-4 px-2">
                      <span className="font-semibold text-lg">{selectedSites.size}</span>
                      <span className="text-white/80 text-sm border-l border-white/20 pl-4">{t('options.selectedItems')}</span>
                      <div className="flex gap-2 ml-2">
                        <button onClick={handleSelectAll} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors">{t('options.selectAll')}</button>
                        <button onClick={handleDeselectAll} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors">{t('options.clearSelection')}</button>
                      </div>
                    </div>
                    <button
                      onClick={handleBulkDelete}
                      className="px-6 py-2 bg-white text-accent rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      {t('options.deleteSelected')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sites List Container */}
              <div className="washi-card rounded-xl border border-border/60 shadow-[var(--shadow-lg)] overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-border/50 bg-gray-50/30">
                  <div className="flex gap-2">
                    <button onClick={() => setCategoryFilter('all')} className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${categoryFilter === 'all' ? 'bg-sumi-black text-white' : 'bg-white border border-border text-sumi-gray hover:border-sumi-gray'}`}>{t('options.allCategories')}</button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${categoryFilter === cat ? 'bg-sumi-black text-white' : 'bg-white border border-border text-sumi-gray hover:border-sumi-gray'}`}>{cat}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleExport} className="text-xs text-sumi-gray hover:text-accent font-medium px-3 py-1.5 hover:bg-accent/5 rounded transition-colors">{t('options.exportJson')}</button>
                    <button onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.json'
                      input.onchange = e => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) handleImport(file)
                      }
                      input.click()
                    }} className="text-xs text-sumi-gray hover:text-accent font-medium px-3 py-1.5 hover:bg-accent/5 rounded transition-colors">{t('options.importJson')}</button>
                  </div>
                </div>

                <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredSites.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="flex justify-center mb-3">
                        <LeafIcon size={48} className="text-sumi-gray/20" />
                      </div>
                      <div className="text-sumi-gray opacity-60 font-serif">{t('options.emptyList')}</div>
                    </div>
                  ) : (
                    filteredSites.map((site) => (
                      <motion.div
                        layout
                        variants={itemVariants}
                        key={site.host}
                        className={`flex justify-between items-center p-5 hover:bg-white/60 transition-colors group ${selectedSites.has(site.host) ? 'bg-accent/5' : ''}`}
                      >
                        <div className="flex items-center gap-5">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedSites.has(site.host)}
                              onChange={() => handleToggleSite(site.host)}
                              className="w-5 h-5 appearance-none rounded border border-border checked:bg-accent checked:border-accent transition-all cursor-pointer z-10"
                            />
                            {selectedSites.has(site.host) && <div className="absolute pointer-events-none z-10 flex items-center justify-center"><XIcon size={12} className="text-white rotate-45" strokeWidth={3} /></div>}
                          </div>

                          <div>
                            <div className="font-medium text-base text-sumi-black font-mono tracking-tight group-hover:text-accent transition-colors">
                              {site.host}
                            </div>
                            <div className="flex gap-2 mt-2">
                              {site.category && (
                                <span className="text-[9px] uppercase tracking-widest text-white bg-sumi-gray/40 px-2 py-0.5 rounded-sm font-bold">{site.category}</span>
                              )}
                              {site.schedule && (
                                <span className="text-[9px] uppercase tracking-widest text-accent border border-accent/20 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
                                  <CalendarIcon size={10} /> {t('options.scheduleLabel')}
                                </span>
                              )}
                              {site.conditionalRules && site.conditionalRules.length > 0 && (
                                <span className="text-[9px] uppercase tracking-widest text-accent border border-accent/20 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
                                  <ShuffleIcon size={10} /> {t('options.conditionsLabel')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                          <button
                            onClick={() => handleOpenSchedule(site.host)}
                            title="Schedule"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent/10 hover:text-accent text-sumi-gray transition-colors"
                          ><CalendarIcon size={16} /></button>
                          <button
                            onClick={() => handleOpenConditionalRules(site.host)}
                            title="Rules"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent/10 hover:text-accent text-sumi-gray transition-colors"
                          ><ShuffleIcon size={16} /></button>
                          <div className="w-px h-4 bg-border mx-1"></div>
                          <button
                            onClick={() => handleRemoveSite(site.host)}
                            title="Delete"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger hover:text-white text-danger transition-colors"
                          ><XIcon size={16} /></button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Bulk Add Section (Bottom) */}
                <div className="bg-gray-50/50 p-6 border-t border-border/50">
                  <div className="text-xs font-bold uppercase tracking-widest text-sumi-gray mb-3">{t('options.bulkAdd')}</div>
                  <div className="flex gap-3">
                    <textarea
                      className="flex-1 min-h-[40px] max-h-[100px] p-3 rounded-lg border border-border bg-white text-sm font-mono focus:border-accent outline-none transition-all resize-y"
                      value={bulkSitesInput}
                      onChange={e => setBulkSitesInput(e.target.value)}
                      placeholder={t('options.pasteDomains')}
                    />
                    <button
                      onClick={handleBulkAdd}
                      className="btn secondary h-auto px-6 whitespace-nowrap text-xs font-bold uppercase tracking-widest"
                    >
                      {t('options.addList')}
                    </button>
                  </div>
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
                  { label: t('stats.totalBlocks'), value: stats.totalBlocks, icon: <ShieldIcon size={48} strokeWidth={1} /> },
                  { label: t('stats.streakDays'), value: stats.streakDays, icon: <FlameIcon size={48} strokeWidth={1} /> },
                  { label: t('stats.totalSites'), value: stats.totalSites, icon: <LayoutIcon size={48} strokeWidth={1} /> }
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="washi-card p-8 border border-border/60 flex flex-col items-center justify-center relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50 z-0"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-5xl font-light text-sumi-black mb-4 group-hover:scale-110 transition-transform duration-500 font-mono tracking-tighter">
                        {stat.value}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-sumi-gray group-hover:text-accent transition-colors">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add charts here in future updates */}

              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-lg font-serif font-bold text-sumi-black">{t('options.mostBlocked')}</h3>
                </div>
                <div className="washi-card border border-border/60 overflow-hidden">
                  {Object.entries(stats.bySite)
                    .sort(([, a], [, b]) => b.blocks - a.blocks)
                    .slice(0, 10)
                    .map(([host, siteStats], index) => (
                      <motion.div
                        variants={itemVariants}
                        key={host}
                        className="flex justify-between items-center p-5 border-b border-border/40 last:border-none hover:bg-white/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-sumi-gray w-6 text-center">{index + 1}</span>
                          <div className="font-medium text-sumi-black font-mono text-base">{host}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${Math.min(100, (siteStats.blocks / (stats.totalBlocks || 1)) * 100)}%` }}></div>
                          </div>
                          <span className="text-accent font-bold text-sm w-12 text-right">{siteStats.blocks}</span>
                        </div>
                      </motion.div>
                    ))}
                  {Object.keys(stats.bySite).length === 0 && (
                    <div className="p-8 text-center text-sumi-gray italic">{t('options.noData')}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button
                  onClick={handleClearStats}
                  className="text-xs text-danger hover:text-red-700 hover:underline underline-offset-4 transition-all opacity-60 hover:opacity-100"
                >
                  {t('options.clearStats')}
                </button>
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
              <div className="washi-card p-10 border border-border/60 text-center relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="text-6xl font-serif text-sumi-black mb-2">
                    {achievements.unlocked.length} <span className="text-2xl text-sumi-gray font-sans opacity-50">/ {Object.keys(ACHIEVEMENT_DEFINITIONS).length}</span>
                  </div>
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-accent mb-8">{t('options.unlockedAchievements')}</div>

                  <div className="w-full max-w-md h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((achievements.unlocked.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
                  const achievementType = type as AchievementType
                  const progress = achievementProgress[achievementType]
                  const isUnlocked = achievements.unlocked.includes(achievementType)

                  return (
                    <motion.div
                      variants={itemVariants}
                      key={type}
                      className={`washi-card p-6 border transition-all duration-300 relative group overflow-hidden h-full flex flex-col ${isUnlocked
                        ? 'border-gold/50 shadow-[0_4px_20px_rgba(212,175,55,0.15)] bg-gradient-to-br from-white to-gold/5'
                        : 'border-border/60 opacity-70 grayscale hover:grayscale-0 hover:opacity-100'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-4xl filter drop-shadow-sm">{def.icon}</span>
                        {isUnlocked && <span className="text-gold text-xs font-bold border border-gold rounded px-2 py-0.5 ml-2">{t('achievements.unlocked').toUpperCase()}</span>}
                      </div>

                      <h4 className="font-serif font-bold text-lg text-sumi-black mb-1 group-hover:text-accent transition-colors">{def.name}</h4>
                      <p className="text-sm text-sumi-gray leading-relaxed mb-4 flex-1">{def.description}</p>

                      {!isUnlocked && (
                        <div className="mt-auto pt-4 border-t border-dashed border-border/50">
                          <div className="flex justify-between text-xs text-sumi-gray mb-1">
                            <span>{t('options.progress')}</span>
                            <span className="font-mono">{Math.round(progress?.progress || 0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-accent"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress?.progress || 0}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
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

        {pendingAction && (
          <ChallengeModal
            key="challenge-modal"
            actionType={pendingAction.type}
            title={pendingAction.title}
            description={pendingAction.description}
            onConfirm={pendingAction.onConfirm}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
