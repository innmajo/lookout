/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          dark: 'rgb(var(--background) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          muted: 'rgb(var(--sidebar-muted) / <alpha-value>)',
        },
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--foreground) / 0.06)',
          foreground: 'rgb(var(--muted) / <alpha-value>)',
        },
        critico: '#E11D48',
        atencion: '#D97706',
        monitorear: '#059669',
        border: 'rgb(var(--border) / var(--border-alpha))',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--glass-shadow)',
        glow: '0 0 0 1px rgb(var(--primary) / 0.18), 0 12px 40px -16px rgb(var(--primary) / 0.45)',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(225, 29, 72, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(225, 29, 72, 0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
