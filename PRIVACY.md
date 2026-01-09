# Brain Defender Privacy Policy

**Last Updated: January 9, 2026**
**Version: 2.0.0**

## Overview

Brain Defender is committed to protecting your privacy. This extension operates entirely within your browser and does not collect, transmit, or share any personal data with external servers or third parties.

## Information We Collect

Brain Defender stores the following data **locally in your browser only**:

### User Configuration Data
- **Blocked websites list**: Domain names you choose to block
- **Site categories**: Optional categorization of blocked sites
- **Blocking schedules**: Time-based rules you configure
- **Conditional rules**: Visit limits and advanced blocking conditions
- **Focus session preferences**: Sites selected for Pomodoro-style sessions
- **Language preference**: Your chosen interface language (Russian/English)

### Usage Statistics (Local Only)
- **Visit attempt counts**: Number of times you tried to access blocked sites
- **Focus session history**: Duration and completion of your focus sessions
- **Achievement progress**: Your progress in the gamification system

### Temporary Data
- **Temporary allowances**: Time-limited exceptions you create
- **Active focus sessions**: Current session state and timer

## How We Store Your Data

All data is stored using Chrome's built-in storage APIs:

- **chrome.storage.sync**: For blocked sites, settings, and preferences (synced across your Chrome browsers if you're signed in)
- **chrome.storage.local**: For statistics, temporary allowances, and session data (stored only on this device)

**Important**: Chrome's sync storage has quotas (approximately 100KB total). If you block many sites, you may hit this limit. The extension will continue to work, but sync may be limited.

## Data Transmission

**Brain Defender does NOT**:
- ❌ Send data to external servers
- ❌ Use analytics or tracking services
- ❌ Communicate with any third-party services
- ❌ Collect personally identifiable information
- ❌ Monitor your browsing beyond blocked site detection
- ❌ Share data with advertisers or data brokers
- ❌ Use cookies or web beacons

**All functionality operates entirely within your browser.**

## Permissions Explanation

Brain Defender requests the following Chrome permissions. Here's why each is needed:

| Permission | Purpose | Data Access |
|------------|---------|-------------|
| `storage` | Save your blocked sites and settings | Local storage only |
| `tabs` | Detect which website you're visiting to apply blocking rules | Current tab URL only when navigating |
| `declarativeNetRequest` | Block network requests to distracting sites | URL patterns you configure |
| `notifications` | Show alerts when focus sessions start/end | No data access |
| `webNavigation` | Block single-page applications (e.g., YouTube video changes) | Navigation events for blocked sites only |
| `alarms` | Manage focus session timers and periodic cleanup | No data access |
| `http://*/*` and `https://*/*` | Required to block any website you choose | Only URLs you explicitly block |

## Your Data Control

You have complete control over your data:

### Export Your Data
1. Open Brain Defender Options
2. Click "Export Data" button
3. Download a JSON file with all your settings

### Import Your Data
1. Open Brain Defender Options
2. Click "Import Data" button
3. Select your previously exported JSON file

### Delete Specific Data
- Remove individual sites from the blocked list anytime
- Clear visit statistics via the Options page
- Cancel temporary allowances manually

### Delete All Data
Uninstalling the extension removes all data from your browser. To completely reset:
1. Uninstall Brain Defender from Chrome
2. Reinstall from the Chrome Web Store (if desired)

## Data Retention

- **Configuration data**: Retained until you delete it or uninstall the extension
- **Statistics**: Retained locally until you clear them via Options
- **Temporary allowances**: Automatically expire based on your chosen duration
- **Focus sessions**: Active sessions expire automatically; history retained until cleared

## Third-Party Services

Brain Defender does **NOT** use any third-party services, including:
- No analytics (Google Analytics, etc.)
- No crash reporting services
- No advertising networks
- No cloud storage providers
- No authentication services

## Children's Privacy

Brain Defender does not knowingly collect any information from children. The extension can be used by anyone with a Chrome browser, and all data remains private and local to the user's device.

## Changes to This Policy

We will notify users of significant changes to this privacy policy through:
- Extension update notes in the Chrome Web Store
- Changelog in the extension repository
- Version number updates

## Open Source Transparency

Brain Defender's source code is available for inspection. You can verify our privacy claims by reviewing:
- Storage operations in `src/shared/storage/storage.ts`
- Background service worker in `src/background/index.ts`
- All data handling in the codebase

## Data Security

While Brain Defender doesn't transmit data externally, we implement security best practices:
- **Input validation**: All user inputs are validated using Zod schemas
- **Type safety**: TypeScript ensures data type correctness
- **No eval()**: No dynamic code execution
- **Sanitized storage**: Data is normalized before storage to prevent injection

## Your Rights

Under GDPR and similar privacy laws, you have the right to:
- ✅ **Access**: Export all your data anytime
- ✅ **Rectification**: Edit your blocked sites and settings
- ✅ **Erasure**: Delete individual items or uninstall completely
- ✅ **Portability**: Export data in JSON format
- ✅ **Object to processing**: Simply don't use features you don't want

Since all data is local and under your control, you can exercise these rights directly within the extension.

## Contact Information

For questions, concerns, or requests regarding this privacy policy:

- **GitHub Issues**: [Report privacy concerns](https://github.com/[your-username]/brain-defender/issues)
- **Email**: [your-email@example.com]

## Compliance

Brain Defender is designed to comply with:
- ✅ **GDPR** (General Data Protection Regulation)
- ✅ **CCPA** (California Consumer Privacy Act)
- ✅ **Chrome Web Store Developer Policies**
- ✅ **Chrome Extension Privacy Requirements**

## Consent

By installing and using Brain Defender, you consent to the data practices described in this privacy policy. You can withdraw consent at any time by uninstalling the extension.

---

**Summary**: Brain Defender is a privacy-first extension. All data stays on your device, under your control. We don't track, collect, or share anything.
