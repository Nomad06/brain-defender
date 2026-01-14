import React from 'react'

export const SettingsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15A1.65 1.65 0 0 0 20.2 12A1.65 1.65 0 0 0 19.4 9M12 21A1.65 1.65 0 0 0 15 20.2A1.65 1.65 0 0 0 12 19.4M4.6 15A1.65 1.65 0 0 0 3.8 12A1.65 1.65 0 0 0 4.6 9M12 3A1.65 1.65 0 0 0 9 3.8A1.65 1.65 0 0 0 12 4.6M16.24 16.24A1.65 1.65 0 0 0 18.36 14.12A1.65 1.65 0 0 0 16.24 16.24M16.24 7.76A1.65 1.65 0 0 0 14.12 5.64A1.65 1.65 0 0 0 16.24 7.76M7.76 16.24A1.65 1.65 0 0 0 5.64 18.36A1.65 1.65 0 0 0 7.76 16.24M7.76 7.76A1.65 1.65 0 0 0 9.88 5.64A1.65 1.65 0 0 0 7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6-8 10-8 10z" />
    </svg>
)

export const SamuraiShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 4h14v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4z" />
        <path d="M5 9h14" />
        <path d="M5 14h14" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
        <rect x="10" y="10" width="4" height="4" rx="1" />
    </svg>
)

export const ScrollIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4Z" />
        <path d="M7 4V20" />
        <path d="M17 4V20" />
        <path d="M11 8H13" />
        <path d="M11 12H13" />
        <path d="M11 16H13" />
    </svg>
)

export const KatanakakeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

export const MizuhikiIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path d="M12 6V12L16 16" />
        <path d="M12 12L8 16" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

export const KabutoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L4.5 10H19.5L12 2Z" />
        <path d="M4.5 10V18C4.5 20.2091 6.29086 22 8.5 22H15.5C17.7091 22 19.5 20.2091 19.5 18V10" />
        <path d="M2 13H22" />
        <path d="M12 14V18" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    </svg>
)
