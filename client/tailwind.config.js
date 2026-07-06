/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#020633',
        card: '#0a1050',
        'card-2': '#0d1560',
        accent: '#8b8fff',
        'accent-dim': '#5a5fcc',
        txt: '#ffffff',
        gray: '#8e9ab0',
        'gray-light': '#c8cee0',
        success: '#66ff88',
        warning: '#ffaa00',
        danger: '#ff6b6b',
      },
      borderRadius: {
        card: '14px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        title: ['24px', { lineHeight: '30px', fontWeight: '700' }],
        cardtitle: ['16px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      maxWidth: {
        mobile: '480px',
      },
      keyframes: {
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        ripple: 'ripple 0.6s linear',
      },
    },
  },
  plugins: [],
};
