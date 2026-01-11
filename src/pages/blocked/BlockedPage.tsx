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
import { HaikuCard } from './components/HaikuCard'
import { QuoteCard } from './components/QuoteCard'
import { PhraseCard } from './components/PhraseCard'
import { ThemedHeader } from './components/ThemedHeader'
import { BreathingCircles } from './components/BreathingCircles'
import { ZenCard } from './components/ZenCard'
import { ZenQuoteFooter } from './components/ZenQuoteFooter'
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
  const [blockedUrl, setBlockedUrl] = useState<string>('')
  const [activeExercise, setActiveExercise] = useState<ExerciseType | 'none'>('none')

  // Use theme content hook for abstraction
  const { theme, contentConfig, content } = useThemeContent()

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
        display: 'grid',
        placeItems: 'center',
        padding: '18px',
      }}
    >
      <div className="card" style={{ maxWidth: '980px', padding: '24px', width: '100%' }}>
        {/* Theme-aware Header */}
        {theme && contentConfig && (
          <ThemedHeader theme={theme} contentConfig={contentConfig} />
        )}

        {/* Status badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
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
              padding: '6px 16px',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--border)',
              background: 'var(--card2)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
            }}
          >
            🚫 {blockedUrl}
          </div>
          <div
            className="kintsugi-border"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--card2)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🛡️ BLOCKED
          </div>
        </div>

        {/* Theme-aware Motivational Content */}
        {theme?.metadata.id === 'japanese' ? (
          <>
            {/* Japanese Zen Theme: Breathing Circles + Zen Phrase */}
            <BreathingCircles size={200} />
            <ZenCard zenPhrase={zenPhrase} language={currentLanguage} />
          </>
        ) : (
          <>
            {/* Other themes: Use content config */}
            {content?.haiku && (
              <HaikuCard haiku={content.haiku} language={content.language} />
            )}

            {content?.quote && (
              <QuoteCard quote={content.quote} />
            )}

            {content?.phrase && (
              <PhraseCard phrase={content.phrase} />
            )}
          </>
        )}

        {/* Shoji Divider */}
        <div className="shoji-divider"></div>

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

          {/* Exercise Buttons - Theme-aware ordering */}
          {activeExercise === 'none' && contentConfig && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              {contentConfig.layout.exerciseOrder.map(exercise => {
                const exerciseButtons: Record<ExerciseType, React.ReactElement> = {
                  zen: (
                    <button key="zen" className="btn samurai-transition" onClick={startZenExercise}>
                      🪨 Zen Garden
                    </button>
                  ),
                  mountain: (
                    <button key="mountain" className="btn caucasus-transition" onClick={startMountainExercise}>
                      ⛰️ {t('exercises.mountain')}
                    </button>
                  ),
                  breath: (
                    <button key="breath" className="btn samurai-transition" onClick={startBreathExercise}>
                      🫁 {t('exercises.breathing')}
                    </button>
                  ),
                  eye: (
                    <button key="eye" className="btn samurai-transition" onClick={startEyeExercise}>
                      👁 {t('exercises.eyeTraining')}
                    </button>
                  ),
                  stretch: (
                    <button key="stretch" className="btn samurai-transition" onClick={startStretchExercise}>
                      🧍 {t('exercises.stretch')}
                    </button>
                  )
                }
                return exerciseButtons[exercise]
              })}
              <button className="btn danger samurai-transition" onClick={handleCloseTab}>
                ✕ {t('blocked.closeTab')}
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
                {t('exercises.eyeTrainingTitle')}
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                {t('exercises.eyeTrainingInstruction')}
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
                {t('exercises.stop')}
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
                {t('exercises.breathingTitle')}
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                {t('exercises.breathingInstruction')}
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
                {t('exercises.stop')}
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
                {t('exercises.stretchTitle')}
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
                {t('exercises.stretchWarning')}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 2, paddingLeft: '8px' }}>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  {t('exercises.stretchStep1')}
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  {t('exercises.stretchStep2')}
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  {t('exercises.stretchStep3')}
                </div>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--card2)', borderRadius: '6px' }}>
                  {t('exercises.stretchStep4')}
                </div>
              </div>
              <button
                className="btn"
                onClick={stopStretchExercise}
                style={{ marginTop: '16px', fontSize: '11px', padding: '6px 12px' }}
              >
                {t('common.close')}
              </button>
            </div>
          )}

          {/* Zen Garden Exercise Content */}
          {activeExercise === 'zen' && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '2px solid var(--gold)',
              }}
            >
              <div className="h2" style={{ marginBottom: '12px', textAlign: 'center' }}>
                🪨 Zen Garden - 枯山水
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
                Rake the sand mindfully. Let your thoughts flow like water through the garden.
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <ZenGarden width={Math.min(600, window.innerWidth - 100)} height={400} />
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  color: 'var(--muted)',
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                "In the garden of the mind, cultivate stillness."
              </div>
              <button
                className="btn"
                onClick={stopZenExercise}
                style={{ marginTop: '16px', fontSize: '11px', padding: '6px 12px', display: 'block', margin: '16px auto 0' }}
              >
                {t('common.close')}
              </button>
            </div>
          )}

          {/* Mountain Breathing Exercise Content */}
          {activeExercise === 'mountain' && (
            <div
              className="warrior-card tower-shadow"
              style={{
                marginTop: '20px',
                padding: '16px',
              }}
            >
              <div className="h2" style={{ marginBottom: '12px', textAlign: 'center' }}>
                ⛰️ {t('exercises.mountainTitle')}
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
                {t('exercises.mountainInstruction')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <MountainBreathing
                  width={Math.min(600, window.innerWidth - 100)}
                  height={400}
                  onComplete={stopMountainExercise}
                />
              </div>
              <div
                className="mountain-quote"
                style={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  marginTop: '12px',
                  border: 'none',
                  paddingLeft: 0,
                }}
              >
                "Стойкость камня — в его основании, стойкость человека — в его духе"
              </div>
              <button
                className="btn caucasus-btn"
                onClick={stopMountainExercise}
                style={{ marginTop: '16px', fontSize: '11px', padding: '6px 12px', display: 'block', margin: '16px auto 0' }}
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </div>

        {/* Japanese Zen Quote Footer (only for japanese theme) */}
        {theme?.metadata.id === 'japanese' && (
          <ZenQuoteFooter quote={zenQuote} language={currentLanguage} />
        )}
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
