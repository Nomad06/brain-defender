/**
 * Blocked Page for Brain Defender
 * Shown when user tries to access a blocked site
 * Includes exercises: eye training, breathing, and physical stretch
 * Theme-aware content display using abstraction layer
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t, initI18n } from '../../shared/i18n'
import { useLanguage } from '../../shared/i18n/useLanguage'
import { messagingClient } from '../../shared/messaging/client'
import { useThemeContent } from '../../shared/themes/useThemeContent'
import type { ExerciseType } from '../../shared/themes/content-config'
import { HaikuCard } from './components/HaikuCard'
import { QuoteCard } from './components/QuoteCard'
import { PhraseCard } from './components/PhraseCard'
import { BreathingCircles } from './components/BreathingCircles'
import { ZenCard } from './components/ZenCard'
import { ZenQuoteFooter } from './components/ZenQuoteFooter'
import { getRandomZenPhrase, getRandomZenQuote } from '../../shared/japanese-zen'
import ZenGarden from './ZenGarden'


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

  // Use theme content hook for abstraction (now reactive!)
  const { theme, contentConfig, content } = useThemeContent()

  // Use reactive language hook (updates when language changes in storage)
  const currentLanguage = useLanguage()

  // Japanese zen content (used when theme is japanese)
  const [zenPhrase] = useState(() => getRandomZenPhrase())
  const [zenQuote] = useState(() => getRandomZenQuote())

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-sumi-black overflow-x-hidden">
      {/* Main Block Content - Centered Zen Layout */}
      <div className="w-full max-w-4xl min-h-[80vh] flex flex-col items-center justify-center relative shoji-slide-enter shoji-slide-enter-active">
        <div className="w-full flex flex-col items-center justify-center text-center z-10">

          {/* Theme-aware Motivational Content */}
          {theme?.metadata.id === 'focusan' ? (
            <>
              {/* Focusan Theme: Breathing Circles + Zen Phrase */}
              <div className="mb-20">
                <BreathingCircles size={200} />
              </div>
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

          {/* Focusan Zen Quote Footer (only for focusan theme) */}
          {theme?.metadata.id === 'focusan' && (
            <ZenQuoteFooter quote={zenQuote} language={currentLanguage} />
          )}
        </div>
      </div>

      {/* Zen Close Button - Minimalist style for Focusan theme */}
      {theme?.metadata.id === 'focusan' ? (
        <div className="w-full max-w-4xl mt-12 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            onClick={handleCloseTab}
            className="px-10 py-4 border border-sumi-black/50 text-sumi-black text-base tracking-widest hover:bg-black/5 transition-colors font-serif"
          >
            {t('common.close')}
          </motion.button>
        </div>
      ) : (
        /* Exercise Section - For non-Japanese themes */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl p-6 mt-6 bg-white/60 backdrop-blur-md rounded-xl shadow-zen border border-border"
        >
          <div className="text-xl font-semibold mb-4 text-sumi-black">{t('exercises.title')}</div>

          {/* Exercise Buttons */}
          <AnimatePresence mode="wait">
            {activeExercise === 'none' && contentConfig && (
              <motion.div
                key="buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
              >
                {contentConfig.layout.exerciseOrder.map(exercise => {
                  const exerciseButtons: Record<ExerciseType, React.ReactElement> = {
                    zen: (
                      <button key="zen" className="p-3 flex justify-center items-center gap-2 rounded-lg bg-white border border-border hover:border-accent hover:text-accent transition-all shadow-sm" onClick={startZenExercise}>
                        <span>🪨</span> Zen Garden
                      </button>
                    ),
                    breath: (
                      <button key="breath" className="p-3 flex justify-center items-center gap-2 rounded-lg bg-white border border-border hover:border-accent hover:text-accent transition-all shadow-sm" onClick={startBreathExercise}>
                        <span>🫁</span> {t('exercises.breathing')}
                      </button>
                    ),
                    eye: (
                      <button key="eye" className="p-3 flex justify-center items-center gap-2 rounded-lg bg-white border border-border hover:border-accent hover:text-accent transition-all shadow-sm" onClick={startEyeExercise}>
                        <span>👁</span> {t('exercises.eyeTraining')}
                      </button>
                    ),
                    stretch: (
                      <button key="stretch" className="p-3 flex justify-center items-center gap-2 rounded-lg bg-white border border-border hover:border-accent hover:text-accent transition-all shadow-sm" onClick={startStretchExercise}>
                        <span>🧍</span> {t('exercises.stretch')}
                      </button>
                    )
                  }
                  return exerciseButtons[exercise]
                })}
                <button className="p-3 flex justify-center items-center gap-2 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-all shadow-sm" onClick={handleCloseTab}>
                  <span>✕</span> {t('blocked.closeTab')}
                </button>
              </motion.div>
            )}

            {/* Eye Exercise Content */}
            {activeExercise === 'eye' && (
              <motion.div
                key="eye"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-white rounded-lg border border-border"
              >
                <div className="text-lg font-semibold mb-3">{t('exercises.eyeTrainingTitle')}</div>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-border mb-3 relative max-w-full">
                  <canvas ref={eyeCanvasRef} className="w-full h-[200px] block" />
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <motion.div className="h-full bg-accent" style={{ width: `${eyeProgress}%` }} />
                </div>
                <button className="px-3 py-1.5 text-xs rounded border border-border hover:bg-gray-50 transition-colors" onClick={stopEyeExercise}>
                  {t('exercises.stop')}
                </button>
              </motion.div>
            )}

            {/* Breath Exercise Content */}
            {activeExercise === 'breath' && (
              <motion.div
                key="breath"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-white rounded-lg border border-border text-center"
              >
                <div className="text-lg font-semibold mb-3">{t('exercises.breathingTitle')}</div>
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-gray-50 border border-border overflow-hidden p-4">
                    <canvas ref={breathCanvasRef} className="block w-[300px] h-[300px]" width={300} height={300} />
                  </div>
                </div>
                <div className="text-xl font-medium mb-3 text-accent">{breathPhase}</div>
                <div className="h-1 w-[200px] mx-auto bg-gray-100 rounded-full overflow-hidden mb-4">
                  <motion.div className="h-full bg-accent" style={{ width: `${breathProgress}%` }} />
                </div>
                <button className="px-4 py-2 rounded border border-border hover:bg-gray-50 transition-colors" onClick={stopBreathExercise}>
                  {t('exercises.stop')}
                </button>
              </motion.div>
            )}

            {/* Stretch Exercise Content */}
            {activeExercise === 'stretch' && (
              <motion.div
                key="stretch"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-white rounded-lg border border-border"
              >
                <div className="text-lg font-semibold">{t('exercises.stretchTitle')}</div>
                <div className="my-4 p-3 bg-red-50 text-red-800 border-l-4 border-danger rounded text-sm">
                  {t('exercises.stretchWarning')}
                </div>
                <button className="px-4 py-2 rounded border border-border hover:bg-gray-50 transition-colors" onClick={stopStretchExercise}>
                  {t('common.close')}
                </button>
              </motion.div>
            )}

            {/* Zen Garden Exercise Content */}
            {activeExercise === 'zen' && (
              <motion.div
                key="zen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-white rounded-lg border-2 border-gold shadow-gold/10"
              >
                <div className="text-lg font-semibold text-center mb-3 text-sumi-black">🪨 Zen Garden - 枯山水</div>
                <div className="flex justify-center overflow-hidden">
                  <ZenGarden width={Math.min(600, window.innerWidth - 60)} height={400} />
                </div>
                <button className="block mx-auto mt-4 px-6 py-2 rounded border border-border hover:bg-gray-50 transition-colors" onClick={stopZenExercise}>
                  {t('common.close')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export default BlockedPage
