# Theme System Guide

## Overview

The extension now supports **switchable themes** that allow users to customize the visual appearance. Themes can be easily created and added to the system.

## Current Themes

1. **Brain Defender** (default) 🧠
   - Clean, modern, blue-focused design
   - Original extension style

2. **Focusan** ⛩️
   - Japanese-inspired aesthetic
   - Traditional colors (washi paper, sumi ink, seiheki blue)
   - Custom animations (ink stroke, sakura fall, zen ripple)
   - Special haiku and zen garden features

## How to Add a New Theme

### Step 1: Create Theme File

Create a new file in `src/shared/themes/` (e.g., `mytheme.ts`):

```typescript
import type { Theme } from './types'

export const myTheme: Theme = {
  metadata: {
    id: 'mytheme',                    // Unique ID (lowercase, no spaces)
    name: 'My Awesome Theme',          // Display name
    description: 'A cool new theme',   // Short description
    emoji: '🎨',                       // Icon emoji
    version: '1.0.0',                  // Optional version
    author: 'Your Name',               // Optional author
  },

  colors: {
    // Required colors
    bg1: '#f0f0f0',      // Primary background
    bg2: '#ffffff',      // Secondary background
    card: '#ffffff',     // Card background
    card2: '#f5f5f5',    // Alternate card
    text: '#333333',     // Text color
    muted: '#666666',    // Muted text
    border: '#dddddd',   // Border color
    accent: '#007bff',   // Primary accent
    accent2: '#0056b3',  // Secondary accent
    danger: '#dc3545',   // Error/danger color

    // Optional colors
    success: '#28a745',  // Success color
    gold: '#ffd700',     // Gold accent

    // Extended palette (optional)
    palette: {
      'custom-color-1': '#ff6b6b',
      'custom-color-2': '#4ecdc4',
      // Add as many as you want
    },
  },

  typography: {
    sans: 'Arial, sans-serif',    // Sans-serif font stack
    mono: 'Courier, monospace',   // Monospace font stack
  },

  effects: {
    shadow: '0 2px 8px rgba(0,0,0,0.1)',        // Default shadow
    shadowLg: '0 10px 40px rgba(0,0,0,0.15)',   // Large shadow (optional)
    radius: '8px',                               // Border radius
    radiusLg: '12px',                            // Large radius (optional)
  },

  animations: {
    available: ['fadeIn', 'slideUp'],  // List animation names
  },

  // Optional: Custom CSS injected when theme is active
  customCSS: `
    /* Your custom CSS here */
    .my-custom-class {
      animation: myAnimation 1s ease;
    }

    @keyframes myAnimation {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
}
```

### Step 2: Register Theme

Open `src/shared/themes/index.ts` and:

1. Import your theme:
```typescript
import { myTheme } from './mytheme'
```

2. Add it to the registry:
```typescript
export const THEMES: ThemeRegistry = {
  default: defaultTheme,
  focusan: focusanTheme,
  mytheme: myTheme,     // ← Add your theme here
}
```

### Step 3: Build and Test

```bash
npm run build
```

Load the extension and go to **Options → Appearance** to see your new theme!

## Theme Structure

### Colors

All colors are applied as CSS custom properties:
- Basic colors: `--bg1`, `--text`, `--accent`, etc.
- Palette colors: `--palette-custom-color-1`, etc.

You can use these in your components:
```css
.my-element {
  background: var(--accent);
  color: var(--text);
  border: 1px solid var(--border);
}
```

### Typography

Fonts are available as:
- `var(--font-sans)` - Sans-serif stack
- `var(--font-mono)` - Monospace stack

### Effects

Shadows and radii:
- `var(--shadow)` - Default box shadow
- `var(--shadow-lg)` - Large box shadow
- `var(--radius)` - Border radius
- `var(--radius-lg)` - Large border radius

### Custom CSS

The `customCSS` field lets you inject theme-specific styles. This is perfect for:
- Custom animations
- Theme-specific class definitions
- Special effects

The CSS is automatically injected when the theme is activated and removed when another theme is selected.

## Theme Switching

### Programmatically

```typescript
import { switchTheme } from '@shared/themes'

// Switch to a theme
await switchTheme('mytheme')
```

### User Interface

Users can switch themes in:
1. Open extension
2. Click "Options"
3. Go to "Appearance" tab
4. Click on any theme card

The change applies immediately across all extension pages.

## Data Attribute

When a theme is active, the root element gets a data attribute:
```html
<html data-theme="mytheme">
```

You can use this in CSS:
```css
[data-theme="mytheme"] .special-element {
  /* Theme-specific styling */
}
```

## Best Practices

1. **Test on all pages**: Popup, Options, Blocked page, Diagnostics
2. **Check contrast**: Ensure text is readable on backgrounds
3. **Mobile-friendly**: Use relative units where possible
4. **Consistent naming**: Use descriptive color names in palette
5. **Performance**: Keep custom CSS minimal
6. **Accessibility**: Maintain WCAG AA contrast ratios

## Example: Dark Theme

Here's a quick example of a dark theme:

```typescript
export const darkTheme: Theme = {
  metadata: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes',
    emoji: '🌙',
  },
  colors: {
    bg1: '#1a1a1a',
    bg2: '#2d2d2d',
    card: '#2d2d2d',
    card2: '#3a3a3a',
    text: '#e0e0e0',
    muted: '#a0a0a0',
    border: '#404040',
    accent: '#64b5f6',
    accent2: '#42a5f5',
    danger: '#ef5350',
    success: '#66bb6a',
  },
  typography: {
    sans: 'system-ui, sans-serif',
    mono: 'Consolas, monospace',
  },
  effects: {
    shadow: '0 2px 8px rgba(0,0,0,0.4)',
    radius: '8px',
  },
}
```

## Content Configuration System

### Overview

Each theme can define **what motivational content** appears on the blocked page. This abstraction allows themes to have unique content personalities without hardcoding references in the BlockedPage component.

### Content Types

Available content types for blocked pages:
1. **Haiku** - Traditional 5-7-5 syllable poems (used by Focusan theme)
2. **Quotes** - Motivational quotes (e.g., Samurai quotes in Focusan)
3. **Phrases** - Simple motivational phrases (used by default theme)
4. **Seasonal** - Context-aware seasonal messages (optional)

### Adding Content Configuration to Your Theme

```typescript
import { ThemeContentConfig } from './content-config'
import { getRandomHaiku, getRandomSamuraiQuote } from '../haiku'
import { getRandomBlockedPhrase } from '../i18n'

// 1. Define your theme's content config
const myThemeContentConfig: ThemeContentConfig = {
  themeId: 'mytheme',

  // Specify what content sources to enable
  contentSources: {
    // Example: Enable quotes
    quote: {
      enabled: true,
      fetch: (lang) => getRandomSamuraiQuote(lang)
    },
    // Example: Enable phrases
    phrase: {
      enabled: true,
      fetch: () => getRandomBlockedPhrase()
    },
  },

  // Configure blocked page layout
  layout: {
    showHaiku: false,      // Don't show haiku
    showQuote: true,       // Show quotes
    showPhrase: true,      // Show phrases
    showSeasonal: false,   // Don't show seasonal messages

    // Exercise button order (first = top/left)
    exerciseOrder: ['breath', 'eye', 'stretch'],

    // Header style: 'default' | 'japanese' | 'custom'
    headerStyle: 'default'
  }
}

// 2. Add contentConfig to your theme
export const myTheme: Theme = {
  metadata: { /* ... */ },
  colors: { /* ... */ },
  // ... other properties

  contentConfig: myThemeContentConfig,  // ← Add this
}

// 3. Register in content-config.ts
// Add to THEME_CONTENT_CONFIGS registry
export const THEME_CONTENT_CONFIGS: Record<string, ThemeContentConfig> = {
  default: defaultContentConfig,
  focusan: focusanContentConfig,
  mytheme: myThemeContentConfig,  // ← Add here
}
```

### Content Source Functions

You can use built-in content sources or create custom ones:

**Built-in Sources:**
```typescript
import { getRandomHaiku, getRandomSamuraiQuote } from '../haiku'
import { getRandomBlockedPhrase } from '../i18n'

// Haiku - Returns Haiku object with lines, linesRu, theme
getRandomHaiku()

// Samurai quotes - Language-aware
getRandomSamuraiQuote('en')  // Returns English quote
getRandomSamuraiQuote('ru')  // Returns Russian quote

// Motivational phrases - Uses current language automatically
getRandomBlockedPhrase()
```

**Custom Content Sources:**
```typescript
// Define your own content fetcher
contentSources: {
  quote: {
    enabled: true,
    fetch: (lang) => {
      const customQuotes = {
        en: ['Focus on what matters', 'You got this!'],
        ru: ['Сосредоточься', 'У тебя получится!']
      }
      const quotes = customQuotes[lang]
      return quotes[Math.floor(Math.random() * quotes.length)]
    }
  }
}
```

### Exercise Ordering

Control which exercises appear and in what order:

```typescript
layout: {
  // Zen garden first (Focusan theme)
  exerciseOrder: ['zen', 'breath', 'eye', 'stretch']

  // No zen garden (default theme)
  exerciseOrder: ['breath', 'eye', 'stretch']

  // Eye training first (custom priority)
  exerciseOrder: ['eye', 'breath', 'stretch', 'zen']
}
```

### Header Styles

Choose how the blocked page header appears:

**Default Header:**
```typescript
headerStyle: 'default'
// Shows: emoji, theme name, description
```

**Japanese Header (Focusan style):**
```typescript
headerStyle: 'japanese'
// Shows: torii gate emoji with shadow, vertical Japanese title,
// kanji characters "集中 · FOCUS"
```

**Custom Header:**
```typescript
headerStyle: 'custom'
// TODO: Implement custom header component support
```

### Content Components

The blocked page uses these extracted components:

- **`<HaikuCard>`** - Displays haiku with appropriate styling
- **`<QuoteCard>`** - Shows motivational quotes with decorative icon
- **`<PhraseCard>`** - Simple phrase display for default theme
- **`<ThemedHeader>`** - Theme-aware header component

These components are automatically shown/hidden based on your `contentConfig.layout` settings.

### Example Configurations

**Minimalist Theme (Phrases only):**
```typescript
const minimalistConfig: ThemeContentConfig = {
  themeId: 'minimalist',
  contentSources: {
    phrase: { enabled: true, fetch: () => getRandomBlockedPhrase() }
  },
  layout: {
    showHaiku: false,
    showQuote: false,
    showPhrase: true,
    showSeasonal: false,
    exerciseOrder: ['breath', 'eye'],
    headerStyle: 'default'
  }
}
```

**Philosophical Theme (Quotes + Seasonal):**
```typescript
const philosophicalConfig: ThemeContentConfig = {
  themeId: 'philosophical',
  contentSources: {
    quote: {
      enabled: true,
      fetch: (lang) => getPhilosophicalQuote(lang) // Custom function
    },
    seasonal: {
      enabled: true,
      fetch: (lang) => getSeasonalMessage() // From seasonal-theme.ts
    }
  },
  layout: {
    showHaiku: false,
    showQuote: true,
    showPhrase: false,
    showSeasonal: true,
    exerciseOrder: ['zen', 'stretch', 'breath'],
    headerStyle: 'default'
  }
}
```

### How It Works

1. **BlockedPage loads** → Calls `useThemeContent()` hook
2. **Hook fetches** current theme + content config
3. **Content generated** via `getMotivationalContent(config)`
4. **Components render** conditionally based on `content` object
5. **Exercises ordered** per theme's `exerciseOrder` array

### Abstraction Benefits

✅ **No hardcoded content** - BlockedPage doesn't know about haiku/quotes
✅ **Theme independence** - Each theme controls its own content
✅ **Type safety** - Full TypeScript support throughout
✅ **Easy extension** - Add new content types without touching BlockedPage
✅ **Testing friendly** - Mock content sources easily
✅ **User customization** - Future: let users override content preferences

## Files Modified

### Core Theme System
- `src/shared/themes/types.ts` - TypeScript interfaces
- `src/shared/themes/index.ts` - Theme manager and registry
- `src/shared/themes/default.ts` - Default theme
- `src/shared/themes/focusan.ts` - Japanese theme
- `src/shared/themes/content-config.ts` - **NEW** Content configuration system
- `src/shared/themes/useThemeContent.ts` - **NEW** React hook for theme content

### Blocked Page Components
- `src/pages/blocked/BlockedPage.tsx` - Refactored to use theme abstraction
- `src/pages/blocked/components/HaikuCard.tsx` - **NEW** Haiku display component
- `src/pages/blocked/components/QuoteCard.tsx` - **NEW** Quote display component
- `src/pages/blocked/components/PhraseCard.tsx` - **NEW** Phrase display component
- `src/pages/blocked/components/ThemedHeader.tsx` - **NEW** Theme-aware header

### Page Entry Points (Initialize themes)
- `src/popup/main.tsx`
- `src/options/main.tsx`
- `src/pages/blocked/main.tsx`
- `src/pages/diagnostics/main.tsx`

### UI Components
- `src/options/App.tsx` - Added Appearance tab with theme selector

## Storage

Theme preference is stored in `chrome.storage.sync` as:
```json
{
  "theme_preference": {
    "themeId": "focusan",
    "appliedAt": 1704876543000
  }
}
```

This syncs across devices where the user is signed in to Chrome.

## Troubleshooting

**Theme not appearing in selector:**
- Check that theme is imported in `index.ts`
- Verify theme is added to `THEMES` registry
- Rebuild the extension

**Colors not applying:**
- Ensure CSS uses `var(--color-name)` format
- Check browser console for errors
- Verify theme object matches `Theme` type

**Custom CSS not working:**
- Check for syntax errors in CSS
- Ensure selectors are specific enough
- Verify CSS is being injected (check `<style id="theme-custom-...">`)

## Future Enhancements

Potential improvements:
- Theme preview before selection
- Custom theme editor in UI
- Import/export themes
- Theme marketplace
- Per-page theme overrides
- Automatic dark mode based on system preference
