/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#60A5FA',
          foreground: '#E8EEF7',
        },
        background: '#05070B',
        surface: {
          DEFAULT: '#0C101C',
          dark: '#05070B',
        },
        sidebar: {
          DEFAULT: '#070A12',
          muted: '#C8D4E6',
        },
        foreground: '#F4F7FB',
        muted: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          foreground: '#C8D4E6',
        },
        critico: '#FB7185',
        atencion: '#FBBF24',
        monitorear: '#34D399',
        border: 'rgba(96,165,250,0.22)',
        ring: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 0 1px rgba(96,165,250,0.18), 0 12px 40px -16px rgba(59,130,246,0.45)',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(251, 113, 133, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(251, 113, 133, 0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
