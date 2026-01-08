/**
 * Blocked Page for Brain Defender
 * Shown when user tries to access a blocked site
 * Includes exercises: eye training, breathing, and physical stretch
 */

import React, { useState, useEffect, useRef } from 'react'
import { t, getRandomBlockedPhrase, initI18n } from '../../shared/i18n'
import { messagingClient } from '../../shared/messaging/client'

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
  { name: 'Вдох', duration: 4000, scale: 1.0 },
  { name: 'Пауза', duration: 2000, scale: 1.0 },
  { name: 'Выдох', duration: 6000, scale: 0.3 },
  { name: 'Вдох', duration: 4000, scale: 1.0 },
  { name: 'Пауза', duration: 2000, scale: 1.0 },
  { name: 'Выдох', duration: 6000, scale: 0.3 },
  { name: 'Завершение', duration: 6000, scale: 0.6 },
]

const BlockedPage: React.FC = () => {
  const [blockedUrl, setBlockedUrl] = useState<string>('')
  const [motivationalPhrase, setMotivationalPhrase] = useState<string>('')
  const [activeExercise, setActiveExercise] = useState<'none' | 'eye' | 'breath' | 'stretch'>('none')

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
    // Initialize i18n first, then set phrase
    initI18n().then(() => {
      const phrase = getRandomBlockedPhrase()
      setMotivationalPhrase(phrase)
    })

    // Get blocked URL from query params
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url') || window.location.href
    let hostname = ''
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '')
      setBlockedUrl(hostname)
    } catch {
      setBlockedUrl(url)
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
          setBreathPhase(currentPhase.name)

          // Calculate scale with smooth interpolation
          let scale = currentPhase.scale
          if (currentPhase.name === 'Вдох') {
            scale = 0.3 + localT * 0.7
          } else if (currentPhase.name === 'Выдох') {
            scale = 1.0 - localT * 0.7
          } else if (currentPhase.name === 'Завершение') {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '18px',
      }}
    >
      <div className="card" style={{ maxWidth: '980px', padding: '18px', width: '100%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'var(--card2)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
            }}
          >
            🚫 {blockedUrl}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'var(--card2)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
            }}
          >
            🛡️ BLOCKED
          </div>
        </div>

        {/* Motivational Phrase */}
        <div
          style={{
            fontSize: 'clamp(28px, 3.2vw, 54px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: '6px 0 0',
            color: 'var(--text)',
          }}
        >
          {motivationalPhrase}
        </div>

        {/* Instructions */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            marginTop: '24px',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: '6px' }}>{t('blocked.whatToDo')}</div>
          <div className="muted">
            <div>{t('blocked.step1')}</div>
            <div>{t('blocked.step2', { count: '3' })}</div>
            <div>{t('blocked.step3')}</div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: 'var(--accent)',
                animation: 'pulse 2.2s infinite',
              }}
            />
            <div className="muted">{t('blocked.breathe')}</div>
          </div>
        </div>

        {/* Exercises Section */}
        <div
          className="card"
          style={{
            padding: '16px',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            marginTop: '24px',
          }}
        >
          <div className="h2" style={{ marginBottom: '6px' }}>
            {t('exercises.title')}
          </div>
          <div className="muted" style={{ marginBottom: '16px', fontSize: '12px' }}>
            {t('blocked.breathe')}
          </div>

          {/* Exercise Buttons */}
          {activeExercise === 'none' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn" onClick={startEyeExercise} style={{ flex: 1, minWidth: '160px' }}>
                👁 Тренировка для глаз
              </button>
              <button className="btn" onClick={startBreathExercise} style={{ flex: 1, minWidth: '160px' }}>
                🫁 Дыхание
              </button>
              <button className="btn" onClick={startStretchExercise} style={{ flex: 1, minWidth: '160px' }}>
                🧍 Мини-разминка
              </button>
              <button className="btn" onClick={handleCloseTab} style={{ flex: 1, minWidth: '160px' }}>
                ❌ {t('blocked.closeTab')}
              </button>
            </div>
          )}

          {/* Eye Exercise Content */}
          {activeExercise === 'eye' && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div className="h2" style={{ marginBottom: '12px' }}>
                Тренировка для глаз
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                Следи за точкой глазами, не двигая головой
              </div>
              <canvas
                ref={eyeCanvasRef}
                style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '8px',
                  background: 'var(--card2)',
                  display: 'block',
                  marginBottom: '12px',
                }}
              />
              <div className="progressWrap" style={{ marginBottom: '12px' }}>
                <div className="progressBar" style={{ width: `${eyeProgress}%` }} />
              </div>
              <button className="btn" onClick={stopEyeExercise} style={{ fontSize: '11px', padding: '6px 12px' }}>
                Остановить
              </button>
            </div>
          )}

          {/* Breath Exercise Content */}
          {activeExercise === 'breath' && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div className="h2" style={{ marginBottom: '12px' }}>
                Дыхание
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                Следуй ритму круга
              </div>
              <canvas
                ref={breathCanvasRef}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: '300px',
                  borderRadius: '8px',
                  background: 'var(--card2)',
                  display: 'block',
                  margin: '0 auto 12px',
                }}
              />
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 500,
                  marginBottom: '12px',
                  minHeight: '24px',
                }}
              >
                {breathPhase}
              </div>
              <div className="progressWrap" style={{ marginBottom: '12px' }}>
                <div className="progressBar" style={{ width: `${breathProgress}%` }} />
              </div>
              <button
                className="btn"
                onClick={stopBreathExercise}
                style={{ fontSize: '11px', padding: '6px 12px', display: 'block', margin: '0 auto' }}
              >
                Остановить
              </button>
            </div>
          )}

          {/* Stretch Exercise Content */}
          {activeExercise === 'stretch' && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div className="h2" style={{ marginBottom: '12px' }}>
                Мини-разминка
              </div>
              <div
                className="muted"
                style={{
                  fontSize: '12px',
                  marginBottom: '16px',
                  color: 'var(--danger)',
                  padding: '10px',
                  background: 'var(--card2)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--danger)',
                }}
              >
                ⚠️ Без резких движений
              </div>
              <div style={{ fontSize: '14px', lineHeight: 2, paddingLeft: '8px' }}>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  1. Встань
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  2. Круг плечами 5 раз
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  3. Потяни шею: вправо/влево по 5 секунд (без резких движений)
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  4. Сделай глубокий вдох
                </div>
              </div>
              <button
                className="btn"
                onClick={stopStretchExercise}
                style={{ marginTop: '16px', fontSize: '11px', padding: '6px 12px' }}
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(91, 141, 239, .3); }
          60%  { transform: scale(1.2); box-shadow: 0 0 0 12px rgba(91, 141, 239, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(91, 141, 239, 0); }
        }
      `}</style>
    </div>
  )
}

export default BlockedPage
