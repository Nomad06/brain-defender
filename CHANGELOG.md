# Changelog

All notable changes to Brain Defender will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed
- **Complete i18n implementation** - All hardcoded Russian text replaced with translation keys
- Added missing English translations for schedule modal
- All schedule UI elements now properly support English and Russian languages
- Schedule modal now uses i18n system instead of hardcoded Russian text
- Fixed hardcoded Russian text in ConditionalRulesModal (all labels now translated)
- Fixed "Закрыть" button in BlockedPage stretch exercise (now uses t('common.close'))
- **Fixed all hardcoded text in BlockedPage.tsx**:
  - Exercise buttons: Eye Training, Breathing, Mini Stretch
  - Exercise titles and instructions
  - Breath phases: Inhale, Pause, Exhale, Completion
  - Stretch steps (all 4 steps now translated)
  - Stop buttons
- Added missing translations: `common.close`, `conditionalRules.*`, `exercises.*` (22+ new translation keys)

### Documentation
- Created TRANSLATION_TESTING.md guide for testing translations
- Created comprehensive Chrome Web Store publication documentation
- Added PRIVACY.md with GDPR-compliant privacy policy
- Added STORE_LISTING.md with submission guidelines
- Added PUBLICATION_CHECKLIST.md for submission tracking
- Expanded README.md with full user guide and technical docs
- Added proper _locales/ structure for Chrome extension i18n

---

## Future Releases

See [README.md](README.md#roadmap) for planned features in upcoming versions.

---

## Links
- [Chrome Web Store](https://chrome.google.com/webstore) *(coming soon)*
- [GitHub Repository](https://github.com/nomad06/brain-defender)
- [Report Issues](https://github.com/nomad06/brain-defender/issues)
- [Privacy Policy](PRIVACY.md)
