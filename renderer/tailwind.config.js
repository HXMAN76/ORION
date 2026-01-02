/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Background colors
                'orion-bg': {
                    primary: '#0a0a0f',
                    secondary: '#12121a',
                    tertiary: '#1a1a25',
                    elevated: '#22222f',
                },
                // Text colors
                'orion-text': {
                    primary: '#ffffff',
                    secondary: '#a0a0b0',
                    muted: '#606070',
                },
                // Accent
                'orion-accent': {
                    DEFAULT: '#6366f1',
                    light: '#818cf8',
                    dark: '#4f46e5',
                },
                // Status
                'orion-success': '#22c55e',
                'orion-warning': '#f59e0b',
                'orion-error': '#ef4444',
                // Borders
                'orion-border': {
                    DEFAULT: 'rgba(255, 255, 255, 0.08)',
                    light: 'rgba(255, 255, 255, 0.12)',
                },
            },
            fontFamily: {
                sans: ['Montserrat', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
                'base': ['0.875rem', { lineHeight: '1.5rem' }],
                'lg': ['1rem', { lineHeight: '1.75rem' }],
                'xl': ['1.125rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.25rem', { lineHeight: '2rem' }],
            },
            spacing: {
                'sidebar': '280px',
                'sources': '320px',
                'command-bar': '40px',
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
