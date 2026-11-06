/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        app:     '#0f0f0f',
        surface: '#1c1c1c',
        overlay: '#262626',
        muted:   '#2a2a2a',
        subtle:  '#1a1a1a',
        'border-default': '#2e2e2e',
        'border-strong':  '#3d3d3d',
        brand:   '#3ecf8e',
        'brand-dim': '#2a9d6e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.6' }],
      },
      boxShadow: {
        sm:    '0 1px 3px rgba(0,0,0,0.4)',
        md:    '0 4px 12px rgba(0,0,0,0.5)',
        lg:    '0 8px 24px rgba(0,0,0,0.6)',
        modal: '0 24px 48px rgba(0,0,0,0.7)',
      },
      borderRadius: {
        sm:  '4px',
        DEFAULT: '6px',
        md:  '8px',
        lg:  '10px',
        xl:  '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in':  'fadeIn 0.12s ease-out',
        'slide-up': 'slideUp 0.15s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
