/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Temaş camgöbeği teması
        accent: {
          DEFAULT: '#31b7e6',
          light: '#45c6f0',
          dark: '#168fc0',
          darker: '#0b5f83',
        },
        ink: '#111820',
        muted: '#52606b',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 22px 58px rgba(19, 118, 158, .16)',
        card: '0 18px 40px rgba(19, 118, 158, .11)',
      },
      borderRadius: {
        xl2: '22px',
        xl3: '28px',
      },
      keyframes: {
        heroGlow: {
          '0%, 100%': { transform: 'scale(.98)', opacity: '.78' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
      },
      animation: {
        heroGlow: 'heroGlow 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
