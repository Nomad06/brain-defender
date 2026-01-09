# Changelog

All notable changes to Brain Defender will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-01-09

### 🎉 Major Rewrite - TypeScript & React

Complete rewrite of Brain Defender with modern technologies and improved architecture.

### Added
- **TypeScript Support**: Full type safety across the entire codebase
- **React UI**: Modern UI components for popup, options, and blocked pages
- **Vite Build System**: Fast development and optimized production builds
- **Zod Validation**: Runtime data validation for storage
- **Focus Sessions**: Pomodoro-style timed blocking sessions
  - 25-minute work intervals
  - Pause, resume, and stop controls
  - Visual timer in popup
  - Custom site selection per session
- **Wellness Exercises**: Three types of exercises on blocked page
  - Eye training with animated trajectories
  - Breathing exercises with visual guides
  - Stretching routines with step-by-step instructions
- **Advanced Scheduling**: Time-based and day-of-week blocking rules
- **Conditional Rules**: Visit limits and time-based allowances
- **Categories**: Organize sites by category (Social Media, News, etc.)
- **Achievements System**: 12 achievements to unlock
- **Statistics Dashboard**: Track blocked attempts per site
- **Import/Export**: Backup and restore all settings as JSON
- **Bulk Operations**: Select and manage multiple sites at once
- **Search & Filter**: Find sites quickly in options
- **Internationalization**: English and Russian language support
- **Diagnostics Page**: Debug interface for troubleshooting
- **SPA Blocking**: Properly blocks single-page app navigation (YouTube, etc.)
- **Temporary Allowances**: Time-limited exceptions to blocking
- **Data Migration System**: Automatic migrations from legacy versions

### Changed
- **Manifest V3**: Migrated from Manifest V2 to V3
- **Blocking Mechanism**: Now uses declarativeNetRequest API (network-level blocking)
- **Storage Format**: Sites now stored as structured objects with metadata
- **Service Worker**: Background page converted to modern service worker
- **UI Framework**: Replaced vanilla JS with React components
- **Build Process**: Migrated from manual builds to Vite
- **Error Handling**: Comprehensive error handling and logging throughout

### Improved
- **Performance**: Faster blocking with DNR API
- **Type Safety**: TypeScript prevents runtime errors
- **Code Organization**: Modular architecture with clear separation of concerns
- **User Experience**: Modern, responsive UI with smooth animations
- **Privacy**: 100% local-only data storage, no external requests
- **Accessibility**: Better keyboard navigation and focus management

### Fixed
- Sites with multiple subdomains now properly normalized
- Focus session timers now persist across browser restarts
- Blocked page now properly handles non-standard URLs
- Statistics now accurately track visit attempts
- Scheduling now respects timezone correctly

### Developer Experience
- **ESLint & Prettier**: Consistent code formatting
- **Vitest**: Modern testing framework with UI
- **Type Checking**: Strict TypeScript configuration
- **Hot Module Replacement**: Fast development iteration
- **Source Maps**: Easy debugging in development

### Documentation
- Added comprehensive PRIVACY.md
- Expanded README.md with user guide
- Added CLAUDE.md for AI assistant context
- Added QUICK_START.md for rapid onboarding
- Created this CHANGELOG.md

---

## [1.0.0] - 2024-XX-XX

### Initial Release
- Basic website blocking functionality
- Popup interface for quick actions
- Options page for site management
- Blocked page with motivational messages
- Chrome storage sync support
- Manual site addition
- Basic statistics tracking

---

## Upgrade Notes

### Migrating from 1.x to 2.0

**Automatic Migration**:
Brain Defender 2.0 includes automatic data migration. Your blocked sites list will be converted to the new format on first launch.

**What's Preserved**:
- ✅ All blocked sites
- ✅ Basic settings

**What's New** (requires manual setup):
- Categories (all sites start as uncategorized)
- Schedules (all sites start with "always block")
- Conditional rules (none set by default)
- Achievements (start from zero)

**Manual Steps**:
1. Update to version 2.0
2. Open the extension (automatic migration runs)
3. Review your blocked sites in Options
4. Configure categories, schedules, and conditional rules as desired
5. Start using focus sessions!

**Backup Recommended**:
Before upgrading, consider exporting your v1.x settings (if available). While migration is automatic, having a backup is always wise.

---

## Future Releases

See [README.md](README.md#roadmap) for planned features in upcoming versions.

---

## Links
- [Chrome Web Store](https://chrome.google.com/webstore) *(coming soon)*
- [GitHub Repository](https://github.com/[your-username]/brain-defender)
- [Report Issues](https://github.com/[your-username]/brain-defender/issues)
- [Privacy Policy](PRIVACY.md)
