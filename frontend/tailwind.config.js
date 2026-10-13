/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Rubik', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Violet primary (gradient runs 400 → 600).
        brand: {
          50: '#F5F2FF', 100: '#ECE6FF', 200: '#DACEFF', 300: '#BFA9FF', 400: '#9D7BFF',
          500: '#7F56F5', 600: '#6A3DE8', 700: '#5A2FCC', 800: '#4825A3', 900: '#3A1F82',
        },
        // Secondary stat colours from the kit.
        pink: { DEFAULT: '#EE5DA6', soft: '#FDE7F2' },
        amber: { DEFAULT: '#F2A51A', soft: '#FFF3DB' },
        coral: { DEFAULT: '#EF6461', soft: '#FDE8E7' },
        canvas: '#ECEDF9',
        line: '#ECEAF6',
        ink: { DEFAULT: '#24223F', soft: '#5E5B7B', mute: '#9E9CB6' },
      },
      borderRadius: { '4xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(60,40,140,0.04), 0 12px 32px -14px rgba(60,40,140,0.16)',
        glow: '0 10px 24px -10px rgba(106,61,232,0.65)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .3s ease-out both' },
    },
  },
  plugins: [],
}
