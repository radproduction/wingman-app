/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Light theme ──────────────────────────────────────────────
        bg: '#f4f6fc',          // page background (very light blue-gray)
        card: '#ffffff',        // card / surface
        'card-2': '#eef1fb',    // slightly deeper surface
        accent: '#4b57e6',      // brand indigo-blue (pops on white)
        'accent-dim': '#6b73ff',
        txt: '#0e1330',         // primary ink
        gray: '#6b7285',        // captions / labels (medium)
        'gray-light': '#3b4260',// prominent secondary text (darker on light)
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        // IMPORTANT: this codebase was authored dark-first and uses `text-white`
        // for primary text and `bg-white/N` for subtle surfaces. For the light
        // theme we remap the `white` token to ink so those keep working:
        //   text-white  -> dark ink text   (correct on a light background)
        //   bg-white/N  -> faint dark tint  (subtle surfaces / dividers)
        // Genuine white (button labels, toggle knob) uses text-bg / [#fff].
        white: '#0e1330',
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
