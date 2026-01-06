/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core Backgrounds (Deep Matte Black - Cyber-Physical)
                'orion-bg': {
                    app: '#050505',        // Main app background
                    panel: '#0A0A0A',      // Panel backgrounds  
                    card: '#121212',       // Card surfaces
                    elevated: '#1A1A1A',   // Elevated elements
                    hover: '#1F1F1F',      // Hover states
                },
                // Text Hierarchy
                'orion-text': {
                    primary: '#FAFAFA',    // High emphasis
                    secondary: '#A1A1AA',  // Medium emphasis (zinc-400)
                    muted: '#52525B',      // Low emphasis (zinc-600)
                },
                // Accent System (Electric Amber)
                'orion-accent': {
                    DEFAULT: '#F59E0B',    // Electric Amber
                    light: '#FBBF24',      // Amber-400
                    dark: '#D97706',       // Amber-600
                    glow: 'rgba(245, 158, 11, 0.15)',
                },
                // Data visualization accents
                'orion-data': {
                    blue: '#3B82F6',
                    cyan: '#06B6D4',
                    green: '#22C55E',
                    purple: '#8B5CF6',
                },
                // Status Colors
                'orion-success': '#22C55E',
                'orion-warning': '#F59E0B',
                'orion-error': '#EF4444',
                // Borders
                'orion-border': {
                    DEFAULT: 'rgba(255,255,255,0.08)',
                    light: 'rgba(255,255,255,0.12)',
                    accent: 'rgba(245,158,11,0.3)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
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
                'sidebar': '240px',
                'context': '300px',
                'topbar': '36px',
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-amber': 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)',
                'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
            },
        },
    },
    plugins: [],
}
