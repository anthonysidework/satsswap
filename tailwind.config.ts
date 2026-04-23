import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0C0C0F',
        surface: '#161620',
        card: '#1C1C28',
        border: '#2A2A3A',
        'border-light': '#363650',
        primary: {
          DEFAULT: '#F7931A',
          dark: '#D97706',
          light: '#FBBF24',
        },
        accent: '#9D4EDD',
        'text-primary': '#F0F0F0',
        'text-secondary': '#8888A0',
        'text-muted': '#555570',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(247,147,26,0.15), transparent)',
        'card-glow': 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(247,147,26,0.08), transparent)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(247,147,26,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(247,147,26,0.5)' },
        },
      },
      boxShadow: {
        orange: '0 0 20px rgba(247,147,26,0.25)',
        'orange-lg': '0 0 40px rgba(247,147,26,0.35)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}

export default config
