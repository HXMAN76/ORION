/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core Backgrounds (Per Design Reference)
                'orion-bg': {
                    app: '#060606',        // --bg-darkest
                    panel: '#0A0A0A',      // Sidebar/panel backgrounds
                    card: '#181811',       // --bg-card for bubbles, modals
                    elevated: '#1E1E18',   // Slightly elevated surfaces
                    hover: '#252520',      // Hover states
                },
                // Text Hierarchy
                'orion-text': {
                    primary: '#FFFFFF',    // --text-white
                    secondary: '#AAAAAA',  // Medium emphasis
                    muted: '#888888',      // --text-muted
                },
                // Accent System (Lime Green per reference)
                'orion-accent': {
                    DEFAULT: '#A0FF9B',    // --primary-accent (lime green)
                    light: '#B8FFB4',      // Lighter variant
                    dark: '#7BCC78',       // Darker variant
                    glow: 'rgba(160, 255, 155, 0.15)',
                },
                // Status Colors
                'orion-success': '#22C55E',
                'orion-warning': '#F59E0B',
                'orion-error': '#EF4444',
                // Borders
                'orion-border': {
                    DEFAULT: 'rgba(255,255,255,0.08)',
                    light: 'rgba(255,255,255,0.12)',
                    accent: 'rgba(160,255,155,0.3)',
                },
            },
            fontFamily: {
                sans: ['Gantari', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
                'base': ['0.875rem', { lineHeight: '1.5rem' }],
                'lg': ['1rem', { lineHeight: '1.75rem' }],
                'xl': ['1.125rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.25rem', { lineHeight: '2rem' }],
                '3xl': ['1.5rem', { lineHeight: '2rem' }],
                '4xl': ['2rem', { lineHeight: '2.5rem' }],
            },
            spacing: {
                'sidebar': '260px',
                'context': '320px',
                'topbar': '48px',
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
                'full': '9999px',
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(160, 255, 155, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(160, 255, 155, 0.4)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-accent': 'linear-gradient(135deg, rgba(160,255,155,0.1) 0%, rgba(123,204,120,0.05) 100%)',
                'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
            },
        },
    },
    plugins: [],
}
