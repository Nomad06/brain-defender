/**
 * Diagnostics Page for Brain Defender
 * Debug and troubleshooting tools
 */

import React, { useState, useEffect } from 'react'
import { messagingClient } from '../../shared/messaging/client'
import { t } from '../../shared/i18n'
import type { SiteObject } from '../../shared/storage/schemas'
import type { Stats } from '../../shared/domain/stats'

const DiagnosticsPage: React.FC = () => {
  const [sites, setSites] = useState<SiteObject[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<{ version: number; needsMigration: boolean } | null>(null)
  const [dnrRules, setDnrRules] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const loadDiagnostics = async () => {
    setLoading(true)
    try {
      const [sitesData, statsData, migrationData] = await Promise.all([
        messagingClient.getSites(),
        messagingClient.getStats(),
        messagingClient.getMigrationStatus(),
      ])
      setSites(sitesData)
      setStats(statsData)
      setMigrationStatus(migrationData)

      // Get DNR rules
      try {
        const rules = await chrome.declarativeNetRequest.getDynamicRules()
        setDnrRules(rules)
      } catch (err) {
        console.error('[Diagnostics] Error loading DNR rules:', err)
      }
    } catch (err) {
      console.error('[Diagnostics] Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunMigrations = async () => {
    if (!confirm('Run data migrations? This may take a moment.')) {
      return
    }

    try {
      const result = await messagingClient.runMigrations()
      alert(`Migrations result: ${JSON.stringify(result, null, 2)}`)
      await loadDiagnostics()
    } catch (err) {
      console.error('[Diagnostics] Error running migrations:', err)
      alert('Failed to run migrations')
    }
  }

  const handleRebuildRules = async () => {
    try {
      const success = await messagingClient.rebuildRules()
      alert(success ? 'Rules rebuilt successfully' : 'Failed to rebuild rules')
    } catch (err) {
      console.error('[Diagnostics] Error rebuilding rules:', err)
      alert('Failed to rebuild rules')
    }
  }

  const handleExportData = async () => {
    try {
      const data = await messagingClient.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `brain-defender-diagnostics-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Diagnostics] Error exporting data:', err)
      alert('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '920px', margin: '0 auto', padding: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="h1">🔧 Diagnostics</div>
          <div className="muted" style={{ marginTop: '12px', textAlign: 'center' }}>
            {t('common.loading')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '920px', margin: '0 auto', padding: '20px' }}>
      <div className="card" style={{ padding: '16px' }}>
        <div className="h1">🔧 Diagnostics & Troubleshooting</div>
        <div className="muted" style={{ marginTop: '8px' }}>Debug information and tools</div>

        <div className="space"></div>

        {/* System Info */}
        <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
          <div className="h2">System Information</div>
          <div className="space"></div>
          <table style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--mono)' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Version:</td>
                <td style={{ padding: '4px 0' }}>2.0.0</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Migration Version:</td>
                <td style={{ padding: '4px 0' }}>{migrationStatus?.version || 'Unknown'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Needs Migration:</td>
                <td style={{ padding: '4px 0' }}>
                  {migrationStatus?.needsMigration ? '⚠️ Yes' : '✅ No'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Total Sites:</td>
                <td style={{ padding: '4px 0' }}>{sites.length}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Total Blocks:</td>
                <td style={{ padding: '4px 0' }}>{stats?.totalBlocks || 0}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Streak Days:</td>
                <td style={{ padding: '4px 0' }}>{stats?.streakDays || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Blocked Sites */}
        <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
          <div className="h2">Blocked Sites ({sites.length})</div>
          <div className="space"></div>
          {sites.length === 0 ? (
            <div className="muted" style={{ textAlign: 'center', padding: '12px' }}>No sites blocked</div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {sites.map(site => (
                <div
                  key={site.host}
                  style={{
                    padding: '6px 0',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>{site.host}</div>
                  {site.category && (
                    <div className="muted" style={{ fontSize: '10px' }}>Category: {site.category}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DNR Rules */}
        <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
          <div className="h2">Active DNR Rules ({dnrRules.length})</div>
          <div className="space"></div>
          {dnrRules.length === 0 ? (
            <div className="muted" style={{ textAlign: 'center', padding: '12px' }}>No DNR rules active</div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {dnrRules.map(rule => (
                <div
                  key={rule.id}
                  style={{
                    padding: '6px 0',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div><strong>Rule ID:</strong> {rule.id}</div>
                  <div><strong>Priority:</strong> {rule.priority}</div>
                  <div><strong>Action:</strong> {rule.action.type}</div>
                  {rule.action.redirect?.extensionPath && (
                    <div className="muted">Path: {rule.action.redirect.extensionPath}</div>
                  )}
                  {rule.action.redirect?.url && (
                    <div className="muted">URL: {rule.action.redirect.url}</div>
                  )}
                  <div className="muted">Filter: {rule.condition.regexFilter}</div>
                  <div className="muted">Types: {rule.condition.resourceTypes?.join(', ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginBottom: '12px' }}>
          <div className="h2">Actions</div>
          <div className="space"></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn" onClick={handleRebuildRules}>
              🔄 Rebuild DNR Rules
            </button>
            {migrationStatus?.needsMigration && (
              <button className="btn primary" onClick={handleRunMigrations}>
                ⚡ Run Data Migrations
              </button>
            )}
            <button className="btn" onClick={handleExportData}>
              💾 Export All Data
            </button>
            <button className="btn" onClick={() => window.location.reload()}>
              🔃 Reload Page
            </button>
          </div>
        </div>

        {/* Raw Data */}
        <details>
          <summary style={{ cursor: 'pointer', padding: '12px', background: 'var(--card2)', borderRadius: '8px' }}>
            <strong>View Raw Data (JSON)</strong>
          </summary>
          <div className="card" style={{ padding: '16px', background: 'var(--card2)', marginTop: '12px' }}>
            <div className="h2">Sites</div>
            <pre style={{ fontSize: '10px', overflowX: 'auto', background: 'var(--card)', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(sites, null, 2)}
            </pre>
            <div className="space"></div>
            <div className="h2">Stats</div>
            <pre style={{ fontSize: '10px', overflowX: 'auto', background: 'var(--card)', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}

export default DiagnosticsPage
