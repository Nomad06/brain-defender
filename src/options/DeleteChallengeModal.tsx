/**
 * 3-Step Deletion Challenge Modal
 * Prevents accidental site removal with progressive challenges:
 * 1. CAPTCHA - Type distorted code from canvas
 * 2. Math Problem - Solve arithmetic problem
 * 3. Hold Button - Press and hold for 10 seconds
 */

import React, { useState, useEffect, useRef } from 'react'
import { t } from '../shared/i18n'

interface DeleteChallengeModalProps {
  hosts: string[]  // Changed from single host to array
  onConfirm: () => void
  onCancel: () => void
}

type Step = 1 | 2 | 3

const DeleteChallengeModal: React.FC<DeleteChallengeModalProps> = ({ hosts, onConfirm, onCancel }) => {
  const [step, setStep] = useState<Step>(1)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userCaptchaInput, setUserCaptchaInput] = useState('')
  const [mathAnswer, setMathAnswer] = useState(0)
  const [mathProblem, setMathProblem] = useState('')
  const [userMathInput, setUserMathInput] = useState('')
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holdIntervalRef = useRef<number | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Generate random CAPTCHA code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  // Draw CAPTCHA on canvas with distortion
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Draw distorted text
    ctx.font = 'bold 32px monospace'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      const x = 20 + i * 35
      const y = 35 + (Math.random() - 0.5) * 10
      const rotation = (Math.random() - 0.5) * 0.4

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
    }
  }

  // Generate math problem
  const generateMathProblem = () => {
    const operations = ['+', '-', '*']
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let a: number, b: number, answer: number, problem: string

    if (operation === '*') {
      // Multiplication: smaller numbers
      a = 2 + Math.floor(Math.random() * 12)
      b = 2 + Math.floor(Math.random() * 12)
      answer = a * b
      problem = `${a} × ${b}`
    } else if (operation === '+') {
      // Addition
      a = 10 + Math.floor(Math.random() * 90)
      b = 10 + Math.floor(Math.random() * 90)
      answer = a + b
      problem = `${a} + ${b}`
    } else {
      // Subtraction: ensure positive result
      a = 50 + Math.floor(Math.random() * 50)
      b = 10 + Math.floor(Math.random() * 40)
      answer = a - b
      problem = `${a} - ${b}`
    }

    return { problem, answer }
  }

  // Initialize step 1 (CAPTCHA)
  useEffect(() => {
    if (step === 1) {
      const code = generateCaptcha()
      setCaptchaCode(code)
      setUserCaptchaInput('')
      // Draw after a short delay to ensure canvas is ready
      setTimeout(() => drawCaptcha(code), 50)
    }
  }, [step])

  // Initialize step 2 (Math)
  useEffect(() => {
    if (step === 2) {
      const { problem, answer } = generateMathProblem()
      setMathProblem(problem)
      setMathAnswer(answer)
      setUserMathInput('')
    }
  }, [step])

  // Initialize step 3 (Hold button)
  useEffect(() => {
    if (step === 3) {
      setHoldProgress(0)
      setIsHolding(false)
    }
  }, [step])

  // Handle CAPTCHA submission
  const handleCaptchaSubmit = () => {
    if (userCaptchaInput === captchaCode) {
      setStep(2)
    } else {
      alert(t('options.captchaIncorrect'))
      // Regenerate CAPTCHA
      const newCode = generateCaptcha()
      setCaptchaCode(newCode)
      setUserCaptchaInput('')
      drawCaptcha(newCode)
    }
  }

  // Handle math submission
  const handleMathSubmit = () => {
    const userAnswer = parseInt(userMathInput, 10)
    if (userAnswer === mathAnswer) {
      setStep(3)
    } else {
      alert(t('options.mathIncorrect'))
      // Regenerate problem
      const { problem, answer } = generateMathProblem()
      setMathProblem(problem)
      setMathAnswer(answer)
      setUserMathInput('')
    }
  }

  // Handle hold button press
  const handleMouseDown = () => {
    setIsHolding(true)
    setHoldProgress(0)

    let progress = 0
    holdIntervalRef.current = window.setInterval(() => {
      progress += 1
      setHoldProgress(progress)

      if (progress >= 100) {
        // Hold complete!
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
        setIsHolding(false)
        onConfirm()
      }
    }, 100) // Update every 100ms (10 seconds total)
  }

  // Handle hold button release
  const handleMouseUp = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    setIsHolding(false)
    setHoldProgress(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // Focus modal on mount
  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          maxWidth: '500px',
          padding: '24px',
          margin: '16px',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="h2" style={{ marginBottom: '8px' }}>
          {t('options.deleteChallenge')}
        </div>
        <div className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
          {hosts.length === 1
            ? t('options.deleteChallengeDescription', { host: hosts[0] })
            : `Пройдите 3 шага, чтобы удалить ${hosts.length} сайтов`}
        </div>
        {hosts.length > 1 && (
          <div className="muted" style={{ fontSize: '12px', marginBottom: '16px', maxHeight: '100px', overflowY: 'auto' }}>
            {hosts.map(h => <div key={h}>{h}</div>)}
          </div>
        )}

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <div
            className="kbd"
            style={{
              flex: 1,
              textAlign: 'center',
              background: step >= 1 ? 'var(--accent)' : 'var(--card2)',
              color: step >= 1 ? 'white' : 'var(--muted)',
            }}
          >
            1
          </div>
          <div
            className="kbd"
            style={{
              flex: 1,
              textAlign: 'center',
              background: step >= 2 ? 'var(--accent)' : 'var(--card2)',
              color: step >= 2 ? 'white' : 'var(--muted)',
            }}
          >
            2
          </div>
          <div
            className="kbd"
            style={{
              flex: 1,
              textAlign: 'center',
              background: step >= 3 ? 'var(--accent)' : 'var(--card2)',
              color: step >= 3 ? 'white' : 'var(--muted)',
            }}
          >
            3
          </div>
        </div>

        {/* Step 1: CAPTCHA */}
        {step === 1 && (
          <div>
            <div className="h3" style={{ marginBottom: '12px' }}>
              {t('options.step1Captcha')}
            </div>
            <canvas
              ref={canvasRef}
              width={250}
              height={70}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '12px',
                display: 'block',
              }}
            />
            <input
              className="input"
              type="text"
              value={userCaptchaInput}
              onChange={e => setUserCaptchaInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCaptchaSubmit()}
              placeholder={t('options.captchaPlaceholder')}
              autoFocus
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn primary" onClick={handleCaptchaSubmit} style={{ flex: 1 }}>
                {t('options.submit')}
              </button>
              <button
                className="btn"
                onClick={() => {
                  const newCode = generateCaptcha()
                  setCaptchaCode(newCode)
                  setUserCaptchaInput('')
                  drawCaptcha(newCode)
                }}
              >
                {t('options.regenerate')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Math */}
        {step === 2 && (
          <div>
            <div className="h3" style={{ marginBottom: '12px' }}>
              {t('options.step2Math')}
            </div>
            <div
              className="card"
              style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '12px',
                background: 'var(--card2)',
              }}
            >
              {mathProblem} = ?
            </div>
            <input
              className="input"
              type="number"
              value={userMathInput}
              onChange={e => setUserMathInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleMathSubmit()}
              placeholder={t('options.mathPlaceholder')}
              autoFocus
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <button className="btn primary" onClick={handleMathSubmit} style={{ width: '100%' }}>
              {t('options.submit')}
            </button>
          </div>
        )}

        {/* Step 3: Hold Button */}
        {step === 3 && (
          <div>
            <div className="h3" style={{ marginBottom: '12px' }}>
              {t('options.step3Hold')}
            </div>
            <div className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
              {t('options.holdDescription')}
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--card2)',
                borderRadius: '4px',
                marginBottom: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${holdProgress}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <button
              className="btn danger"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isHolding
                ? `${t('options.holding')} ${Math.floor(holdProgress / 10)}s / 10s`
                : t('options.holdToDelete')}
            </button>
          </div>
        )}

        {/* Cancel button */}
        <div className="space"></div>
        <button className="btn" onClick={onCancel} style={{ width: '100%' }}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

export default DeleteChallengeModal
