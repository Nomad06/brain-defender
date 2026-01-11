# Visual Theme Guide

## Theme Comparison Overview

The extension now supports **two distinct visual themes** that users can switch between instantly.

---

## 🧠 Brain Defender Theme (Default)

### Color Palette
```
Background:  #f8f9fa (Light gray)
Card:        #ffffff (Pure white)
Text:        #2d3748 (Dark gray)
Accent:      #5b8def (Bright blue)
Border:      #e2e8f0 (Light gray border)
```

### Visual Style
- **Clean & Professional**: Modern corporate look
- **High Contrast**: Excellent readability
- **Blue Accent**: Trustworthy, calm, focused
- **Minimal Shadows**: Subtle depth (0 2px 8px rgba(0,0,0,.06))
- **Rounded Corners**: 12px border radius for friendly feel

### Typography
- **Sans-serif**: System fonts (SF Pro, Segoe UI, Roboto)
- **Monospace**: Standard code fonts

### Use Cases
- ✅ Professional work environments
- ✅ Users who prefer minimalist design
- ✅ Fast loading (no custom CSS)
- ✅ High accessibility

### Screenshots Concept

**Popup (320px width):**
```
┌─────────────────────────┐
│        🧠                │
│   Brain Defender        │
│                         │
│  ┌───────────────────┐  │
│  │ example.com    ❌ │  │
│  │ facebook.com   ❌ │  │
│  │ youtube.com    ❌ │  │
│  └───────────────────┘  │
│                         │
│  [+ Add Site]           │
│  [⚙️ Options]           │
└─────────────────────────┘
```

**Blocked Page:**
```
┌──────────────────────────────────┐
│         🧠 Site Blocked          │
│                                  │
│   This site is blocked to help  │
│   you stay focused.              │
│                                  │
│   Take a moment to reflect on    │
│   your goals and return to       │
│   productive work.               │
│                                  │
│   [Return to Work]               │
│   [Allow for 15 min]             │
└──────────────────────────────────┘
```

---

## ⛩️ Focusan Theme (Japanese)

### Color Palette
```
Washi White:    #faf7f2 (Paper texture background)
Sumi Black:     #1a1a1a (Ink black for text)
Seiheki Blue:   #2e5f6f (Deep blue-green accent)
Ai Indigo:      #165e83 (Traditional indigo)
Beni Red:       #c73e3a (Safflower red for danger)
Gold Accent:    #d4af37 (For achievements)
Sakura Pink:    #ffc0cb (Cherry blossom)
Bamboo Green:   #6b8e23 (Nature green)
```

### Visual Style
- **Washi Paper Texture**: Subtle cross-hatch pattern background
- **Torii Gate Icon**: ⛩️ as primary branding
- **Gold Accent Bar**: Gradient top border on cards
- **Soft Shadows**: Subtle like shoji screens (0 2px 8px rgba(0,0,0,.04))
- **Less Rounded**: 8px radius for traditional aesthetic

### Typography
- **Sans-serif**: Japanese fonts (Noto Sans JP, Hiragino Sans, Yu Gothic)
- **Monospace**: Noto Sans Mono

### Special Features
1. **Haiku Poems**: Display on blocked pages
   ```
   Mountain stands unmoved
   While the restless river flows
   Strength in stillness found
   ```

2. **Samurai Quotes**: Motivational wisdom
   ```
   ⚔️ "The warrior who trusts his path
      doesn't need to prove the other is wrong."
   ```

3. **Zen Garden**: Interactive meditation tool (canvas-based)

4. **Custom Animations**:
   - `inkStroke`: Brush painting effect
   - `sakuraFall`: Falling cherry blossoms
   - `zenRipple`: Water ripple effect

5. **Seasonal Themes**: Auto-adjusting colors (Spring/Summer/Autumn/Winter)

### Use Cases
- ✅ Users who love Japanese culture
- ✅ Zen/mindfulness practitioners
- ✅ Creative professionals
- ✅ People seeking calming aesthetics

### Screenshots Concept

**Popup (320px width):**
```
┌─────────────────────────┐
│         ⛩️               │
│      Focusan            │
│       集中 · FOCUS       │
│  [washi paper texture]  │
│  ┌───────────────────┐  │
│  │ example.com    ❌ │  │
│  │ facebook.com   ❌ │  │
│  │ youtube.com    ❌ │  │
│  └───────────────────┘  │
│                         │
│  [+ Add Site]           │
│  [⚙️ Options]           │
└─────────────────────────┘
```

**Blocked Page:**
```
┌──────────────────────────────────┐
│           ⛩️                     │
│      Site Blocked - 集中         │
│  [washi texture background]      │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Mountain stands unmoved   │  │
│  │  While the restless river  │  │
│  │  flows                     │  │
│  │  Strength in stillness     │  │
│  │  found                     │  │
│  └────────────────────────────┘  │
│                                  │
│  ⚔️ Samurai Wisdom:              │
│  "The warrior who trusts his     │
│   path doesn't need to prove     │
│   the other is wrong."           │
│                                  │
│  🧘 Zen Garden Exercise:         │
│  [Interactive canvas with sand]  │
│                                  │
│  [Return to Practice]            │
│  [Allow for 15 min]              │
└──────────────────────────────────┘
```

---

## Appearance Tab (Theme Selector)

Located in: **Options → 🎨 Appearance**

### Layout
```
┌─────────────────────────────────────────────────┐
│  🎨 Theme Settings                              │
│                                                 │
│  Choose a theme to customize the appearance     │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   🧠         │  │   ⛩️         │            │
│  │              │  │              │            │
│  │ Brain        │  │ Focusan -    │            │
│  │ Defender     │  │ 集中         │            │
│  │              │  │              │            │
│  │ v1.0.0       │  │ v1.0.0       │            │
│  │              │  │              │            │
│  │ Original     │  │ Japanese-    │            │
│  │ clean and    │  │ inspired     │            │
│  │ modern style │  │ design       │            │
│  │              │  │              │            │
│  │ ●●●          │  │ ●●●          │            │
│  │ (colors)     │  │ (colors)     │            │
│  │              │  │              │            │
│  │  [ACTIVE]    │  │              │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ℹ️ Theme Information                           │
│  • Themes change visual appearance             │
│  • Preference synced across devices            │
│  • Applied immediately when selected           │
└─────────────────────────────────────────────────┘
```

---

## Side-by-Side Comparison

### Options Page - Sites Tab

**Default Theme:**
- White card backgrounds
- Blue accent color (#5b8def)
- Clean typography
- Standard checkboxes
- Blue buttons

**Focusan Theme:**
- Cream/washi textured background
- Torii gate at top
- Gold gradient bar on cards
- Deep blue-green accent (#2e5f6f)
- Japanese font stack
- More subtle shadows

### Options Page - Statistics Tab

**Default Theme:**
```
📊 Statistics

Total Blocks: 247 (blue number)
Current Streak: 7 days (blue number)
[Standard bar chart in blue]
```

**Focusan Theme:**
```
⛩️ 📊 Statistics - 統計

Total Blocks: 247 (seiheki blue number)
Current Streak: 7 days (gold number for achievement)
[Bar chart with gradient blue-to-pink]
```

### Options Page - Achievements Tab

**Default Theme:**
```
🏆 Achievements

✅ First Block (completed)
🔒 Week Warrior (locked)
```

**Focusan Theme:**
```
⛩️ 🏆 Achievements - 達成

✅ 🗻 Mt. Fuji Badge (completed)
   "First step on the journey"

🔒 🌸 Sakura Badge (locked)
   "30-day focus streak"

🔒 ⚔️ Katana Badge (locked)
   "500 blocks mastered"
```

---

## Animation Differences

### Default Theme Animations
- `fadeIn`: Simple opacity transition
- `slideIn`: Smooth slide from bottom

### Focusan Theme Animations
- `inkStroke`: Brush painting reveal (scaleX from left)
- `sakuraFall`: Falling petals (translateY + rotate)
- `zenRipple`: Concentric circles expanding (scale + fade)

---

## When Each Theme Shines

### Use Brain Defender When:
- 🏢 In professional/corporate environment
- ⚡ Need maximum performance (no custom CSS)
- 📊 Prefer data-focused, minimal design
- 👥 Sharing screen in meetings
- ♿ Require highest accessibility

### Use Focusan When:
- 🧘 Practicing mindfulness/meditation
- 🎨 Appreciating artistic design
- 🇯🇵 Enjoying Japanese culture
- 📚 Reading/writing (calming aesthetic)
- 🌸 Want inspirational quotes & haiku
- 🎋 Seeking zen atmosphere while working

---

## Switching Process

1. **Click extension icon** → Popup opens
2. **Click "⚙️ Options"** → Full options page
3. **Click "🎨 Appearance" tab** → Theme selector appears
4. **Click any theme card** → Applies instantly
5. **All pages update** → No reload required

The preference is saved to `chrome.storage.sync` and syncs across all devices.

---

## Technical Details

### CSS Variables Used

Both themes set these CSS custom properties:
```css
--bg1, --bg2          /* Backgrounds */
--card, --card2       /* Card colors */
--text, --muted       /* Text colors */
--border              /* Borders */
--accent, --accent2   /* Primary colors */
--danger, --success   /* Status colors */
--shadow, --shadow-lg /* Shadows */
--radius, --radius-lg /* Border radius */
--font-sans, --font-mono /* Typography */
```

Focusan adds:
```css
--gold                              /* Achievement color */
--palette-washi-white              /* Extended palette */
--palette-sumi-black
--palette-sakura-pink
/* ...and 9 more palette colors */
```

### File Sizes
- **Default theme**: ~1KB (minimal CSS)
- **Focusan theme**: ~4KB (includes custom animations & patterns)

Both are extremely lightweight and load instantly.

---

## Creating Your Own Theme

See [THEME_GUIDE.md](THEME_GUIDE.md) for complete instructions on creating custom themes.

**Quick start:**
1. Create `src/shared/themes/mytheme.ts`
2. Define colors, typography, effects
3. Register in `src/shared/themes/index.ts`
4. Build and enjoy!

Adding a theme takes **less than 5 minutes** thanks to the flexible architecture.
