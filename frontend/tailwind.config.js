/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Shield Protocol brand palette
        shield: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#162032',
          900: '#0f172a',
          950: '#060b18',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
        `,
        'glass-gradient': 'linear-gradient(135deg, rgba(30,58,95,0.4) 0%, rgba(15,23,42,0.6) 100%)',
        'hero-gradient': 'linear-gradient(135deg, #060b18 0%, #0f172a 50%, #1a2744 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(30,58,95,0.3) 0%, rgba(15,23,42,0.5) 100%)',
        'blue-glow': 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.1)',
        'glow-sm': '0 0 10px rgba(59,130,246,0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59,130,246,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(59,130,246,0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
