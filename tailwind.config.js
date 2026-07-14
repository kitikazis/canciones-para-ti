/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Los valores viven como variables CSS en index.css y cambian según
        // el modo (nocturno / claro). Conservo los nombres cream/ink/wine/gold
        // para no tener que tocar cada componente.
        cream: {
          bg: 'rgb(var(--cream-bg) / <alpha-value>)',
          surface: 'rgb(var(--cream-surface) / <alpha-value>)',
          border: 'rgb(var(--cream-border) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
        },
        wine: {
          DEFAULT: 'rgb(var(--wine) / <alpha-value>)',
          deep: 'rgb(var(--wine-deep) / <alpha-value>)',
          soft: 'rgb(var(--wine-soft) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          soft: 'rgb(var(--gold-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.18), 0 14px 34px -20px rgba(0,0,0,0.45)',
        glow: '0 24px 70px -34px rgba(0,0,0,0.6)',
      },
      keyframes: {
        shimmer: {
          '0%': { opacity: '0.3', transform: 'scaleX(0.6)' },
          '50%': { opacity: '1', transform: 'scaleX(1)' },
          '100%': { opacity: '0.3', transform: 'scaleX(0.6)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3.5s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
