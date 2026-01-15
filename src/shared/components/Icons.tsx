import React from 'react'
import {
    Settings,
    Shield,
    Scroll,
    X,
    Calendar,
    Shuffle,
    Leaf,
    Layout,
    Flame,
    Timer,
    Hash,
    Play,
    Pause,
    Trash2,
    ArrowRight,
    Check,
    ChevronDown,
    type LucideProps
} from 'lucide-react'

// Re-export Lucide icons for consistency
export const SettingsIcon = Settings
export const ShieldIcon = Shield
export const ScrollIcon = Scroll
export const XIcon = X
export const CalendarIcon = Calendar
export const ShuffleIcon = Shuffle
export const LeafIcon = Leaf
export const LayoutIcon = Layout
export const FlameIcon = Flame
export const TimerIcon = Timer
export const HashIcon = Hash
export const PlayIcon = Play
export const PauseIcon = Pause
export const TrashIcon = Trash2
export const ChevronDownIcon = ChevronDown
export const ArrowRightIcon = ArrowRight
export const CheckIcon = Check

// Standardized Custom Icons that match Lucide style
// Default stroke width: 1.5px (Lucide default is 2px, but we can override or match)
// Lucide 'thin' is often desired for Zen look. Let's stick to Lucide default props spread first,
// but default strokeWidth to 1.5 if not specified, to match the "Zen" aesthetic.

export const SamuraiShieldIcon: React.FC<LucideProps> = ({ size = 24, strokeWidth = 1.5, className, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M5 4h14v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4z" />
        <path d="M5 9h14" />
        <path d="M5 14h14" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
        <rect x="10" y="10" width="4" height="4" rx="1" />
    </svg>
)

export const KatanakakeIcon: React.FC<LucideProps> = ({ size = 24, strokeWidth = 1.5, className, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        {/* Base */}
        <path d="M3 20h18" />

        {/* Stands */}
        <path d="M7 20v-8" />
        <path d="M17 20v-8" />

        {/* Hooks */}
        <path d="M7 12a2 2 0 0 1 2-2" />
        <path d="M17 12a2 2 0 0 0-2-2" />

        {/* Katana (Curved) */}
        <path d="M3 12c4.5 3 12.5 3 18 -1" />

        {/* Tsuba (Guard) */}
        <path d="M6.5 13.5l1 -2" />
    </svg>
)

export const MizuhikiIcon: React.FC<LucideProps> = ({ size = 24, strokeWidth = 1.5, className, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path d="M12 6V12L16 16" />
        <path d="M12 12L8 16" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

export const KabutoIcon: React.FC<LucideProps> = ({ size = 24, strokeWidth = 1.5, className, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 2L4.5 10H19.5L12 2Z" />
        <path d="M4.5 10V18C4.5 20.2091 6.29086 22 8.5 22H15.5C17.7091 22 19.5 20.2091 19.5 18V10" />
        <path d="M2 13H22" />
        <path d="M12 14V18" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    </svg>
)
