import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { messagingClient } from '../../shared/messaging/client'
import { normalizeHost } from '../../shared/utils/domain'
import { initI18n } from '../../shared/i18n'
import { SamuraiShieldIcon, ArrowRightIcon, CheckIcon } from '../../shared/components/Icons'

enum Step {
    INTRO = 0,
    PHILOSOPHY = 1,
    SETUP = 2,
    FINISH = 3
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0
    })
}

const App: React.FC = () => {
    const [step, setStep] = useState<Step>(Step.INTRO)
    const [direction, setDirection] = useState(0)
    const [siteInput, setSiteInput] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        initI18n()
    }, [])

    const paginate = (newDirection: number) => {
        setDirection(newDirection)
        setStep(step + newDirection)
    }

    const handleFinish = async () => {
        setLoading(true)
        try {
            if (siteInput) {
                const host = normalizeHost(siteInput)
                if (host) {
                    await messagingClient.addSite(host)
                }
            }

            // Mark onboarding as seen
            // We need to add this method to messaging client or access storage directly via client
            await messagingClient.setOnboardingSeen(true)

            // Close tab or open options
            window.close()
        } catch (err) {
            console.error('Error finishing onboarding:', err)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-washi flex flex-col items-center justify-center p-6 text-sumi-black overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/noise.png')]"></div>

            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
                {/* Progress Dots */}
                <div className="flex gap-3 mb-12">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-500 ${step === i ? 'bg-accent scale-125' : 'bg-sumi-gray/30'}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    {step === Step.INTRO && (
                        <motion.div
                            key="intro"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
                            className="flex flex-col items-center text-center max-w-lg"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="mb-8"
                            >
                                <img src="/zen-circle.png" alt="Focusan" className="w-32 h-32 opacity-90 drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-serif text-sumi-black mb-4 tracking-tight">Focusan</h1>
                            <p className="text-xl text-sumi-gray font-serif italic mb-8">"Where attention goes, energy flows."</p>

                            <button
                                onClick={() => paginate(1)}
                                className="btn primary text-lg px-8 py-3 shadow-lantern group"
                            >
                                Begin Journey <ArrowRightIcon className="ml-2 inline group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                    {step === Step.PHILOSOPHY && (
                        <motion.div
                            key="philosophy"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex flex-col items-center text-center max-w-lg"
                        >
                            <div className="mb-8 p-6 bg-white/60 rounded-full">
                                <SamuraiShieldIcon size={64} className="text-accent" />
                            </div>

                            <h2 className="text-3xl font-serif mb-6">Guard Your Mind</h2>
                            <p className="text-lg text-sumi-gray/80 leading-relaxed mb-8">
                                In a world of constant noise, your attention is your most valuable weapon.
                                Focusan helps you build a fortress around your mind, allowing only what matters to enter.
                            </p>

                            <button
                                onClick={() => paginate(1)}
                                className="btn secondary text-lg px-8 py-3"
                            >
                                I Understand
                            </button>
                        </motion.div>
                    )}

                    {step === Step.SETUP && (
                        <motion.div
                            key="setup"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex flex-col items-center text-center max-w-lg w-full"
                        >
                            <h2 className="text-3xl font-serif mb-4">Identify the Enemy</h2>
                            <p className="text-sumi-gray mb-8">What is the one site that distracts you the most?</p>

                            <div className="w-full max-w-sm relative mb-8">
                                <input
                                    type="text"
                                    value={siteInput}
                                    onChange={(e) => setSiteInput(e.target.value)}
                                    placeholder="e.g. twitter.com"
                                    className="w-full px-6 py-4 rounded-xl border-2 border-border bg-white text-lg font-mono text-center focus:border-accent outline-none shadow-inner transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => paginate(-1)}
                                    className="text-sumi-gray hover:text-sumi-black px-4 py-2"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => paginate(1)}
                                    className="btn primary text-lg px-8 py-3 shadow-md"
                                    disabled={!siteInput}
                                >
                                    Continue
                                </button>
                            </div>

                            <button
                                onClick={() => paginate(1)}
                                className="mt-6 text-sm text-sumi-gray/50 hover:text-accent underline decoration-dotted"
                            >
                                Skip for now
                            </button>
                        </motion.div>
                    )}

                    {step === Step.FINISH && (
                        <motion.div
                            key="finish"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="flex flex-col items-center text-center max-w-lg"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="mb-8 w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center shadow-lg"
                            >
                                <CheckIcon size={48} strokeWidth={3} />
                            </motion.div>

                            <h2 className="text-3xl font-serif mb-4">You Are Ready</h2>
                            <p className="text-lg text-sumi-gray mb-8">
                                Your dojo is prepared. May your focus be sharp as a katana.
                            </p>

                            <button
                                onClick={handleFinish}
                                className="btn primary text-lg px-10 py-4 shadow-lantern flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? 'Entering...' : 'Enter Focusan'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default App
