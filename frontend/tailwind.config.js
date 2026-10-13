/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Every colour reads a CSS variable, so [data-theme] flips the whole app.
      colors: {
        brand: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, v(`brand-${k}`)])),
        canvas: v('canvas'),
        surface: v('surface'),
        subtle: v('subtle'),
        line: v('line'),
        ink: { DEFAULT: v('ink'), soft: v('ink-soft'), mute: v('ink-mute') },
        success: v('success'),
        warning: v('warning'),
        danger: v('danger'),
        info: v('info'),
      },
      borderRadius: { '4xl': '1.75rem' },
      boxShadow: {
        card: 'var(--shadow-card)',
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .3s ease-out both' },
    },
  },
  plugins: [],
}
