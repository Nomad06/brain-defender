/**
 * 3-Step Challenge Modal (Generic)
 * Prevents accidental actions (deletion, saving sensitive changes) with progressive challenges:
 * 1. CAPTCHA - Type distorted code from canvas
 * 2. Math Problem - Solve arithmetic problem
 * 3. Hold Button - Press and hold for 10 seconds
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { t } from '../shared/i18n'

interface ChallengeModalProps {
    title?: string
    description?: string
    onConfirm: () => void
    onCancel: () => void
    actionType?: 'delete' | 'save'
}

type Step = 1 | 2 | 3

const ChallengeModal: React.FC<ChallengeModalProps> = ({
    title,
    description,
    onConfirm,
    onCancel,
    actionType = 'delete'
}) => {
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

    // Colors based on action type

    const mainColorClass = actionType === 'delete' ? 'bg-danger' : 'bg-accent'
    const mainTextColorClass = actionType === 'delete' ? 'text-danger' : 'text-accent'
    const mainBorderColorClass = actionType === 'delete' ? 'border-danger' : 'border-accent'
    const gradientClass = actionType === 'delete' ? 'from-danger to-orange-500' : 'from-accent to-blue-400'

    // Text
    const defaultTitle = actionType === 'delete' ? t('options.deleteChallenge') : t('options.securityChallenge')
    const defaultDescription = actionType === 'delete' ? t('options.deleteChallengeDescription', { host: '' }) : t('options.securityChallengeDescription')
    const holdText = actionType === 'delete' ? t('options.holdToDelete') : t('options.holdToSave')

    const modalTitle = title || defaultTitle
    const modalDesc = description || defaultDescription

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
        ctx.fillStyle = '#f9fafb' // gray-50
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
            const x = 30 + i * 35
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                ref={modalRef}
                className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-border"
                onClick={e => e.stopPropagation()}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="p-6 border-b border-border bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-sumi-black mb-2">
                        {modalTitle}
                    </h2>
                    <div className="text-sm text-sumi-gray">
                        {modalDesc}
                    </div>
                </div>

                <div className="p-8">
                    {/* Progress indicator */}
                    <div className="flex gap-4 mb-8">
                        <div className={`flex-1 text-center py-2 rounded-lg font-mono text-sm font-bold transition-colors ${step >= 1 ? `${mainColorClass} text-white shadow-sm` : 'bg-gray-100 text-sumi-gray'
                            }`}>
                            1
                        </div>
                        <div className={`flex-1 text-center py-2 rounded-lg font-mono text-sm font-bold transition-colors ${step >= 2 ? `${mainColorClass} text-white shadow-sm` : 'bg-gray-100 text-sumi-gray'
                            }`}>
                            2
                        </div>
                        <div className={`flex-1 text-center py-2 rounded-lg font-mono text-sm font-bold transition-colors ${step >= 3 ? `${mainColorClass} text-white shadow-sm` : 'bg-gray-100 text-sumi-gray'
                            }`}>
                            3
                        </div>
                    </div>

                    <div className="min-h-[250px] flex flex-col justify-center">
                        {/* Step 1: CAPTCHA */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-medium text-sumi-black mb-4">
                                    {t('options.step1Captcha')}
                                </h3>
                                <canvas
                                    ref={canvasRef}
                                    width={250}
                                    height={80}
                                    className="w-full border border-border rounded-lg mb-4 bg-gray-50"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        const newCode = generateCaptcha()
                                        setCaptchaCode(newCode)
                                        setUserCaptchaInput('')
                                        drawCaptcha(newCode)
                                    }}
                                    title={t('options.regenerate')}
                                />
                                <input
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:border-accent outline-none text-lg font-mono mb-4 shadow-sm"
                                    type="text"
                                    value={userCaptchaInput}
                                    onChange={e => setUserCaptchaInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleCaptchaSubmit()}
                                    placeholder={t('options.captchaPlaceholder')}
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <button
                                        className={`flex-1 px-4 py-2 rounded-lg ${mainColorClass} text-white hover:bg-opacity-90 font-medium shadow-sm`}
                                        onClick={handleCaptchaSubmit}
                                    >
                                        {t('options.submit')}
                                    </button>
                                    <button
                                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-sumi-gray hover:bg-gray-50 font-medium"
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
                            </motion.div>
                        )}

                        {/* Step 2: Math */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-medium text-sumi-black mb-4">
                                    {t('options.step2Math')}
                                </h3>
                                <div className="bg-gray-50 border border-border rounded-lg p-6 text-center text-4xl font-bold text-sumi-black mb-6 shadow-inner font-mono">
                                    {mathProblem} = ?
                                </div>
                                <input
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:border-accent outline-none text-lg font-mono mb-4 shadow-sm"
                                    type="number"
                                    value={userMathInput}
                                    onChange={e => setUserMathInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleMathSubmit()}
                                    placeholder={t('options.mathPlaceholder')}
                                    autoFocus
                                />
                                <button
                                    className={`w-full px-4 py-3 rounded-lg ${mainColorClass} text-white hover:bg-opacity-90 font-medium shadow-sm transition-colors`}
                                    onClick={handleMathSubmit}
                                >
                                    {t('options.submit')}
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Hold Button */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 className="text-lg font-medium text-sumi-black mb-2">
                                    {t('options.step3Hold')}
                                </h3>
                                <p className="text-sm text-sumi-gray mb-6">
                                    {t('options.holdDescription')}
                                </p>
                                <div className="w-full h-3 bg-gray-100 rounded-full mb-6 overflow-hidden border border-border/50">
                                    <motion.div
                                        className={`h-full bg-gradient-to-r ${gradientClass}`}
                                        style={{ width: `${holdProgress}%` }}
                                        transition={{ duration: 0.1, ease: "linear" }}
                                    />
                                </div>
                                <button
                                    className={`w-full py-4 rounded-xl text-lg font-bold transition-all transform active:scale-95 shadow-lg select-none ${isHolding
                                        ? `${mainColorClass} text-white scale-98 shadow-inner ring-4 ring-opacity-50`
                                        : `bg-white border-2 ${mainBorderColorClass} ${mainTextColorClass} hover:${mainColorClass} hover:text-white`
                                        }`}
                                    onMouseDown={handleMouseDown}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleMouseDown}
                                    onTouchEnd={handleMouseUp}
                                >
                                    {isHolding
                                        ? `${t('options.holding')} ${Math.floor(holdProgress / 10)}s / 10s`
                                        : holdText}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Cancel button */}
                <div className="p-4 bg-gray-50/50 border-t border-border">
                    <button
                        className="w-full px-4 py-2 rounded-lg text-sumi-gray hover:bg-gray-100 hover:text-sumi-black transition-colors font-medium"
                        onClick={onCancel}
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default ChallengeModal
