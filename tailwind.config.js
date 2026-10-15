/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nexa: {
          bg: '#05060f',
          navy: '#0a0c1f',
          panel: 'rgba(22, 18, 48, 0.55)',
          violet: '#8b5cf6',
          lavender: '#c4b5fd',
          glow: '#a78bfa',
          silver: '#e4e2f0',
          muted: '#9a96b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(167, 139, 250, 0.35), inset 0 0 0 1px rgba(196, 181, 253, 0.18)',
        'glow-lg': '0 0 60px rgba(139, 92, 246, 0.45)',
      },
      keyframes: {
        breathe: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.012)' } },
        halo: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '0.9' } },
        ring: { '0%': { transform: 'scale(0.92)', opacity: '0.9' }, '100%': { transform: 'scale(1.25)', opacity: '0' } },
        wave: { '0%,100%': { transform: 'scaleY(0.3)' }, '50%': { transform: 'scaleY(1)' } },
        dot: { '0%,80%,100%': { opacity: '0.25', transform: 'translateY(0)' }, '40%': { opacity: '1', transform: 'translateY(-4px)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        twinkle: { '0%,100%': { opacity: '0.2' }, '50%': { opacity: '0.9' } },
      },
      animation: {
        breathe: 'breathe 5s ease-in-out infinite',
        halo: 'halo 4s ease-in-out infinite',
        ring: 'ring 1.6s ease-out infinite',
        wave: 'wave 1s ease-in-out infinite',
        dot: 'dot 1.2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.35s ease-out both',
        twinkle: 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
