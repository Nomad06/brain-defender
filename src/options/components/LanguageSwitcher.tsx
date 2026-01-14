import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LanguageSwitcherProps {
    currentLang: string
    onLanguageChange: (lang: string) => void
}

const languages = [
    { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' }
]

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const current = languages.find(l => l.code === currentLang) || languages[0]

    return (
        <div className="relative font-sans z-50" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border
          ${isOpen
                        ? 'bg-white border-accent/20 shadow-sm text-accent'
                        : 'bg-transparent border-transparent hover:bg-black/5 text-sumi-gray hover:text-sumi-black'
                    }`}
            >
                <span className="text-lg opacity-80 filter grayscale-[0.5]">{current.flag}</span>
                <span className="text-sm font-medium tracking-wide">{current.label}</span>
                <span className={`text-[10px] transition-transform duration-200 opacity-50 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 min-w-[180px] bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border/60 overflow-hidden"
                    >
                        <div className="p-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        onLanguageChange(lang.code)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group
                    ${currentLang === lang.code
                                            ? 'bg-accent/5 text-accent font-medium'
                                            : 'text-sumi-gray hover:bg-gray-50 hover:text-sumi-black'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg transition-all ${currentLang === lang.code ? 'filter-none' : 'filter grayscale opacity-70 group-hover:filter-none group-hover:opacity-100'}`}>{lang.flag}</span>
                                        <div className="flex flex-col leading-none gap-0.5">
                                            <span className="font-medium">{lang.label}</span>
                                            <span className="text-[10px] opacity-60 font-serif tracking-in-expand">{lang.native}</span>
                                        </div>
                                    </div>
                                    {currentLang === lang.code && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-accent text-xs"
                                        >
                                            ●
                                        </motion.span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
