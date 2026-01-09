# Brain Defender 🧠🛡️

**Your Digital Attention Guardian**

Brain Defender is a modern Chrome extension that helps you maintain focus and protect your attention by blocking distracting websites. Unlike harsh blockers, Brain Defender offers wellness exercises and motivational support when you're distracted, turning moments of weakness into wellness breaks.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## ✨ Features

### 🚫 Smart Website Blocking
- Block any website with one click
- Automatic domain normalization
- Blocks both full page loads and SPA navigation (YouTube, etc.)
- Network-level blocking using Chrome's Manifest V3 DNR API

### 🍅 Pomodoro Focus Sessions
- Start timed focus sessions with custom site blocking
- 25-minute work intervals with break support
- Visual timer in popup
- Pause, resume, and stop controls
- Session completion notifications

### 🧘 Wellness Exercises
When you visit a blocked site, choose from:
- **👁️ Eye Training**: Animated exercises to reduce eye strain
- **🫁 Breathing Exercises**: Guided breathing with visual cues
- **🤸 Stretch Routine**: Step-by-step mini-exercises

### 📅 Advanced Scheduling
- Set time-based blocking rules (e.g., "block during work hours")
- Weekday-specific schedules
- Multiple schedule profiles per site

### 🎯 Conditional Rules
- Visit limits (e.g., "allow 3 visits per day")
- Time-based allowances
- Flexible rule combinations

### 📊 Statistics & Achievements
- Track blocked visit attempts per site
- View your blocking streak
- Unlock achievements for staying focused
- Export statistics for analysis

### 🗂️ Organization
- Categorize blocked sites (Social Media, News, Entertainment, etc.)
- Filter by category
- Bulk operations (block/unblock multiple sites)
- Import/Export your configuration

### 🌍 Internationalization
- English interface
- Russian interface
- Automatic language detection
- Manual language override

---

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Brain Defender Chrome Web Store page](#) *(coming soon)*
2. Click "Add to Chrome"
3. Grant required permissions
4. Click the Brain Defender icon to get started!

### Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/brain-defender.git
   cd brain-defender
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

---

## 📖 User Guide

### Quick Start

#### Blocking Your First Site
1. Navigate to a distracting website (e.g., reddit.com)
2. Click the Brain Defender icon in your toolbar
3. Click "Add Current Site"
4. The site is now blocked!

#### Starting a Focus Session
1. Click the Brain Defender icon
2. Click "Start Focus Session"
3. Select which sites to block during the session
4. Click "Start Pomodoro"
5. Focus for 25 minutes!

#### Viewing Statistics
1. Right-click the Brain Defender icon
2. Select "Options"
3. Navigate to the "Stats" tab
4. View your blocking history and achievements

### Managing Blocked Sites

#### Options Page
Access via:
- Right-click extension icon → Options
- Click ⚙️ settings button in popup

**Sites Tab**:
- Add sites manually by entering domain
- Bulk add multiple sites at once
- Assign categories
- Set schedules and conditional rules
- Search and filter your blocked sites
- Bulk select and delete

**Stats Tab**:
- View total blocked attempts
- See per-site statistics
- Track your focus streak
- Monitor daily/weekly trends

**Achievements Tab**:
- Unlock 12 different achievements
- Track progress toward goals
- Celebrate milestones

### Advanced Features

#### Schedules
1. In Options, click the 📅 icon next to a site
2. Choose schedule type:
   - Always block
   - Time range (e.g., 9 AM - 5 PM)
   - Specific days of week
3. Save your schedule

#### Conditional Rules
1. Click the ⚙️ icon next to a site
2. Add a conditional rule:
   - **Visit limit**: "Allow X visits per day/week"
   - **Time limit**: "Allow X minutes per day"
3. Rules reset automatically

#### Import/Export
**Export**:
1. Options → Sites tab
2. Click "Export Data"
3. Save JSON file to backup

**Import**:
1. Options → Sites tab
2. Click "Import Data"
3. Select your JSON file
4. All settings restored!

---

## 🛠️ Technical Details

### Tech Stack
- **TypeScript** - Type-safe development
- **React** - Modern UI components
- **Vite** - Fast build system
- **Zod** - Runtime validation
- **Chrome Manifest V3** - Latest extension API
- **webextension-polyfill** - Cross-browser compatibility

### Architecture
```
src/
├── background/         # Service worker (blocking logic)
│   ├── index.ts       # Main orchestrator
│   ├── dnr-manager.ts # Declarative Net Request rules
│   ├── handlers.ts    # Message handlers
│   └── alarms.ts      # Scheduled tasks
├── shared/
│   ├── domain/        # Business logic
│   ├── storage/       # Storage abstraction
│   ├── messaging/     # Type-safe messaging
│   ├── i18n/          # Translations
│   └── utils/         # Utilities
├── popup/             # Extension popup UI
├── options/           # Settings page UI
└── pages/
    ├── blocked/       # Block notification page
    └── diagnostics/   # Debug interface
```

### Permissions Explained
- **storage**: Save your blocked sites and settings
- **tabs**: Detect which website you're visiting
- **declarativeNetRequest**: Block distracting sites at network level
- **notifications**: Alert you about focus sessions
- **webNavigation**: Block single-page app navigation
- **alarms**: Manage focus session timers
- **host_permissions**: Required to block any website

### Privacy
Brain Defender is **100% privacy-first**:
- ✅ All data stored locally in your browser
- ✅ No external servers or analytics
- ✅ No data collection or tracking
- ✅ Open source for transparency

See our [Privacy Policy](PRIVACY.md) for details.

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Start dev mode: `npm run dev`
5. Load the extension from `dist/` folder
6. Make your changes
7. Run tests: `npm test`
8. Submit a pull request

### Available Scripts
```bash
npm run dev          # Build and watch for changes
npm run build        # Production build
npm test             # Run test suite
npm run test:ui      # Run tests with UI
npm run lint         # Check code quality
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Code Guidelines
- Use TypeScript for all new code
- Follow existing code style (Prettier + ESLint)
- Write tests for new features
- Update documentation
- Keep rule IDs stable and deterministic
- Don't modify manifest permissions without discussion

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

---

## 🐛 Troubleshooting

### Sites Not Blocking?
1. Check if site is in your blocked list (Options → Sites)
2. Verify schedule is active (if using schedules)
3. Check for temporary allowances
4. Visit diagnostics page: `chrome-extension://[your-id]/src/pages/diagnostics/index.html`

### Focus Session Not Starting?
1. Ensure you have sites selected
2. Check alarm permissions are granted
3. Look for notifications (may be blocked by browser)

### Statistics Not Updating?
1. Statistics only count actual blocking attempts
2. Check the Stats tab in Options
3. Data stored locally - clearing browser data will reset

### Import Failed?
1. Ensure JSON file is from Brain Defender export
2. Check file is not corrupted
3. Try exporting again from another browser

---

## 📋 Roadmap

### Version 2.1 (Planned)
- [ ] Dark mode toggle
- [ ] Custom motivational messages
- [ ] Weekly/monthly reports
- [ ] More exercise types
- [ ] Cloud sync (optional)

### Version 2.2 (Future)
- [ ] Firefox support
- [ ] Team/family sharing
- [ ] Mobile companion app
- [ ] AI-powered suggestions

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Brain Defender is built with:
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Zod](https://zod.dev/) - Schema validation
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) - Browser API wrapper

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/[your-username]/brain-defender/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/[your-username]/brain-defender/discussions)
- 📧 **Email**: [your-email@example.com]
- 🔒 **Privacy Questions**: See [PRIVACY.md](PRIVACY.md)

---

## ⭐ Star History

If Brain Defender helps you stay focused, consider giving it a ⭐ on GitHub!

---

**Made with ❤️ for focused minds everywhere**

*Remove sites which consume your brain resources*
