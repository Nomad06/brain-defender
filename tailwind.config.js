/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'washi-white': 'var(--washi-white)',
                'shiro-white': 'var(--shiro-white)',
                'sumi-black': 'var(--sumi-black)',
                'sumi-gray': 'var(--sumi-gray)',
                'kinari-cream': 'var(--kinari-cream)',
                'seiheki-blue': 'var(--seiheki-blue)',
                'ai-indigo': 'var(--ai-indigo)',
                'beni-red': 'var(--beni-red)',
                'sakura-pink': 'var(--sakura-pink)',
                'gold-accent': 'var(--gold-accent)',
                'bamboo-green': 'var(--bamboo-green)',
                'mist-gray': 'var(--mist-gray)',
                'mizu': 'var(--color-mizu)',
                'take': 'var(--color-take)',
                'akabeni': 'var(--color-akabeni)',
                'stone': 'var(--color-stone)',
                'gold': 'var(--gold)',
                // Semantic aliases
                'bg-1': 'var(--bg1)',
                'bg-2': 'var(--bg2)',
                'card': 'var(--card)',
                'card-2': 'var(--card2)',
                'border': 'var(--border)',
                'text': 'var(--text)',
                'muted': 'var(--muted)',
                'accent': 'var(--accent)',
                'accent-2': 'var(--accent2)',
                'danger': 'var(--danger)',
                'success': 'var(--success)',
            },
            fontFamily: {
                sans: ['var(--sans)', 'sans-serif'],
                serif: ['var(--serif)', 'serif'],
                mono: ['var(--mono)', 'monospace']
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                'lg': 'var(--radius-lg)',
                'xl': '16px',
            },
            boxShadow: {
                'zen': 'var(--shadow)',
                'zen-lg': 'var(--shadow-lg)',
                'glow': 'var(--glow)',
                'float': 'var(--shadow-float)',
                'lantern': 'var(--lantern-glow)', // Assuming this variable exists or I map it to the value if not
            },
            transitionTimingFunction: {
                'zen': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            animation: {
                'breath': 'breath 4s ease-in-out infinite alternate',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                breath: {
                    '0%': { transform: 'scale(0.98)' },
                    '50%': { transform: 'scale(1.02)' },
                    '100%': { transform: 'scale(0.98)' },
                }
            }
        },
    },
    plugins: [],
}
