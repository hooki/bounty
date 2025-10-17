/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive'],
        'retro': ['"VT323"', 'monospace'],
        'roboto': ['"Roboto"', 'sans-serif'],
      },
      colors: {
        pixel: {
          bg: '#0f1419',
          'bg-light': '#1a1f2e',
          'bg-hover': '#252b3a',
          border: '#3d4451',
          text: '#e1e4e8',
          'text-muted': '#8b949e',
          accent: '#58a6ff',
          'accent-hover': '#79c0ff',
          success: '#56d364',
          warning: '#d29922',
          danger: '#f85149',
        },
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#5b21b6',
          700: '#4c1d95',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        gaming: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        neon: {
          green: '#00ff88',
          blue: '#0088ff',
          purple: '#8800ff',
          pink: '#ff0088',
          yellow: '#ffff00',
        }
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0, 0, 0, 0.5)',
        'pixel-sm': '2px 2px 0px 0px rgba(0, 0, 0, 0.5)',
        'pixel-lg': '8px 8px 0px 0px rgba(0, 0, 0, 0.5)',
        'pixel-neon': '0 0 10px #00ff41, 0 0 20px #00ff41',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'blink': 'blink 1s step-end infinite',
        'pixel-shake': 'pixel-shake 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #6366f1, 0 0 10px #6366f1, 0 0 15px #6366f1' },
          '100%': { boxShadow: '0 0 10px #6366f1, 0 0 20px #6366f1, 0 0 30px #6366f1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'pixel-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      backgroundImage: {
        'gradient-gaming': 'linear-gradient(135deg, #6366f1 0%, #d946ef 50%, #06b6d4 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #0891b2 0%, #6366f1 50%, #8b5cf6 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00ff88 0%, #0088ff 50%, #8800ff 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}