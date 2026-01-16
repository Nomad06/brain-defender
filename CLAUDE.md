# Focusan - AI Assistant Documentation

## Application Overview

**Focusan** is a Chrome browser extension designed to help users maintain focus and attention by blocking distracting websites with motivational reminders. The extension uses Chrome's Manifest V3 architecture and provides flexible scheduling, statistics tracking, and focus session management.

**Tech Stack**: TypeScript, React, Chrome Extension Manifest V3, Vite, Zod

## Project Structure

### Source Code (`src/`)

#### Background Service (`src/background/`)
- **index.ts** - Main background service worker entry point
  - Coordinates all extension functionality
  - Handles tab navigation and blocking
  - Manages alarms and focus sessions
- **dnr-manager.ts** - Declarative Net Request (DNR) rules manager
  - Builds blocking rules from sites and focus sessions
  - Updates Chrome's declarativeNetRequest API
- **handlers.ts** - Message handlers for communication with UI
- **alarms.ts** - Alarm system for scheduled tasks

#### Shared Domain Logic (`src/shared/domain/`)
- **focus-sessions.ts** - Pomodoro-style focus session management
- **schedule.ts** - Time-based blocking rules
- **conditional-rules.ts** - Advanced conditional blocking logic
- **stats.ts** - Statistics tracking for blocked attempts
- **achievements.ts** - Gamification system
- **categories.ts** - Site categorization system

#### Storage Layer (`src/shared/storage/`)
- **storage.ts** - Unified storage abstraction with type-safe operations
- **schemas.ts** - Zod schemas for runtime validation
- **migrations.ts** - Data migration system for version updates

#### Utilities (`src/shared/utils/`)
- **domain.ts** - Domain normalization utilities
  - `normalizeHost()` - Converts URLs to normalized hostname format
  - `hostToRegex()` - Generates regex patterns for DNR rules

#### Messaging System (`src/shared/messaging/`)
- **contracts.ts** - Type-safe message contracts
- **client.ts** - Client for sending messages to background

#### Internationalization (`src/shared/i18n/`)
- **translations.ts** - Translation strings
- **index.ts** - i18n system for UI text

#### UI Components
- **src/popup/** - Extension popup (React)
  - Quick site blocking/unblocking
  - Focus session controls
  - Site counter display

- **src/options/** - Settings page (React)
  - Blocked sites management
  - Schedule configuration
  - Categories and conditional rules
  - Statistics dashboard

- **src/pages/blocked/** - Block notification page (React)
  - Motivational messages
  - Temporary allowance options

- **src/pages/diagnostics/** - Debug/troubleshooting interface (React)

#### Configuration
- **public/manifest.json** - Chrome extension manifest (source)
- **vite.config.ts** - Vite build configuration
- **tsconfig.json** - TypeScript configuration
- **styles.css** - Global styles

#### Assets
- **icons/** - Extension icons (16x16, 32x32, 48x48, 128x128)

## Key Architecture Patterns

### Modern TypeScript Stack
- **TypeScript** - Full type safety across the codebase
- **Zod** - Runtime validation for storage data
- **React** - Modern UI components
- **Vite** - Fast build system with HMR
- **ES Modules** - Service worker uses modern module syntax

### Data Format
Sites are stored as structured objects:
- **Format**: `[{ host: "example.com", addedAt: 1234567890, category: null, schedule: null }]`

The storage.ts module provides type-safe access to all site data.

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
1. Create standalone TypeScript file with proper error handling
2. Ensure proper type definitions and validation
3. Add i18n strings to translations system
4. Update UI components as needed
5. Test with the build system

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

2. Documentation improvements:
   - Add JSDoc comments to all functions
   - Create user documentation
   - Add developer setup guide

## Notes for AI Assistants

- Always use `normalizeHost()` from utils for domain handling
- All sites are stored as typed objects with full metadata
- Service worker has no DOM access - use browser.storage for state
- UI scripts have DOM but limited to their page context
- Use browser.runtime.sendMessage() for UI ↔ service worker communication
- Test with both sync and async operations (browser.storage.sync has quotas)
- Use TypeScript for type safety and better developer experience


# Do / Don’t
## Do
- Keep rule IDs stable and deterministic
- Validate user input (domains/patterns) before applying
- Write small tests for rule generation and settings migrations
- Prefer minimal changes per PR

## Don’t
- Don’t modify manifest permissions without a clear reason
- Don’t call chrome.declarativeNetRequest from UI/content
- Don’t store large data in storage.sync (use local for stats/logs)
- Don’t introduce heavy dependencies into background/content

# When unsure
- Ask 1–2 clarifying questions OR propose a safe default.
- If choice impacts permissions or blocking behavior, prefer the safer/less intrusive option.