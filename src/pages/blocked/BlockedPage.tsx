/**
 * Blocked Page for Brain Defender
 * Shown when user tries to access a blocked site
 * Includes exercises: eye training, breathing, and physical stretch
 * Theme-aware content display using abstraction layer
 */

import React, { useState, useEffect, useRef } from 'react'
import { t, initI18n, getCurrentLanguage } from '../../shared/i18n'
import { messagingClient } from '../../shared/messaging/client'
import { useThemeContent } from '../../shared/themes/useThemeContent'
import type { ExerciseType } from '../../shared/themes/content-config'
import { getRandomZenPhrase, getRandomZenQuote } from '../../shared/japanese-zen'
import ZenGarden from './ZenGarden'
import MountainBreathing from './MountainBreathing'

// Eye exercise trajectories
type TrajectoryPoint = { x: number; y: number }
type Trajectory = {
  name: string
  duration: number
  getPoint: (t: number, width: number, height: number) => TrajectoryPoint
}

const EYE_TRAJECTORIES: Trajectory[] = [
  {
    name: 'lemniscate',
    duration: 13000,
    getPoint: (t, width, height) => {
      const scale = Math.min(width, height) * 0.3
      const angle = t * Math.PI * 2
      const denom = 1 + Math.sin(angle) * Math.sin(angle)
      return {
        x: width / 2 + (scale * Math.cos(angle)) / denom,
        y: height / 2 + (scale * Math.sin(angle) * Math.cos(angle)) / denom,
      }
    },
  },
  {
    name: 'circle',
    duration: 12000,
    getPoint: (t, width, height) => {
      const radius = Math.min(width, height) * 0.3
      const angle = t * Math.PI * 2
      return {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      }
    },
  },
  {
    name: 'oval',
    duration: 13000,
    getPoint: (t, width, height) => {
      const radiusX = Math.min(width, height) * 0.35
      const radiusY = Math.min(width, height) * 0.2
      const angle = t * Math.PI * 2
      return {
        x: width / 2 + radiusX * Math.cos(angle + Math.PI / 4),
        y: height / 2 + radiusY * Math.sin(angle + Math.PI / 4),
      }
    },
  },
]

// Breathing phases
type BreathPhase = {
  name: string
  duration: number
  scale: number
}

const BREATH_PHASES: BreathPhase[] = [
  { name: 'inhale', duration: 4000, scale: 1.0 },
  { name: 'pause', duration: 2000, scale: 1.0 },
  { name: 'exhale', duration: 6000, scale: 0.3 },
  { name: 'inhale', duration: 4000, scale: 1.0 },
  { name: 'pause', duration: 2000, scale: 1.0 },
  { name: 'exhale', duration: 6000, scale: 0.3 },
  { name: 'completion', duration: 6000, scale: 0.6 },
]

const BlockedPage: React.FC = () => {
  const [activeExercise, setActiveExercise] = useState<ExerciseType | 'none'>('none')

  // Use theme content hook for abstraction
  const { contentConfig } = useThemeContent()

  // Japanese zen content (used when theme is japanese)
  const [zenPhrase] = useState(() => getRandomZenPhrase())
  const [zenQuote] = useState(() => getRandomZenQuote())
  const currentLanguage = getCurrentLanguage()

  // Eye exercise state
  const eyeCanvasRef = useRef<HTMLCanvasElement>(null)
  const eyeAnimationRef = useRef<number | null>(null)
  const [eyeProgress, setEyeProgress] = useState(0)

  // Breath exercise state
  const breathCanvasRef = useRef<HTMLCanvasElement>(null)
  const breathAnimationRef = useRef<number | null>(null)
  const [breathProgress, setBreathProgress] = useState(0)
  const [breathPhase, setBreathPhase] = useState('')

  useEffect(() => {
    // Initialize i18n
    initI18n()

    // Get blocked URL from query params
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url') || window.location.href
    let hostname = ''
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      hostname = url
    }

    // Record block in statistics
    if (hostname) {
      messagingClient.recordBlock(hostname).catch(err => {
        console.error('[Blocked] Failed to record block:', err)
      })
    }

    // Cleanup on unmount
    return () => {
      if (eyeAnimationRef.current) cancelAnimationFrame(eyeAnimationRef.current)
      if (breathAnimationRef.current) cancelAnimationFrame(breathAnimationRef.current)
    }
  }, [])

  const handleCloseTab = () => {
    window.close()
  }

  // Eye Exercise
  const startEyeExercise = () => {
    if (eyeAnimationRef.current) return
    setActiveExercise('eye')

    setTimeout(() => {
      const canvas = eyeCanvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.scale(dpr, dpr)

      const totalDuration = 38000
      const startTime = Date.now()
      const trail: TrajectoryPoint[] = []
      const maxTrailLength = 30

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)

        if (progress >= 1) {
          stopEyeExercise()
          return
        }

        // Find current trajectory
        let cumulativeTime = 0
        let currentTrajectory: Trajectory | null = null
        let localT = 0

        for (const traj of EYE_TRAJECTORIES) {
          if (elapsed < cumulativeTime + traj.duration) {
            currentTrajectory = traj
            localT = (elapsed - cumulativeTime) / traj.duration
            break
          }
          cumulativeTime += traj.duration
        }

        if (currentTrajectory) {
          const point = currentTrajectory.getPoint(localT, width, height)
          trail.push(point)
          if (trail.length > maxTrailLength) trail.shift()

          // Clear canvas
          ctx.clearRect(0, 0, width, height)

          // Draw trail
          if (trail.length > 1) {
            ctx.beginPath()
            ctx.strokeStyle = 'rgba(91, 141, 239, 0.2)'
            ctx.lineWidth = 2
            ctx.moveTo(trail[0].x, trail[0].y)
            for (let i = 1; i < trail.length; i++) {
              ctx.lineTo(trail[i].x, trail[i].y)
            }
            ctx.stroke()
          }

          // Draw dot with glow
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 20)
          gradient.addColorStop(0, 'rgba(91, 141, 239, 0.9)')
          gradient.addColorStop(0.5, 'rgba(91, 141, 239, 0.4)')
          gradient.addColorStop(1, 'rgba(91, 141, 239, 0)')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
          ctx.fill()

          // Draw core
          ctx.fillStyle = 'rgba(91, 141, 239, 1)'
          ctx.beginPath()
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
          ctx.fill()
        }

        setEyeProgress(progress * 100)
        eyeAnimationRef.current = requestAnimationFrame(animate)
      }

      eyeAnimationRef.current = requestAnimationFrame(animate)
    }, 50)
  }

  const stopEyeExercise = () => {
    if (eyeAnimationRef.current) {
      cancelAnimationFrame(eyeAnimationRef.current)
      eyeAnimationRef.current = null
    }
    setActiveExercise('none')
    setEyeProgress(0)
  }

  // Breath Exercise
  const startBreathExercise = () => {
    if (breathAnimationRef.current) return
    setActiveExercise('breath')

    setTimeout(() => {
      const canvas = breathCanvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)

      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      ctx.scale(dpr, dpr)

      const totalDuration = 30000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)

        if (progress >= 1) {
          stopBreathExercise()
          return
        }

        // Find current phase
        let cumulativeTime = 0
        let currentPhase: BreathPhase | null = null
        let localT = 0

        for (const phase of BREATH_PHASES) {
          if (elapsed < cumulativeTime + phase.duration) {
            currentPhase = phase
            localT = (elapsed - cumulativeTime) / phase.duration
            break
          }
          cumulativeTime += phase.duration
        }

        if (currentPhase) {
          // Translate phase name
          setBreathPhase(t(`exercises.${currentPhase.name}`))

          // Calculate scale with smooth interpolation
          let scale = currentPhase.scale
          if (currentPhase.name === 'inhale') {
            scale = 0.3 + localT * 0.7
          } else if (currentPhase.name === 'exhale') {
            scale = 1.0 - localT * 0.7
          } else if (currentPhase.name === 'completion') {
            scale = 0.3 + localT * 0.3
          }

          // Clear canvas
          ctx.clearRect(0, 0, size, size)

          const center = size / 2
          const baseRadius = size * 0.3
          const currentRadius = baseRadius * scale

          // Draw outer ring with gradient
          const gradient = ctx.createRadialGradient(
            center,
            center,
            currentRadius * 0.7,
            center,
            center,
            currentRadius
          )
          gradient.addColorStop(0, 'rgba(91, 141, 239, 0.3)')
          gradient.addColorStop(0.5, 'rgba(91, 141, 239, 0.5)')
          gradient.addColorStop(1, 'rgba(91, 141, 239, 0.2)')

          ctx.strokeStyle = gradient
          ctx.lineWidth = 8
          ctx.beginPath()
          ctx.arc(center, center, currentRadius, 0, Math.PI * 2)
          ctx.stroke()

          // Draw inner circle
          ctx.fillStyle = 'rgba(91, 141, 239, 0.15)'
          ctx.beginPath()
          ctx.arc(center, center, currentRadius * 0.7, 0, Math.PI * 2)
          ctx.fill()
        }

        setBreathProgress(progress * 100)
        breathAnimationRef.current = requestAnimationFrame(animate)
      }

      breathAnimationRef.current = requestAnimationFrame(animate)
    }, 50)
  }

  const stopBreathExercise = () => {
    if (breathAnimationRef.current) {
      cancelAnimationFrame(breathAnimationRef.current)
      breathAnimationRef.current = null
    }
    setActiveExercise('none')
    setBreathProgress(0)
    setBreathPhase('')
  }

  // Stretch Exercise
  const startStretchExercise = () => {
    setActiveExercise('stretch')
  }

  const stopStretchExercise = () => {
    setActiveExercise('none')
  }

  // Zen Garden Exercise
  const startZenExercise = () => {
    setActiveExercise('zen')
  }

  const stopZenExercise = () => {
    setActiveExercise('none')
  }

  // Mountain Breathing Exercise
  const startMountainExercise = () => {
    setActiveExercise('mountain')
  }

  const stopMountainExercise = () => {
    setActiveExercise('none')
  }

  return (
    <div
      className="washi-texture"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        color: 'var(--color-ai-indigo)',
        overflowX: 'hidden'
      }}
    >
      <style>{`
        @keyframes breath {
            0% { transform: scale(0.8); opacity: 0.1; }
            100% { transform: scale(1.2); opacity: 0.2; }
        }
        @keyframes breathInner {
            0% { transform: scale(0.9); }
            100% { transform: scale(1.1); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        `}</style>

      {/* Main Block Content */}
      <div className="block-container" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', position: 'relative' }}>
        <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>

          {/* Breathing Animation - Native CSS */}
          <div className="breath-container" style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '48px' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'rgba(39, 76, 119, 0.1)', animation: 'breath 4s ease-in-out infinite alternate' }}></div>
            <div style={{ position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', backgroundColor: 'var(--color-seigaiha)', opacity: 0.8, boxShadow: '0 0 30px rgba(39, 76, 119, 0.3)', animation: 'breathInner 4s ease-in-out infinite alternate' }}></div>
          </div>

          {/* Zen Message */}
          <h1 className="kanji-title" style={{ fontFamily: 'var(--font-family-serif)', fontSize: '5rem', lineHeight: 1, marginBottom: '8px', opacity: 0, animation: 'fadeInUp 1s ease-out forwards 0.5s' }}>
            {zenPhrase.kanji}
          </h1>
          <h2 className="subtitle" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-stone)', marginBottom: '24px', opacity: 0, animation: 'fadeInUp 1s ease-out forwards 0.8s' }}>
            {zenPhrase.romanji} — {currentLanguage === 'ru' ? zenPhrase.meaningRu : zenPhrase.meaning}
          </h2>

          <p className="message" style={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'var(--color-ai-indigo)', fontWeight: 300, marginBottom: '48px', opacity: 0, animation: 'fadeInUp 1s ease-out forwards 1.1s' }}>
            {(currentLanguage === 'ru' ? zenPhrase.messageRu : zenPhrase.message).split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </p>

          <button
            id="close-tab-btn"
            className="return-btn"
            onClick={handleCloseTab}
            style={{
              padding: '16px 40px', background: 'transparent', border: '1px solid var(--color-ai-indigo)',
              color: 'var(--color-ai-indigo)', fontSize: '1rem', letterSpacing: '0.05em', borderRadius: '9999px',
              cursor: 'pointer', transition: 'all 0.3s', opacity: 0, animation: 'fadeInUp 1s ease-out forwards 1.4s'
            }}
          >
            {t('common.close')}
          </button>

          <div style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--color-stone)' }}>
            {zenQuote.author ? `${zenQuote.text} — ${zenQuote.author}` : zenQuote.text}
          </div>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="card" style={{ width: '100%', maxWidth: '800px', padding: '24px', background: 'var(--card2)', borderRadius: '12px', marginTop: '24px', border: '1px solid var(--border)' }}>
        <div className="h2" style={{ marginBottom: '16px' }}>{t('exercises.title')}</div>

        {/* Exercise Buttons */}
        {activeExercise === 'none' && contentConfig && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
            {contentConfig.layout.exerciseOrder.map(exercise => {
              const exerciseButtons: Record<ExerciseType, React.ReactElement> = {
                zen: (
                  <button key="zen" className="btn samurai-transition" onClick={startZenExercise} style={{ padding: '12px' }}>
                    🪨 Zen Garden
                  </button>
                ),
                mountain: (
                  <button key="mountain" className="btn caucasus-transition" onClick={startMountainExercise} style={{ padding: '12px' }}>
                    ⛰️ {t('exercises.mountain')}
                  </button>
                ),
                breath: (
                  <button key="breath" className="btn samurai-transition" onClick={startBreathExercise} style={{ padding: '12px' }}>
                    🫁 {t('exercises.breathing')}
                  </button>
                ),
                eye: (
                  <button key="eye" className="btn samurai-transition" onClick={startEyeExercise} style={{ padding: '12px' }}>
                    👁 {t('exercises.eyeTraining')}
                  </button>
                ),
                stretch: (
                  <button key="stretch" className="btn samurai-transition" onClick={startStretchExercise} style={{ padding: '12px' }}>
                    🧍 {t('exercises.stretch')}
                  </button>
                )
              }
              return exerciseButtons[exercise]
            })}
          </div>
        )}

        {/* Eye Exercise Content */}
        {activeExercise === 'eye' && (
          <div style={{ padding: '16px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {/* Keep existing Eye content but unstyled if needed, or rely on inner logic */}
            <div className="h2" style={{ marginBottom: '12px' }}>{t('exercises.eyeTrainingTitle')}</div>
            <canvas ref={eyeCanvasRef} style={{ width: '100%', height: '200px', borderRadius: '8px', background: 'var(--card2)', display: 'block', marginBottom: '12px' }} />
            <div style={{ height: '4px', background: 'var(--card2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${eyeProgress}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
            </div>
            <button className="btn" onClick={stopEyeExercise} style={{ fontSize: '11px', padding: '6px 12px', marginTop: '12px' }}>{t('exercises.stop')}</button>
          </div>
        )}

        {/* Breath Exercise Content */}
        {activeExercise === 'breath' && (
          <div style={{ padding: '16px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div className="h2" style={{ marginBottom: '12px' }}>{t('exercises.breathingTitle')}</div>
            <canvas ref={breathCanvasRef} style={{ width: '300px', height: '300px', borderRadius: '50%', background: 'var(--card2)', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>{breathPhase}</div>
            <div style={{ height: '4px', width: '200px', background: 'var(--card2)', borderRadius: '2px', overflow: 'hidden', margin: '0 auto 12px' }}>
              <div style={{ height: '100%', width: `${breathProgress}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
            </div>
            <button className="btn" onClick={stopBreathExercise}>{t('exercises.stop')}</button>
          </div>
        )}

        {/* Stretch Exercise Content */}
        {activeExercise === 'stretch' && (
          <div style={{ padding: '16px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div className="h2">{t('exercises.stretchTitle')}</div>
            <div className="muted" style={{ margin: '16px 0', padding: '10px', background: 'var(--card2)', borderLeft: '3px solid var(--danger)' }}>{t('exercises.stretchWarning')}</div>
            <button className="btn" onClick={stopStretchExercise}>{t('common.close')}</button>
          </div>
        )}

        {/* Zen Garden Exercise Content */}
        {activeExercise === 'zen' && (
          <div style={{ padding: '16px', background: 'var(--card)', borderRadius: '8px', border: '2px solid var(--gold)' }}>
            <div className="h2" style={{ textAlign: 'center', marginBottom: '12px' }}>🪨 Zen Garden - 枯山水</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ZenGarden width={Math.min(600, window.innerWidth - 100)} height={400} />
            </div>
            <button className="btn" onClick={stopZenExercise} style={{ display: 'block', margin: '16px auto' }}>{t('common.close')}</button>
          </div>
        )}

        {/* Mountain Breathing */}
        {activeExercise === 'mountain' && (
          <div style={{ padding: '16px' }}>
            <MountainBreathing width={Math.min(600, window.innerWidth - 100)} height={400} onComplete={stopMountainExercise} />
            <button className="btn" onClick={stopMountainExercise} style={{ display: 'block', margin: '16px auto' }}>{t('common.close')}</button>
          </div>
        )}
      </div>

    </div>
  )
}

export default BlockedPage
