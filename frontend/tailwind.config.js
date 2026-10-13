/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Lime accent scale (#D4F25C is the signature highlight).
        brand: {
          50: '#F8FCE8', 100: '#EFF9C9', 200: '#E3F49C', 300: '#D4F25C', 400: '#C3E440',
          500: '#A5C626', 600: '#6F880F', 700: '#506308', 800: '#3A4806', 900: '#283204',
        },
        lime: { DEFAULT: '#D4F25C', soft: '#EAF9B4', ink: '#2F3A05' },
        canvas: '#E9EAED',
        line: 'rgb(17 18 20 / 0.08)',
        ink: { DEFAULT: '#111214', soft: '#55585F', mute: '#8D9097' },
      },
      borderRadius: { '4xl': '1.75rem', '5xl': '2.25rem' },
      boxShadow: {
        card: '0 1px 2px rgba(16,18,24,0.04), 0 10px 30px -14px rgba(16,18,24,0.14)',
        float: '0 18px 50px -18px rgba(16,18,24,0.35)',
        glow: '0 8px 24px -10px rgba(17,18,20,0.55)',
      },
      backgroundImage: {
        hatch: 'repeating-linear-gradient(135deg, rgba(17,18,20,0.16) 0 1px, transparent 1px 6px)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .35s ease-out both' },
    },
  },
  plugins: [],
}
