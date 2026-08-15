/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
        foreground: 'var(--text-main)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        border: {
          DEFAULT: 'var(--border)',
          active: 'var(--border-active)',
        },
      },
      borderRadius: {
        bigbox: 'var(--radius-bigbox)',
        card: 'var(--radius-card)',
        list: 'var(--radius-list)',
        field: 'var(--radius-field)',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(-10%)' },
          '50%': { transform: 'translateY(10%)' },
        },
      },
      animation: {
        blob: 'blob 15s infinite alternate ease-in-out',
        'float-slow': 'float-y 20s infinite ease-in-out',
        'float-fast': 'float-y 5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
