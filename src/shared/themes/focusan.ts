/**
 * Focusan Theme - Japanese Aesthetic Style
 * Traditional Japanese design with washi paper, sumi ink, and zen elements
 */

import type { Theme } from './types'
import { focusanContentConfig } from './content-config'

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
    sans: '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "MS PGothic", ui-sans-serif, system-ui, -apple-system, Arial, sans-serif',
    mono: '"Noto Sans Mono", "Hiragino Sans", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

    /* Serif Typography for Japanese Poetry */
    .japanese-serif {
      font-family: "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "HG Mincho E", "MS Mincho", "MS PMincho", Georgia, serif;
      font-weight: 400;
      letter-spacing: 0.03em;
    }

    /* Vertical Japanese Text Support */
    .tategaki {
      writing-mode: vertical-rl;
      text-orientation: upright;
    }

    /* Japanese Quotation Marks Styling */
    .japanese-quote {
      position: relative;
      padding: 0 0.5em;
    }

    .japanese-quote::before {
      content: '「';
      color: var(--accent);
      font-weight: 700;
    }

    .japanese-quote::after {
      content: '」';
      color: var(--accent);
      font-weight: 700;
    }

    /* Enso Circle (Zen Circle) */
    .enso-circle {
      width: 100px;
      height: 100px;
      border: 3px solid var(--accent);
      border-radius: 50%;
      position: relative;
      opacity: 0.6;
      /* Imperfect circle like hand-drawn enso */
      border-top-left-radius: 48% 52%;
      border-top-right-radius: 52% 48%;
      border-bottom-right-radius: 48% 52%;
      border-bottom-left-radius: 52% 48%;
    }

    /* Sakura Petal Decoration */
    .sakura-petal {
      position: relative;
      display: inline-block;
    }

    .sakura-petal::before {
      content: '🌸';
      position: absolute;
      font-size: 0.7em;
      opacity: 0.3;
      animation: sakuraFall 8s infinite ease-in-out;
    }

    /* Torii Gate Shadow */
    .torii-shadow {
      filter: drop-shadow(0 4px 8px rgba(46, 95, 111, 0.2));
      transition: filter 0.3s ease;
    }

    .torii-shadow:hover {
      filter: drop-shadow(0 8px 16px rgba(46, 95, 111, 0.3));
    }

    /* Japanese Mon (Family Crest) Circle */
    .mon-circle {
      width: 60px;
      height: 60px;
      border: 2px solid var(--accent);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 30% 30%,
        var(--palette-kinari-cream) 0%,
        var(--palette-washi-white) 100%);
    }

    /* Shoji Screen Divider */
    .shoji-divider {
      height: 2px;
      background: linear-gradient(to right,
        transparent 0%,
        var(--border) 10%,
        var(--border) 90%,
        transparent 100%);
      position: relative;
      margin: 2rem 0;
    }

    .shoji-divider::before,
    .shoji-divider::after {
      content: '';
      position: absolute;
      top: -4px;
      width: 10px;
      height: 10px;
      background: var(--accent);
      border-radius: 50%;
    }

    .shoji-divider::before { left: 10%; }
    .shoji-divider::after { right: 10%; }

    /* Kanji Character Highlight */
    .kanji-highlight {
      font-size: 1.2em;
      color: var(--accent);
      font-weight: 700;
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }

    /* Brush Stroke Border */
    .brush-border {
      position: relative;
      padding: 1rem;
    }

    .brush-border::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--accent) 10%,
        var(--accent) 90%,
        transparent 100%);
      opacity: 0.8;
    }

    /* Meditation Glow Effect */
    .meditation-glow {
      box-shadow:
        0 0 20px rgba(46, 95, 111, 0.15),
        0 0 40px rgba(46, 95, 111, 0.1),
        inset 0 0 20px rgba(46, 95, 111, 0.05);
      animation: meditationPulse 4s ease-in-out infinite;
    }

    @keyframes meditationPulse {
      0%, 100% {
        box-shadow:
          0 0 20px rgba(46, 95, 111, 0.15),
          0 0 40px rgba(46, 95, 111, 0.1),
          inset 0 0 20px rgba(46, 95, 111, 0.05);
      }
      50% {
        box-shadow:
          0 0 30px rgba(46, 95, 111, 0.25),
          0 0 60px rgba(46, 95, 111, 0.15),
          inset 0 0 30px rgba(46, 95, 111, 0.08);
      }
    }

    /* Paper Lantern Effect */
    .paper-lantern {
      background: linear-gradient(135deg,
        var(--palette-washi-white) 0%,
        var(--palette-kinari-cream) 50%,
        var(--palette-washi-white) 100%);
      box-shadow:
        inset 0 1px 3px rgba(0, 0, 0, 0.05),
        0 4px 16px rgba(212, 175, 55, 0.2);
      border: 1px solid var(--palette-gold-accent);
    }

    /* Tatami Mat Texture */
    .tatami-texture {
      background-image:
        repeating-linear-gradient(0deg,
          transparent 0px,
          rgba(107, 142, 35, 0.02) 1px,
          transparent 2px,
          transparent 10px),
        repeating-linear-gradient(90deg,
          transparent 0px,
          rgba(107, 142, 35, 0.02) 1px,
          transparent 2px,
          transparent 10px);
      background-color: var(--palette-kinari-cream);
    }

    /* Calligraphy Ink Drip Effect */
    .ink-drip {
      position: relative;
    }

    .ink-drip::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      width: 2px;
      height: 10px;
      background: linear-gradient(to bottom,
        var(--text) 0%,
        transparent 100%);
      opacity: 0.3;
    }

    /* Focus Mode Indicator */
    [data-theme="focusan"] body {
      position: relative;
    }

    /* Seasonal Accent Colors (applied via data attributes) */
    [data-season="spring"] .seasonal-accent {
      color: var(--palette-sakura-pink);
    }

    [data-season="summer"] .seasonal-accent {
      color: var(--palette-bamboo-green);
    }

    [data-season="autumn"] .seasonal-accent {
      color: #d66a4c; /* Maple red */
    }

    [data-season="winter"] .seasonal-accent {
      color: #5a79a5; /* Winter blue */
    }
  `,

  // Content configuration for blocked pages
  contentConfig: focusanContentConfig,
}
