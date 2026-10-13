/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#F3F1FF', 100: '#E9E5FF', 200: '#D4CCFF', 300: '#B3A7FF',
          400: '#8B7CFF', 500: '#6D5DFB', 600: '#5A48E8', 700: '#4936C4', 800: '#3B2D9C', 900: '#2E2478',
        },
        canvas: '#FAFAFC',
        line: '#EEF0F5',
        ink: { DEFAULT: '#0F1222', soft: '#4B5065', mute: '#8A8FA3' },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6D5DFB 0%, #8B7CFF 100%)',
        'accent-gradient': 'linear-gradient(90deg, #14B8A6 0%, #22C55E 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04)',
        glow: '0 10px 30px -10px rgba(109,93,251,0.55)',
      },
    },
  },
  plugins: [],
}
