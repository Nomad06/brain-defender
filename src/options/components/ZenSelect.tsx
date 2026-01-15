import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '../../shared/components/Icons'

interface Option<T> {
    value: T
    label: string
}

interface ZenSelectProps<T> {
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
    label?: string
}

export function ZenSelect<T extends string | number>({ options, value, onChange, label }: ZenSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(o => o.value === value)

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative mb-6" ref={containerRef}>
            {label && <label className="block text-xs uppercase tracking-wider font-bold text-sumi-gray mb-2 ml-1">{label}</label>}

            <button
                type="button"
                className={`w-full px-4 py-3 rounded-xl border bg-white flex items-center justify-between transition-all duration-200 outline-none ${isOpen ? 'border-accent ring-2 ring-accent/10 shadow-sm' : 'border-border hover:border-gray-300'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-sumi-black font-medium">{selectedOption?.label || value}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDownIcon size={18} className="text-sumi-gray opacity-70" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-border/50 overflow-hidden ring-1 ring-black/5"
                    >
                        <ul className="py-1 max-h-60 overflow-auto custom-scrollbar">
                            {options.map((option) => (
                                <li key={String(option.value)}>
                                    <button
                                        type="button"
                                        className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between group ${value === option.value ? 'bg-accent/5 text-accent font-medium' : 'text-sumi-black hover:bg-gray-50'}`}
                                        onClick={() => {
                                            onChange(option.value)
                                            setIsOpen(false)
                                        }}
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform duration-200">{option.label}</span>
                                        {value === option.value && (
                                            <motion.div layoutId="check" className="w-2 h-2 rounded-full bg-accent" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
