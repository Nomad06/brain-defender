# Brain Defender - AI Assistant Documentation

## Project Overview

**Brain Defender** is a Chrome browser extension designed to help users maintain focus and attention by blocking distracting websites with motivational reminders. The extension uses Chrome's Manifest V3 architecture and provides flexible scheduling, statistics tracking, and focus session management.

**Tech Stack**: Vanilla JavaScript, Chrome Extension Manifest V3, Chrome Storage API

## Project Structure

### Core Files

#### Configuration & Constants
- **manifest.json** - Chrome extension manifest (v3) with permissions and metadata
- **consts.js** - Central constants definition (storage keys, defaults)

#### Background Service
- **service_worker.js** - Main background script that orchestrates all extension functionality
  - Loads all modules via `importScripts()`
  - Manages declarativeNetRequest rules for blocking
  - Handles focus sessions (Pomodoro-style)
  - Coordinates with conditional rules and scheduling systems

#### Storage & Data Layer
- **storage.js** - Unified module for chrome.storage operations
  - `getSites()` - Retrieves blocked sites list (supports legacy string array format and new object format)
  - `setSites(sites)` - Saves sites to chrome.storage.sync
  - Site format: `{ host, addedAt, category, schedule }`
  - Handles data normalization and migration between formats

#### Utilities & Helpers
- **utils.js** - Domain normalization utilities
  - `normalizeHost(urlStr)` - Converts URLs/domains to normalized hostname format
  - Used throughout the codebase for consistent domain handling

- **translations.js** - Translation strings for internationalization
- **i18n.js** - Internationalization system for UI text

#### Feature Modules
- **schedule.js** - Time-based blocking rules (specific hours/days)
- **conditional_rules.js** - Advanced conditional blocking logic
- **focus_sessions.js** - Pomodoro-style focus session management
- **stats.js** - Statistics tracking for blocked attempts
- **achievements.js** - Gamification system
- **categories.js** - Site categorization system
- **migration.js** - Data migration between extension versions

#### Legacy Files
- **blocked-legacy.js** - Legacy blocking implementation (being phased out)

#### UI Components
- **popup.html** / **popup.js** - Extension popup interface
  - Quick site blocking/unblocking
  - Site counter display
  - Temporary site allowance (15min, 30min, 1hr)
  - Links to options page

- **options.html** / **options.js** - Full settings page
  - Blocked sites management
  - Schedule configuration
  - Categories and conditional rules
  - Statistics dashboard

- **blocked.html** / **blocked.js** - Block notification page shown when user tries to access blocked site
  - Motivational messages
  - Temporary allowance options

- **diagnostics.html** / **diagnostics.js** - Debug/troubleshooting interface

- **styles.css** - Shared styles across all UI components

#### Assets
- **icons/** - Extension icons (16x16, 32x32, 48x48, 128x128)
- **icon.py** - Script for generating icon assets

## Key Architecture Patterns

### Module Loading Strategy
The service worker uses `importScripts()` to load modules in dependency order:
1. Constants (consts.js)
2. Translations (translations.js)
3. Core systems (stats.js, schedule.js, migration.js)
4. Utilities (utils.js)
5. Feature modules (conditional_rules.js, focus_sessions.js)

All modules include fallback error handling for failed loads.

### Data Format Evolution
The extension supports two data formats for backward compatibility:
- **Legacy format**: `["example.com", "another-site.com"]` (array of strings)
- **Current format**: `[{ host: "example.com", addedAt: 1234567890, category: null, schedule: null }]`

The storage.js module automatically migrates legacy data on read.

### Blocking Mechanism
Uses Chrome's declarativeNetRequest API (Manifest V3 requirement):
1. Service worker builds rules from blocked sites list
2. Rules are registered with `chrome.declarativeNetRequest.updateDynamicRules()`
3. Chrome blocks matching requests at network level
4. Blocked navigation triggers redirect to blocked.html

### Focus Sessions
Pomodoro-style work sessions that temporarily allow specific sites:
- `activeFocusSessionSites` - Set of allowed hosts during active session
- `focusSessionEndTime` - Session expiration timestamp
- Managed via alarms API for accurate timing

## Chrome Extension Permissions

Required permissions in manifest.json:
- `storage` - For saving blocked sites and settings (chrome.storage.sync)
- `tabs` - For detecting current tab and site blocking status
- `declarativeNetRequest` - For network-level site blocking (Manifest V3)
- `notifications` - For user notifications about blocks/focus sessions
- `webNavigation` - For detecting navigation to blocked sites
- `alarms` - For scheduling time-based features
- `http://*/*`, `https://*/*` - Host permissions for blocking all HTTP(S) sites

## Internationalization (i18n)

Supports multiple languages:
- Translation keys in translations.js
- Dynamic language detection from browser settings
- Manual language override via storage
- Used in all UI components (popup, options, blocked page)

Current languages: Russian (primary), English

## Development Guidelines

### Adding New Blocked Sites
Sites are normalized before storage:
1. Parse URL to extract hostname
2. Remove `www.` prefix
3. Convert to lowercase
4. Store with metadata (timestamp, category, schedule)

### Extending Features
When adding new modules:
1. Create standalone .js file with proper error handling
2. Add to service_worker.js import list in correct order
3. Ensure compatibility with both legacy and current data formats
4. Add i18n strings to translations.js
5. Update UI components as needed

### Testing Blocking
Use diagnostics.html for debugging:
- View current blocked sites list
- Test domain normalization
- Check active rules
- View statistics

## Common Operations

### Check if Site is Blocked
```javascript
const sites = await getSites();
const normalizedHost = normalizeHost(urlString);
const isBlocked = sites.some(s => s.host === normalizedHost);
```

### Add New Site to Block List
```javascript
const sites = await getSites();
sites.push({
  host: normalizeHost(newSite),
  addedAt: Date.now(),
  category: null,
  schedule: null
});
await setSites(sites);
// Then update declarativeNetRequest rules
```

### Temporary Site Allowance
```javascript
// Implement via conditional rules or focus session
// Duration: 15min, 30min, 1hr options
```

## File Dependencies

Critical dependency chains:
- service_worker.js → ALL modules (orchestrator)
- popup.js → storage.js, utils.js, i18n.js
- options.js → storage.js, utils.js, i18n.js, categories.js, schedule.js
- blocked.js → storage.js, utils.js, i18n.js
- All UI → consts.js (storage keys)

## Git Status

All files are currently untracked (new project initialization). No commits yet.

## Next Steps for Development

1. Add .gitignore to exclude:
   - .DS_Store
   - .cursor/
   - .idea/
   - node_modules/ (if added)
   - Build artifacts

2. Consider migrating legacy code:
   - Remove blocked-legacy.js after full migration
   - Consolidate storage format to new object-based approach

3. Documentation improvements:
   - Add JSDoc comments to all functions
   - Create user documentation
   - Add developer setup guide

## Notes for AI Assistants

- Always use `normalizeHost()` from utils.js for domain handling
- Check both string and object formats when working with site lists
- Service worker has no DOM access - use chrome.storage for state
- UI scripts have DOM but limited to their page context
- Use chrome.runtime.sendMessage() for UI ↔ service worker communication
- Test with both sync and async operations (chrome.storage.sync has quotas)
