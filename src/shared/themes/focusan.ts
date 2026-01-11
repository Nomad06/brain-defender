/**
 * Focusan Theme (formerly Japanese Zen)
 * Inspired by traditional Japanese aesthetics: Wabi-sabi, Ma, Seigaiha
 * Color palette: Nippon Iro (Traditional Japanese Colors)
 */

import type { Theme } from './types'

export const focusanTheme: Theme = {
    metadata: {
        id: 'focusan',
        name: 'Focusan',
        description: 'Minimalist design inspired by Japanese aesthetic principles',
        emoji: '🇯🇵',
        author: 'Brain Defender',
        version: '2.0.0',
    },

    colors: {
        // Backgrounds
        bg1: '#F9F9F7', // Washi (Rice Paper) - warm off-white
        bg2: '#F0F0F0', // Sumi Light (Light Ink Wash)
        card: '#FFFFFF',
        card2: '#FAFAF8',

        // Text
        text: '#0F1A2A', // Kachi-iro (Winning Color/Dark Indigo)
        muted: '#8C8C8C', // Stone Grey

        // UI Elements
        border: 'rgba(0, 0, 0, 0.08)',
        accent: '#274C77', // Seigaiha (Deep Ocean Blue)
        accent2: '#E0F2F1', // Mizu (Water/Light Cyan) - for hover states
        danger: '#C44536', // Akabeni (Vermilion Red)
        success: '#4A6E46', // Take (Bamboo Green)
        gold: '#D4AF37', // Gold - Kintsugi accent

        // Extended palette for advanced usage
        palette: {
            indigo: '#0F1A2A',
            ocean: '#274C77',
            water: '#E0F2F1',
            bamboo: '#4A6E46',
            vermilion: '#C44536',
            stone: '#8C8C8C',
            gold: '#D4AF37',
            washi: '#F9F9F7',
            sumi: '#F0F0F0',
        },
    },

    typography: {
        sans: "'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace",
    },

    effects: {
        shadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        shadowLg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        radius: '8px',
        radiusLg: '12px',
    },

    animations: {
        available: ['fadeInUp', 'fadeIn', 'breath', 'breathInner'],
    },

    customCSS: `
    /* Focusan Theme Custom Styles */

    /* Font Loading */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Noto+Sans+JP:wght@300;400;500;600&family=Noto+Serif+JP:wght@400;700&display=swap');

    /* Additional CSS Variables */
    :root[data-theme="focusan"] {
      /* Spacing Scale (8px base) */
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
      --spacing-2xl: 48px;

      /* Additional shadows */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-float: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

      /* Border Radius Variants */
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-full: 9999px;

      /* Transitions */
      --transition-fast: 0.15s ease-out;
      --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      /* Typography - Serif for Zen content */
      --font-serif: 'Noto Serif JP', serif;

      /* Specific color names for semantic use */
      --color-ai-indigo: #0F1A2A;
      --color-seigaiha: #274C77;
      --color-mizu: #E0F2F1;
      --color-washi: #F9F9F7;
      --color-sumi-light: #F0F0F0;
      --color-take: #4A6E46;
      --color-akabeni: #C44536;
      --color-stone: #8C8C8C;
      --color-gold: #D4AF37;
    }

    /* Global Enhancements */
    [data-theme="focusan"] body {
      background-color: var(--color-washi);
      color: var(--color-ai-indigo);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Breathing Animation for Blocked Page */
    @keyframes breath {
      0% {
        transform: scale(0.8);
        opacity: 0.1;
      }
      100% {
        transform: scale(1.2);
        opacity: 0.2;
      }
    }

    @keyframes breathInner {
      0% {
        transform: scale(0.9);
      }
      100% {
        transform: scale(1.1);
      }
    }

    /* Fade In Up Animation (Staggered) */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Simple Fade In */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Button Enhancements */
    [data-theme="focusan"] button {
      border-radius: var(--radius-full);
      transition: all var(--transition-normal);
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    [data-theme="focusan"] button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-float);
    }

    [data-theme="focusan"] button:active {
      transform: translateY(0);
    }

    /* Card Enhancements */
    [data-theme="focusan"] .card,
    [data-theme="focusan"] [class*="card"] {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.02);
      box-shadow: var(--shadow-sm);
      border-radius: var(--radius-md);
    }

    /* Input Enhancements */
    [data-theme="focusan"] input,
    [data-theme="focusan"] select,
    [data-theme="focusan"] textarea {
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      transition: var(--transition-fast);
    }

    [data-theme="focusan"] input:focus,
    [data-theme="focusan"] select:focus,
    [data-theme="focusan"] textarea:focus {
      outline: none;
      border-color: var(--color-seigaiha);
      box-shadow: 0 0 0 3px rgba(39, 76, 119, 0.1);
    }

    /* Tabular Numbers for Timers/Stats */
    [data-theme="focusan"] .timer,
    [data-theme="focusan"] .stat,
    [data-theme="focusan"] [class*="time"],
    [data-theme="focusan"] [class*="count"] {
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }

    /* Serif Font for Zen Content */
    [data-theme="focusan"] .zen-quote,
    [data-theme="focusan"] .kanji,
    [data-theme="focusan"] .quote,
    [data-theme="focusan"] [data-zen] {
      font-family: var(--font-serif);
    }

    /* Subtle Animations */
    [data-theme="focusan"] * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Reduce motion for accessibility */
    @media (prefers-reduced-motion: reduce) {
      [data-theme="focusan"] * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `,
}
