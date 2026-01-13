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
