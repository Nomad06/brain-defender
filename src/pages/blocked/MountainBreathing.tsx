/**
 * Mountain Breathing Exercise - Горное дыхание
 * Canvas-based breathing visualization with mountain imagery
 * Inspired by high-altitude breathing techniques
 */

import { useRef, useEffect, useState } from 'react'
import { t } from '../../shared/i18n'

interface MountainBreathingProps {
  width?: number
  height?: number
  onComplete?: () => void
}

interface BreathPhase {
  name: 'inhale' | 'hold' | 'exhale' | 'pause' | 'completion'
  duration: number // milliseconds
  scale: number // mountain height scale (0.5 to 1.0)
}

// Mountain breathing phases - based on high-altitude breathing
// Longer holds simulate thin mountain air adaptation
const MOUNTAIN_BREATH_PHASES: BreathPhase[] = [
  // Cycle 1
  { name: 'inhale', duration: 4000, scale: 1.0 },   // Deep breath - 4s
  { name: 'hold', duration: 7000, scale: 1.0 },     // Hold at peak - 7s
  { name: 'exhale', duration: 8000, scale: 0.5 },   // Slow descent - 8s
  { name: 'pause', duration: 2000, scale: 0.5 },    // Rest - 2s

  // Cycle 2
  { name: 'inhale', duration: 4000, scale: 1.0 },
  { name: 'hold', duration: 7000, scale: 1.0 },
  { name: 'exhale', duration: 8000, scale: 0.5 },
  { name: 'pause', duration: 2000, scale: 0.5 },

  // Cycle 3
  { name: 'inhale', duration: 4000, scale: 1.0 },
  { name: 'hold', duration: 7000, scale: 1.0 },
  { name: 'exhale', duration: 8000, scale: 0.5 },

  // Completion
  { name: 'completion', duration: 2000, scale: 0.5 }
]

const TOTAL_DURATION = MOUNTAIN_BREATH_PHASES.reduce((sum, phase) => sum + phase.duration, 0)

export default function MountainBreathing({
  width = 600,
  height = 400,
  onComplete
}: MountainBreathingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<string>('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Start animation
    startTimeRef.current = performance.now()
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const elapsed = performance.now() - startTimeRef.current
    const progressPct = Math.min(elapsed / TOTAL_DURATION, 1)
    setProgress(progressPct)

    // Determine current phase
    let accumulatedTime = 0
    let currentPhaseData: BreathPhase = MOUNTAIN_BREATH_PHASES[0]
    let phaseProgress = 0

    for (const phase of MOUNTAIN_BREATH_PHASES) {
      if (elapsed < accumulatedTime + phase.duration) {
        currentPhaseData = phase
        phaseProgress = (elapsed - accumulatedTime) / phase.duration
        break
      }
      accumulatedTime += phase.duration
    }

    // Update phase text
    setCurrentPhase(t(`exercises.mountain${currentPhaseData.name.charAt(0).toUpperCase() + currentPhaseData.name.slice(1)}`))

    // Calculate mountain scale based on phase transition
    let mountainScale: number
    const prevPhaseIndex = MOUNTAIN_BREATH_PHASES.indexOf(currentPhaseData) - 1
    const prevPhase = prevPhaseIndex >= 0 ? MOUNTAIN_BREATH_PHASES[prevPhaseIndex] : currentPhaseData

    // Smooth transition between scales
    if (currentPhaseData.name === 'inhale') {
      mountainScale = prevPhase.scale + (currentPhaseData.scale - prevPhase.scale) * easeInOutCubic(phaseProgress)
    } else if (currentPhaseData.name === 'exhale') {
      mountainScale = prevPhase.scale + (currentPhaseData.scale - prevPhase.scale) * easeInOutCubic(phaseProgress)
    } else {
      mountainScale = currentPhaseData.scale
    }

    // Draw scene
    drawScene(ctx, canvas.width, canvas.height, mountainScale, phaseProgress, currentPhaseData.name)

    // Check completion
    if (elapsed >= TOTAL_DURATION) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const drawScene = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    mountainScale: number,
    phaseProgress: number,
    phaseName: string
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, w, h)

    // Sky gradient (changes with breathing)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h)

    // Sky color shifts based on mountain scale (dawn to day to dusk feel)
    if (mountainScale > 0.8) {
      // Peak - bright sky
      skyGradient.addColorStop(0, '#87CEEB') // Sky blue
      skyGradient.addColorStop(0.5, '#B0D4E3')
      skyGradient.addColorStop(1, '#D4E4ED')
    } else {
      // Valley - softer sky
      skyGradient.addColorStop(0, '#6FA8DC')
      skyGradient.addColorStop(0.5, '#9ABCD7')
      skyGradient.addColorStop(1, '#C5D9E8')
    }

    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, w, h)

    // Stars (visible during hold at peak)
    if (phaseName === 'hold' && mountainScale > 0.9) {
      drawStars(ctx, w, h, phaseProgress)
    }

    // Clouds (moving)
    drawClouds(ctx, w, h)

    // Mountain silhouette (main breathing visualization)
    drawMountain(ctx, w, h, mountainScale)

    // Foreground stones/rocks
    drawStones(ctx, w, h)
  }

  const drawMountain = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    scale: number
  ) => {
    const baseHeight = h * 0.4
    const peakHeight = baseHeight + (h * 0.4) * scale
    const centerX = w / 2

    ctx.save()

    // Mountain silhouette (multiple peaks for Caucasus feel)
    ctx.beginPath()
    ctx.moveTo(0, h)

    // Left mountain
    ctx.lineTo(w * 0.15, h - baseHeight * 0.6)
    ctx.lineTo(w * 0.25, h - baseHeight * 0.7)

    // Main peak (center)
    ctx.lineTo(w * 0.4, h - peakHeight * 0.8)
    ctx.lineTo(centerX, h - peakHeight) // Main peak
    ctx.lineTo(w * 0.6, h - peakHeight * 0.8)

    // Right mountain
    ctx.lineTo(w * 0.75, h - baseHeight * 0.7)
    ctx.lineTo(w * 0.85, h - baseHeight * 0.6)

    ctx.lineTo(w, h)
    ctx.closePath()

    // Mountain gradient (stone colors)
    const mountainGradient = ctx.createLinearGradient(0, h - peakHeight, 0, h)
    mountainGradient.addColorStop(0, '#5A6B7A') // Dark stone at peak
    mountainGradient.addColorStop(0.5, '#6B7C8C')
    mountainGradient.addColorStop(1, '#8A9AA8') // Lighter stone at base

    ctx.fillStyle = mountainGradient
    ctx.fill()

    // Mountain outline (stronger definition)
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Snow cap on main peak (when at high scale)
    if (scale > 0.7) {
      ctx.beginPath()
      ctx.moveTo(centerX - 40, h - peakHeight + 30)
      ctx.lineTo(centerX, h - peakHeight)
      ctx.lineTo(centerX + 40, h - peakHeight + 30)
      ctx.closePath()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
    }

    ctx.restore()
  }

  const drawClouds = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    const time = performance.now() / 3000 // Slow drift

    // Cloud 1
    drawCloud(ctx, (w * 0.2 + time * 20) % (w + 100) - 50, h * 0.2, 60, 0.4)

    // Cloud 2
    drawCloud(ctx, (w * 0.6 + time * 15) % (w + 100) - 50, h * 0.15, 80, 0.3)

    // Cloud 3
    drawCloud(ctx, (w * 0.8 + time * 25) % (w + 100) - 50, h * 0.25, 50, 0.35)
  }

  const drawCloud = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    opacity: number
  ) => {
    ctx.save()
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`

    // Simple cloud shape (3 circles)
    ctx.beginPath()
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y, size * 0.6, 0, Math.PI * 2)
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  const drawStars = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    phaseProgress: number
  ) => {
    // Small twinkling stars at peak altitude
    const starPositions = [
      [w * 0.1, h * 0.1],
      [w * 0.3, h * 0.05],
      [w * 0.5, h * 0.08],
      [w * 0.7, h * 0.12],
      [w * 0.85, h * 0.07],
      [w * 0.15, h * 0.18],
      [w * 0.9, h * 0.15]
    ]

    ctx.save()
    starPositions.forEach(([x, y], i) => {
      const twinkle = Math.sin(phaseProgress * Math.PI * 4 + i) * 0.5 + 0.5
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  const drawStones = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    // Foreground stones (static)
    const stones = [
      { x: w * 0.1, y: h * 0.85, size: 40 },
      { x: w * 0.85, y: h * 0.9, size: 35 },
      { x: w * 0.25, y: h * 0.92, size: 25 }
    ]

    ctx.save()
    stones.forEach(stone => {
      const gradient = ctx.createRadialGradient(
        stone.x - stone.size * 0.2,
        stone.y - stone.size * 0.2,
        0,
        stone.x,
        stone.y,
        stone.size
      )
      gradient.addColorStop(0, '#9CA8B3')
      gradient.addColorStop(1, '#5A6B7A')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(stone.x, stone.y, stone.size, stone.size * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()

      // Stone shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.beginPath()
      ctx.ellipse(stone.x + 5, stone.y + stone.size * 0.5, stone.size * 0.9, stone.size * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  // Easing function for smooth transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  return (
    <div className="mountain-breathing-container" style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '100%',
          height: 'auto'
        }}
      />

      <div style={{ marginTop: '1rem' }}>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '0.5rem',
            minHeight: '2rem'
          }}
        >
          {currentPhase}
        </div>

        <div
          className="progressBar"
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--card2)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: 'var(--accent)',
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--muted)'
          }}
        >
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  )
}
