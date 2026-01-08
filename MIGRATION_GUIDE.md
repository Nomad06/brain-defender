# Brain Defender v2.0 Migration Guide

## Overview

Brain Defender v2.0 includes a complete rewrite from vanilla JavaScript to TypeScript + React. The extension automatically migrates your data from v1.0 to v2.0 format on first load.

## What Gets Migrated

### 1. Blocked Sites

**v1.0 Format** (array of strings):
```json
[
  "example.com",
  "facebook.com",
  "youtube.com"
]
```

**v2.0 Format** (array of objects with metadata):
```json
[
  {
    "host": "example.com",
    "addedAt": 1704672000000,
    "category": null,
    "schedule": null
  },
  {
    "host": "facebook.com",
    "addedAt": 1704672000000,
    "category": null,
    "schedule": null
  }
]
```

**Migration Process**:
- Each domain string is converted to an object
- `addedAt` timestamp is set to the time of migration
- `category` and `schedule` are set to `null` (can be configured after migration)
- Duplicates are automatically removed
- Domain normalization is applied (lowercase, www. prefix removal)

### 2. Statistics

**v1.0 Format**:
```json
{
  "totalBlockedAttempts": 42,
  "siteAttempts": {
    "example.com": 10,
    "facebook.com": 32
  },
  "longestStreak": 7,
  "currentStreak": 3,
  "lastBlockedDate": 1234567890
}
```

**v2.0 Format**:
```json
{
  "totalBlocks": 42,
  "totalSites": 2,
  "streakDays": 3,
  "lastBlockDate": 1234567890,
  "bySite": {
    "example.com": {
      "blocks": 10,
      "firstBlocked": 1234567890,
      "lastBlocked": 1234567890,
      "visitsToday": 0,
      "timeSpentToday": 0,
      "lastVisitTime": null,
      "visitsByDate": {}
    }
  },
  "byDate": {}
}
```

**Migration Process**:
- `totalBlockedAttempts` → `totalBlocks`
- `currentStreak` → `streakDays`
- `siteAttempts` is converted to detailed per-site statistics
- New fields initialized with default values

### 3. Settings & Preferences

The following settings are preserved across migration:
- User language preference
- Notification settings (if present)
- Temporary whitelist entries
- Focus session state (if active)

## Migration Process

### Automatic Migration

The extension automatically runs migrations on:
1. **First install** of v2.0
2. **Extension update** from v1.0 to v2.0
3. **Chrome startup** if migration is incomplete

### Migration Steps

1. **Check migration status**
   - Extension checks `migration_version` in chrome.storage.local
   - If version < 3, migrations are triggered

2. **Run migrations**
   - **V0 → V1**: Migrate blocked sites format
   - **V1 → V2**: Migrate statistics format
   - **V2 → V3**: Initialize new features (achievements, categories)

3. **Update version**
   - Sets `migration_version` to 3
   - Creates migration lock to prevent concurrent migrations

### Migration Safety

- **Atomic**: Each migration step is atomic - either completes fully or rolls back
- **Idempotent**: Running migrations multiple times is safe
- **Non-destructive**: Original data is preserved until migration succeeds
- **Locked**: Migration lock prevents concurrent executions

## Verifying Migration

### Using Diagnostics Page

1. Open the extension
2. Click "Diagnostics" from options menu
3. Check "Migration Status" section:
   - ✅ **Version: 3** - Migration complete
   - ⚠️ **Version: 0-2** - Migration incomplete or in progress
   - ❌ **Needs Migration: true** - Migration required

### Manual Verification

Open Chrome DevTools:
```javascript
// Check migration version
chrome.storage.local.get('migration_version', (result) => {
  console.log('Migration version:', result.migration_version)
})

// Check blocked sites format
chrome.storage.sync.get('blocked_sites', (result) => {
  console.log('Sites:', result.blocked_sites)
  // Should be array of objects, not strings
})

// Check stats format
chrome.storage.local.get('block_stats', (result) => {
  console.log('Stats:', result.block_stats)
  // Should have bySite and byDate properties
})
```

## Troubleshooting

### Migration Stuck

If migration appears stuck:

1. Open Diagnostics page
2. Click "Run Migrations" button
3. Check console for error messages

### Data Loss

If data appears lost after migration:

1. **Check old storage format** - Data may still be in old format
2. **Export data** - Use "Export Data" in options to backup
3. **Re-run migration** - Click "Run Migrations" in diagnostics

### Rollback

To rollback to v1.0 (not recommended):

1. Uninstall Brain Defender v2.0
2. Install Brain Defender v1.0 from backup
3. Data in old format will still be accessible

**Warning**: Any data created in v2.0 (categories, schedules, achievements) will be lost.

## Manual Migration

If automatic migration fails, you can manually export/import:

### Export from v1.0

```javascript
// Run in console on v1.0
chrome.storage.sync.get(['blocked_sites'], (result) => {
  const blob = new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'brain-defender-v1-backup.json'
  a.click()
})
```

### Import to v2.0

1. Install v2.0
2. Open Options page
3. Go to "Sites" tab
4. Scroll to "Import/Export" section
5. Click "Import Data"
6. Select your backup file

## New Features in v2.0

After migration, you can use new features:

### Categories
Organize sites by category:
- Social Media
- Entertainment
- News
- Shopping
- Productivity

### Schedules
Block sites only during specific hours/days:
- Monday-Friday, 9am-5pm (work hours)
- Weekends only
- Specific time ranges

### Focus Sessions
Pomodoro-style work sessions:
- 25/50-minute focused work time
- Select sites to allow during session
- Break reminders

### Achievements
Gamification system:
- First Block
- Rookie (10 blocks)
- Veteran (100 blocks)
- Week Warrior (7-day streak)
- And more!

## Data Safety

### Backup Recommendations

**Before Migration**:
1. Export data from v1.0
2. Save to safe location
3. Verify export file is readable

**After Migration**:
1. Verify all sites were migrated
2. Check statistics are correct
3. Export v2.0 data as new backup

### Storage Limits

Chrome extension storage limits:
- **sync storage**: 100KB total, 8KB per item
- **local storage**: 10MB total

If you have 1000+ sites, you may hit limits. Consider:
- Using local storage instead of sync
- Removing unused sites
- Exporting to file for backup

## Support

If you encounter migration issues:

1. **Check Diagnostics** - Use built-in diagnostics page
2. **Check Console** - Look for error messages in DevTools
3. **Export Data** - Backup your data before troubleshooting
4. **File Issue** - Report bugs with:
   - Migration version
   - Console errors
   - Steps to reproduce

## Migration Changelog

### Version 3 (Current)
- Full TypeScript migration
- React UI components
- New features: categories, schedules, focus sessions, achievements
- Enhanced statistics tracking

### Version 2
- Intermediate migration step
- Statistics format update

### Version 1
- Initial migration step
- Sites format update

### Version 0 (v1.0 Legacy)
- Original vanilla JavaScript format
- Simple string arrays
- Basic statistics

---

**Last Updated**: January 8, 2026
**Extension Version**: 2.0.0
**Migration Version**: 3
