/**
 * Caucasus Theme - Mountain & Ingush Tower Aesthetic
 * Inspired by Caucasus mountains, Ingush architecture, and djigit spirit
 */

import type { Theme } from './types'
import { caucasusContentConfig } from './content-config'

export const caucasusTheme: Theme = {
  metadata: {
    id: 'caucasus',
    name: 'Caucasus - Кавказ',
    description: 'Mountain strength and warrior spirit with authentic Ingush tower architecture',
    emoji: '🏔️',
    version: '1.1.0',
    author: 'Inspired by Caucasus Mountains and Ingush Heritage',
  },

  colors: {
    // Main semantic colors - stone and mountain palette
    bg1: '#e8e4de', // light stone
    bg2: '#d4cfc5', // weathered stone
    card: '#f5f3ef', // light tower stone
    card2: '#ebe7df', // aged stone
    text: '#1a1a1a', // deep charcoal
    muted: '#5a5550', // stone shadow
    border: '#b8b3ab', // stone edge
    accent: '#4a6fa5', // mountain blue
    accent2: '#3d5a7a', // deep sky
    danger: '#8b4645', // terracotta
    success: '#5a7a47', // mountain meadow
    gold: '#d4af37', // traditional jewelry

    // Extended Caucasian palette
    palette: {
      'light-stone': '#e8e4de',
      'weathered-stone': '#d4cfc5',
      'tower-stone': '#f5f3ef',
      'aged-stone': '#ebe7df',
      'dark-stone': '#5a6b7a',
      'mountain-blue': '#4a6fa5',
      'deep-sky': '#3d5a7a',
      'eagle-brown': '#6b5a4d',
      'terracotta': '#8b4645',
      'meadow-green': '#5a7a47',
      'golden-accent': '#d4af37',
      'snow-white': '#f8f8f6',
      'charcoal': '#1a1a1a',
    },
  },

  typography: {
    sans: '"Inter", "PT Sans", "Roboto", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    mono: '"JetBrains Mono", "PT Mono", "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  effects: {
    shadow: '0 2px 12px rgba(0,0,0,.08)', // Stone depth
    shadowLg: '0 8px 40px rgba(0,0,0,.15)', // Tower shadow
    radius: '4px', // Angular like tower architecture
    radiusLg: '8px',
  },

  animations: {
    available: ['eagleFlight', 'mountainRise', 'starTwinkle', 'stoneStability', 'signalBeacon'],
  },

  // Custom CSS for Caucasian/Ingush aesthetics
  customCSS: `
    /* Stone Texture Pattern */
    .stone-texture {
      background-color: var(--bg1);
      background-image:
        repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(90, 107, 122, 0.04) 35px, rgba(90, 107, 122, 0.04) 70px),
        repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(90, 107, 122, 0.03) 35px, rgba(90, 107, 122, 0.03) 70px);
    }

    /* Tower Border Pattern - vertical emphasis like Ingush towers */
    .tower-border {
      border: 2px solid var(--border);
      border-left: 4px solid var(--accent);
      border-right: 4px solid var(--accent);
      position: relative;
    }

    .tower-border::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg,
        var(--accent) 0%,
        var(--palette-golden-accent) 50%,
        var(--accent) 100%
      );
    }

    /* Mountain Silhouette Background */
    .mountain-bg {
      position: relative;
      overflow: hidden;
    }

    .mountain-bg::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(to bottom, transparent, var(--palette-dark-stone));
      clip-path: polygon(
        0% 100%,
        0% 60%,
        10% 65%,
        20% 50%,
        30% 55%,
        40% 30%,
        50% 20%,
        60% 30%,
        70% 45%,
        80% 50%,
        90% 65%,
        100% 60%,
        100% 100%
      );
      opacity: 0.1;
      z-index: 0;
    }

    /* Enhanced Mountain with Tower Positions */
    .mountain-with-towers {
      position: relative;
      overflow: hidden;
    }

    .mountain-with-towers::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 250px;
      background: linear-gradient(to bottom, transparent 0%, var(--palette-dark-stone) 100%);
      clip-path: polygon(
        /* Mountain range with strategic tower positions */
        0% 100%,
        0% 70%,
        8% 75%,
        15% 55%,    /* Tower valley entrance */
        22% 60%,
        30% 35%,
        40% 25%,    /* Tower crossroads */
        50% 20%,    /* Peak tower */
        60% 30%,    /* Tower ford */
        70% 50%,
        80% 55%,
        90% 70%,
        100% 65%,
        100% 100%
      );
      opacity: 0.12;
      z-index: 0;
    }

    /* Tower markers on mountains (small peaks) */
    .mountain-with-towers::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 250px;
      background:
        /* Tower 1 - valley entrance */
        radial-gradient(circle 3px at 15% 45%, var(--palette-golden-accent), transparent),
        /* Tower 2 - crossroads */
        radial-gradient(circle 3px at 40% 15%, var(--palette-golden-accent), transparent),
        /* Tower 3 - peak */
        radial-gradient(circle 4px at 50% 10%, var(--palette-golden-accent), transparent),
        /* Tower 4 - ford */
        radial-gradient(circle 3px at 60% 20%, var(--palette-golden-accent), transparent);
      opacity: 0.2;
      z-index: 1;
      pointer-events: none;
    }

    /* Ingush Tower Silhouette - Authentic Trapezoid Shape */
    .ingush-tower {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 100px;
      /* Truncated pyramid - walls slope inward (authentic design) */
      clip-path: polygon(
        15% 0,      /* Top-left (narrower) */
        85% 0,      /* Top-right (narrower) */
        100% 100%,  /* Bottom-right (wider) */
        0% 100%     /* Bottom-left (wider) */
      );
      background: linear-gradient(to bottom,
        var(--palette-dark-stone) 0%,
        var(--palette-weathered-stone) 100%
      );
      border: 2px solid var(--border);
    }

    /* Flat roof with crenellations (battlements) - authentic design */
    .ingush-tower::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 5px;
      right: 5px;
      height: 8px;
      background: repeating-linear-gradient(
        90deg,
        var(--palette-dark-stone) 0px,
        var(--palette-dark-stone) 8px,
        transparent 8px,
        transparent 12px
      );
    }

    /* Arrow slits (loopholes) on multiple floors - defensive feature */
    .ingush-tower::after {
      content: '';
      position: absolute;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 10px;
      background: var(--palette-charcoal);
      box-shadow:
        0 20px 0 var(--palette-charcoal),
        0 40px 0 var(--palette-charcoal),
        0 60px 0 var(--palette-charcoal);
    }

    /* Geometric Pattern (traditional Caucasian motifs) */
    .caucasian-pattern {
      background-image:
        linear-gradient(45deg, var(--palette-golden-accent) 12%, transparent 12%, transparent 88%, var(--palette-golden-accent) 88%),
        linear-gradient(-45deg, var(--palette-golden-accent) 12%, transparent 12%, transparent 88%, var(--palette-golden-accent) 88%);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
      opacity: 0.05;
    }

    /* Authentic Stone Block Pattern - Ingush tower construction */
    .stone-bricks {
      background-color: var(--palette-weathered-stone);
      background-image:
        /* Horizontal mortar lines (stacked stones) */
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 28px,
          rgba(90, 107, 122, 0.15) 28px,
          rgba(90, 107, 122, 0.15) 30px
        ),
        /* Vertical offset for staggered blocks */
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 60px,
          rgba(90, 107, 122, 0.12) 60px,
          rgba(90, 107, 122, 0.12) 62px
        );
      background-blend-mode: multiply;
    }

    /* Tower stone blocks - for cards and containers */
    .tower-stone-blocks {
      background-color: var(--palette-tower-stone);
      background-image:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 28px,
          rgba(90, 107, 122, 0.15) 28px,
          rgba(90, 107, 122, 0.15) 30px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 60px,
          rgba(90, 107, 122, 0.12) 60px,
          rgba(90, 107, 122, 0.12) 62px
        );
      background-blend-mode: multiply;
    }

    /* Eagle Flight Animation */
    @keyframes eagleFlight {
      0% {
        transform: translateX(-100%) translateY(0) scale(0.8);
        opacity: 0;
      }
      25% {
        opacity: 1;
      }
      75% {
        opacity: 1;
      }
      100% {
        transform: translateX(100vw) translateY(-50px) scale(1);
        opacity: 0;
      }
    }

    .eagle-flight {
      animation: eagleFlight 20s ease-in-out infinite;
    }

    /* Mountain Rise Animation */
    @keyframes mountainRise {
      0% {
        transform: translateY(20px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .mountain-rise {
      animation: mountainRise 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    /* Star Twinkle Animation */
    @keyframes starTwinkle {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    .star-twinkle {
      animation: starTwinkle 2s ease-in-out infinite;
    }

    /* Stone Stability (subtle pulse) */
    @keyframes stoneStability {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }

    .stone-stability {
      animation: stoneStability 4s ease-in-out infinite;
    }

    /* Signal Beacon Animation (tower alert system) */
    @keyframes signalBeacon {
      0%, 100% {
        opacity: 0.3;
        transform: translateY(0) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateY(-10px) scale(1.3);
      }
    }

    .tower-signal {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background: radial-gradient(
        circle,
        var(--palette-golden-accent) 0%,
        rgba(212, 175, 55, 0.5) 40%,
        transparent 70%
      );
      animation: signalBeacon 2.5s ease-in-out infinite;
      filter: blur(4px);
      pointer-events: none;
    }

    /* Tower with active signal */
    .ingush-tower.tower-alerting .tower-signal {
      display: block;
    }

    /* Caucasus-specific button styling */
    .caucasus-btn {
      background: linear-gradient(135deg, var(--palette-mountain-blue), var(--palette-deep-sky));
      border: 2px solid var(--border);
      color: var(--palette-snow-white);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .caucasus-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s ease;
    }

    .caucasus-btn:hover::before {
      left: 100%;
    }

    .caucasus-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(74, 111, 165, 0.3);
      border-color: var(--palette-golden-accent);
    }

    /* Warrior Card Styling */
    .warrior-card {
      background: var(--card);
      border: 2px solid var(--border);
      border-left: 4px solid var(--accent);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .warrior-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, var(--palette-golden-accent) 0%, transparent 70%);
      opacity: 0.05;
      pointer-events: none;
    }

    /* Defensive Card - with arrow slits pattern */
    .defensive-card {
      position: relative;
      background: var(--card);
      border: 2px solid var(--border);
      border-left: 5px solid var(--accent);
      padding: 1.5rem;
    }

    .defensive-card::before,
    .defensive-card::after {
      content: '';
      position: absolute;
      right: 15px;
      width: 4px;
      height: 20px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        var(--palette-dark-stone) 30%,
        var(--palette-dark-stone) 70%,
        transparent 100%
      );
      opacity: 0.3;
    }

    .defensive-card::before {
      top: 25%;
    }

    .defensive-card::after {
      top: 55%;
    }

    /* Honor Line (decorative element) */
    .honor-line {
      height: 3px;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--accent) 20%,
        var(--palette-golden-accent) 50%,
        var(--accent) 80%,
        transparent 100%
      );
      margin: 1rem 0;
    }

    /* Mountain Quote Styling */
    .mountain-quote {
      font-family: var(--font-sans);
      font-size: 1.25rem;
      line-height: 1.6;
      color: var(--text);
      font-weight: 500;
      position: relative;
      padding-left: 1.5rem;
      border-left: 4px solid var(--accent);
      margin: 1.5rem 0;
    }

    .mountain-quote::before {
      content: '⛰️';
      position: absolute;
      left: -0.75rem;
      top: -0.5rem;
      font-size: 1.5rem;
      opacity: 0.6;
    }

    /* Djigit Phrase Styling */
    .djigit-phrase {
      background: linear-gradient(135deg, var(--card), var(--card2));
      border: 2px solid var(--border);
      border-top: 3px solid var(--palette-golden-accent);
      padding: 1.25rem;
      text-align: center;
      font-weight: 600;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      position: relative;
    }

    .djigit-phrase::after {
      content: '🦅';
      position: absolute;
      top: -1rem;
      right: 1rem;
      font-size: 1.5rem;
      opacity: 0.4;
    }

    /* Tower Shadow Effect */
    .tower-shadow {
      box-shadow:
        0 4px 6px rgba(0,0,0,.1),
        0 1px 3px rgba(0,0,0,.08),
        inset 0 -2px 0 rgba(0,0,0,.05);
    }

    /* Strength Indicator (progress bars, etc) */
    .strength-indicator {
      background: var(--palette-dark-stone);
      height: 8px;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }

    .strength-indicator::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--palette-golden-accent));
      transition: width 0.3s ease;
    }

    /* Caucasus transition */
    .caucasus-transition {
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    /* Page-specific styling */
    body[data-theme="caucasus"] {
      background: var(--bg1);
    }

    body[data-theme="caucasus"]::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(74, 111, 165, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.02) 0%, transparent 50%);
      pointer-events: none;
      z-index: -1;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .mountain-quote {
        font-size: 1.1rem;
        padding-left: 1rem;
      }

      .djigit-phrase {
        font-size: 1rem;
        padding: 1rem;
      }

      .ingush-tower {
        width: 30px;
        height: 60px;
      }
    }
  `,

  contentConfig: caucasusContentConfig,
}
