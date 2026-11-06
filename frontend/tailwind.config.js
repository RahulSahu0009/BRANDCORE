/** @type {import('tailwindcss').Config} */
export default {
  // Include both Vite and any additional source directories.
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Enable class‑based dark mode (used in our CSS).
  darkMode: 'class',
  theme: {
    extend: {
      // Merge colour palettes from both branches.
      colors: {
        // Core brand colours (shared).
        app: '#0f0f0f',
        surface: '#1c1c1c',
        overlay: '#262626',
        muted: '#2a2a2a',
        subtle: '#1a1a1a',
        'border-default': '#2e2e2e',
        'border-strong': '#3d3d3d',
        brand: '#3ecf8e',
        'brand-dim': '#2a9d6e',
        // Additional palette from Mritunjay's redesign.
        canvas: { DEFAULT: '#F5F7FA', dark: '#0A0F17' },
        surface: { DEFAULT: '#FFFFFF', dark: '#111827' },
        'surface-muted': { DEFAULT: '#F1F5F9', dark: '#1E293B' },
        'surface-elevated': { DEFAULT: '#FFFFFF', dark: '#1F2937' },
        brand: { 950: '#142235', dark: '#F8FAFC' },
        slate: { 700: '#42556B', 600: '#5C6D80', 500: '#718197', dark: '#94A3B8' },
        border: { DEFAULT: '#DCE3EA', dark: '#334155' },
        green: { 700: '#15803d', 100: '#DCFCE7', dark: '#34D399' },
        amber: { 700: '#986000', 100: '#FFF1CC', dark: '#F0C674' },
        red: { 700: '#B42318', 100: '#FEE4E2', dark: '#E87A6E' },
        'text-primary': '#162638',
        'text-primary-dark': '#F8FAFC',
        'text-secondary': '#5C6D80',
        'text-secondary-dark': '#94A3B8',
        focus: '#15803d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.6', fontWeight: '600' }],
        xl: ['20px', { lineHeight: '1.75', fontWeight: '700' }],
        '2xl': ['24px', { lineHeight: '1.75', fontWeight: '700' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        modal: '0 24px 48px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
