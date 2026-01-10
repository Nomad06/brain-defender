/**
 * Focusan Theme - Japanese Aesthetic Style
 * Traditional Japanese design with washi paper, sumi ink, and zen elements
 */

import type { Theme } from './types'

export const focusanTheme: Theme = {
  metadata: {
    id: 'focusan',
    name: 'Focusan - 集中',
    description: 'Japanese-inspired design with traditional aesthetics',
    emoji: '⛩️',
    version: '1.0.0',
    author: 'Inspired by Japanese Zen and Bushido',
  },

  colors: {
    // Main semantic colors
    bg1: '#faf7f2', // washi-white
    bg2: '#ffffff', // shiro-white
    card: '#ffffff',
    card2: '#f5f1e8', // kinari-cream
    text: '#1a1a1a', // sumi-black
    muted: '#4a4a4a', // sumi-gray
    border: '#d8d8d8', // mist-gray
    accent: '#2e5f6f', // seiheki-blue
    accent2: '#165e83', // ai-indigo
    danger: '#c73e3a', // beni-red
    success: '#6b8e23', // bamboo-green
    gold: '#d4af37', // gold-accent

    // Extended Japanese palette
    palette: {
      'washi-white': '#faf7f2',
      'shiro-white': '#ffffff',
      'sumi-black': '#1a1a1a',
      'sumi-gray': '#4a4a4a',
      'kinari-cream': '#f5f1e8',
      'seiheki-blue': '#2e5f6f',
      'ai-indigo': '#165e83',
      'beni-red': '#c73e3a',
      'sakura-pink': '#ffc0cb',
      'gold-accent': '#d4af37',
      'bamboo-green': '#6b8e23',
      'mist-gray': '#d8d8d8',
    },
  },

  typography: {
    sans: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", ui-sans-serif, system-ui, -apple-system, Arial, sans-serif',
    mono: '"Noto Sans Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  effects: {
    shadow: '0 2px 8px rgba(0,0,0,.04)', // Subtle like shoji screens
    shadowLg: '0 8px 32px rgba(0,0,0,.08)', // Soft depth
    radius: '8px', // Less rounded, more Japanese
    radiusLg: '12px',
  },

  animations: {
    available: ['inkStroke', 'sakuraFall', 'zenRipple', 'fadeIn'],
  },

  // Custom CSS for Japanese aesthetics
  customCSS: `
    /* Japanese Wave Pattern Background */
    .japanese-wave-bg {
      background-image: radial-gradient(circle at 100% 150%, var(--palette-seiheki-blue) 24%, var(--palette-washi-white) 25%, var(--palette-washi-white) 28%, var(--palette-seiheki-blue) 29%, var(--palette-seiheki-blue) 36%, var(--palette-washi-white) 36%, var(--palette-washi-white) 40%, transparent 40%, transparent),
                        radial-gradient(circle at 0 150%, var(--palette-seiheki-blue) 24%, var(--palette-washi-white) 25%, var(--palette-washi-white) 28%, var(--palette-seiheki-blue) 29%, var(--palette-seiheki-blue) 36%, var(--palette-washi-white) 36%, var(--palette-washi-white) 40%, transparent 40%, transparent),
                        radial-gradient(circle at 50% 100%, var(--palette-washi-white) 10%, var(--palette-seiheki-blue) 11%, var(--palette-seiheki-blue) 23%, var(--palette-washi-white) 24%, var(--palette-washi-white) 30%),
                        radial-gradient(circle at 100% 50%, var(--palette-washi-white) 5%, var(--palette-seiheki-blue) 6%, var(--palette-seiheki-blue) 15%, var(--palette-washi-white) 16%, var(--palette-washi-white) 20%),
                        radial-gradient(circle at 0 50%, var(--palette-washi-white) 5%, var(--palette-seiheki-blue) 6%, var(--palette-seiheki-blue) 15%, var(--palette-washi-white) 16%, var(--palette-washi-white) 20%),
                        radial-gradient(circle at 50% 50%, var(--palette-seiheki-blue) 7%, var(--palette-washi-white) 8%, var(--palette-washi-white) 12%, var(--palette-seiheki-blue) 13%, var(--palette-seiheki-blue) 18%, var(--palette-washi-white) 19%, var(--palette-washi-white) 20%);
      background-size: 100px 50px;
      background-color: var(--palette-washi-white);
      opacity: 0.15;
    }

    /* Washi Paper Texture */
    .washi-texture {
      background-color: var(--bg1);
      background-image:
        linear-gradient(90deg, transparent 79px, rgba(218, 218, 218, 0.03) 79px, rgba(218, 218, 218, 0.03) 81px, transparent 81px),
        linear-gradient(transparent 79px, rgba(218, 218, 218, 0.03) 79px, rgba(218, 218, 218, 0.03) 81px, transparent 81px),
        linear-gradient(transparent, rgba(234, 234, 234, 0.05) 50%, transparent 50%);
      background-size: 81px 81px, 81px 81px, 100% 2px;
    }

    /* Bamboo Grid Pattern */
    .bamboo-grid {
      background-image:
        linear-gradient(rgba(107, 142, 35, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(107, 142, 35, 0.05) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* Ink Stroke Animation */
    @keyframes inkStroke {
      0% {
        transform: scaleX(0);
        transform-origin: left;
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: scaleX(1);
        transform-origin: left;
      }
    }

    /* Sakura Fall Animation */
    @keyframes sakuraFall {
      0% {
        transform: translateY(-10px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }

    /* Zen Ripple Animation */
    @keyframes zenRipple {
      0% {
        transform: scale(0);
        opacity: 0.8;
      }
      100% {
        transform: scale(4);
        opacity: 0;
      }
    }

    /* Japanese Title Styling */
    .japanese-title {
      font-family: var(--font-sans);
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--accent);
    }

    /* Torii Gate Styling */
    .torii-gate {
      font-size: 2rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    /* Zen Card Styling */
    .zen-card {
      background: var(--card);
      border: 2px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .zen-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg,
        var(--accent) 0%,
        var(--palette-sakura-pink) 50%,
        var(--accent) 100%);
    }

    /* Haiku Styling */
    .haiku-text {
      font-family: var(--font-sans);
      font-style: italic;
      line-height: 1.8;
      color: var(--muted);
      text-align: center;
      padding: 1rem;
      border-left: 3px solid var(--accent);
      background: linear-gradient(to right,
        rgba(46, 95, 111, 0.05) 0%,
        transparent 100%);
    }

    /* Gold Accent Elements */
    .gold-accent {
      color: var(--gold);
      text-shadow: 0 1px 2px rgba(212, 175, 55, 0.3);
    }

    /* Samurai Quote Styling */
    .samurai-quote {
      font-weight: 600;
      color: var(--text);
      border-top: 2px solid var(--accent);
      border-bottom: 2px solid var(--accent);
      padding: 1rem 0;
      margin: 1rem 0;
      text-align: center;
      background: linear-gradient(to bottom,
        transparent 0%,
        rgba(46, 95, 111, 0.03) 50%,
        transparent 100%);
    }
  `,
}
