# Brain Defender v2.0 - Quick Start Guide

## Installation (5 minutes)

### 1. Build the Extension

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

**Expected output**: `dist/` folder with compiled extension

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the `dist/` folder
5. The Brain Defender icon should appear in your extensions toolbar

## First Use

### Quick Test

1. **Click the extension icon** → Popup opens
2. **Add a site**: Navigate to any website (e.g., facebook.com) and click "Add current site"
3. **Verify blocking**: Try to visit the site → You'll see the blocked page
4. **View stats**: Open popup → See blocked attempt counter increment

### Features Tour

#### Popup (Click extension icon)
- 📊 **Sites Counter**: Shows number of blocked sites
- ➕ **Add Current Site**: Block the site you're currently on
- ⏱️ **Focus Session**: Start a Pomodoro timer (25 or 50 minutes)
- ⏸️ **Session Controls**: Pause/Resume/Stop active focus sessions

#### Options Page (Right-click icon → Options)
- **Sites Tab**:
  - Add sites manually or in bulk
  - Filter by category (Social, Entertainment, etc.)
  - Bulk operations (select all, delete selected)
  - Export/Import data
- **Statistics Tab**:
  - Total blocks
  - Current streak
  - Longest streak
  - Per-site statistics
- **Achievements Tab**:
  - View unlocked achievements
  - Track progress

#### Blocked Page (When accessing blocked site)
- Motivational random message
- 3-step breathing exercise
- Pulsing meditation dot
- Close tab or go back buttons

#### Diagnostics (Options → Diagnostics link)
- System information
- Migration status
- Rebuild DNR rules
- Export data
- View raw JSON

## Common Tasks

### Add a Site
**Method 1 - Current Site**:
1. Navigate to the site
2. Click extension icon
3. Click "Add current site"

**Method 2 - Manual**:
1. Open Options
2. Type domain in input field
3. Select category (optional)
4. Click "Add Site"

**Method 3 - Bulk**:
1. Open Options → Bulk Add tab
2. Paste list of domains (one per line)
3. Click "Add Sites"

### Remove a Site
1. Open Options
2. Find site in list
3. Click "Remove" button

### Start Focus Session
1. Click extension icon
2. Click "Start Focus Session"
3. Select duration (25min or 50min)
4. (Optional) Select sites to allow during session
5. Click "Start"

### View Statistics
1. Open Options
2. Click "Statistics" tab
3. View:
   - Total blocks
   - Current/longest streak
   - Per-site attempts

### Export Data (Backup)
1. Open Options
2. Click "Sites" tab
3. Scroll to bottom
4. Click "Export Data"
5. Save JSON file

### Import Data (Restore)
1. Open Options
2. Click "Sites" tab
3. Scroll to bottom
4. Click "Import Data"
5. Select your backup JSON file

## Keyboard Shortcuts

(No default shortcuts - can be configured in `chrome://extensions/shortcuts`)

## Troubleshooting

### Site Not Blocking
1. Check if site is in list (Options → Sites)
2. Open Diagnostics → Click "Rebuild DNR Rules"
3. Refresh the site you're trying to block

### Extension Not Loading
1. Check console for errors (`chrome://extensions` → Details → Errors)
2. Verify `dist/` folder has all files:
   - manifest.json
   - assets/
   - icons/
   - src/
   - styles.css

### Data Not Migrating
1. Open Diagnostics page
2. Check "Migration Status" section
3. Click "Run Migrations" if needed

### Statistics Not Updating
1. Try visiting a blocked site
2. Check Options → Statistics tab
3. Refresh the page

## Tips & Tricks

### Best Practices
- **Start small**: Block 3-5 most distracting sites first
- **Use schedules**: Block social media only during work hours
- **Try focus sessions**: 25-minute Pomodoro sessions work great
- **Review stats weekly**: See your progress and adjust

### Power User Features
- **Categories**: Organize sites by type for easier management
- **Schedules**: Block sites only on weekdays 9am-5pm
- **Bulk operations**: Select multiple sites and delete at once
- **Export regularly**: Backup your data monthly

### Productivity Workflow
1. **Morning**: Review yesterday's stats, set today's goals
2. **Work session**: Start 25-min focus session, allow only work-related sites
3. **Break**: 5-minute break after session ends
4. **Repeat**: 4 sessions, then longer break
5. **Evening**: Check achievements, celebrate progress

## Development Mode

### Watch Mode (for development)
```bash
npm run dev
```
Watches for file changes and rebuilds automatically.

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Uninstall

1. Go to `chrome://extensions/`
2. Find Brain Defender
3. Click "Remove"
4. Confirm removal

**Note**: Your data is stored in Chrome sync storage and will be deleted.
Export data first if you want to keep it!

## Getting Help

### Documentation
- **README.md**: Full project documentation
- **MIGRATION_GUIDE.md**: Migrating from v1.0
- **COMPLETION_SUMMARY.md**: Technical details

### Diagnostics
Use the built-in Diagnostics page:
1. Open Options
2. Scroll to bottom
3. Click "Diagnostics" link
4. View system info and run tests

### Common Issues

**Q: Extension icon is gray**
A: Extension is loaded but inactive. Try clicking it.

**Q: Sites counter shows 0**
A: No sites added yet. Add your first site to get started.

**Q: Focus session doesn't start**
A: Check if you have any sites added. Session needs at least 1 site to work.

**Q: Blocked page doesn't show**
A: Clear cache and try again. Check if DNR rules are enabled.

---

**Version**: 2.0.0
**Last Updated**: January 8, 2026
**Estimated Setup Time**: 5 minutes
