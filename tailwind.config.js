/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Los valores viven como variables CSS en index.css. `accent` es
        // el único que cambia en caliente: lo reescribe el reproductor a
        // partir de la carátula que está sonando.
        cream: {
          bg: 'rgb(var(--ground) / <alpha-value>)',
          surface: 'rgb(var(--raised) / <alpha-value>)',
          border: 'rgb(var(--rule) / <alpha-value>)',
        },
        rule: 'rgb(var(--rule) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          soft: 'rgb(var(--muted) / <alpha-value>)',
        },
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',

        // Nombres antiguos, para que el panel de admin siga funcionando
        // sin reescribirlo entero.
        wine: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          deep: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--faint) / <alpha-value>)',
          soft: 'rgb(var(--muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
};
