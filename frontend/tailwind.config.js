/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Canvas and surfaces
        canvas: {
          DEFAULT: '#F5F7FA',
          dark: '#0A0F17',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#111827',
        },
        'surface-muted': {
          DEFAULT: '#F1F5F9',
          dark: '#1E293B',
        },
        'surface-elevated': {
          DEFAULT: '#FFFFFF',
          dark: '#1F2937',
        },
        // Brand text (navy in light, neutral in dark)
        brand: {
          950: '#142235',
          dark: '#F8FAFC',
        },
        // Slate (secondary text and borders)
        slate: {
          700: '#42556B',
          600: '#5C6D80',
          500: '#718197',
          dark: '#94A3B8',
        },
        border: {
          DEFAULT: '#DCE3EA',
          dark: '#334155',
        },
        // Forest green (primary action, success, approved)
        green: {
          700: '#15803d',
          100: '#DCFCE7',
          dark: '#34D399',
        },
        // Amber (stale, warning)
        amber: {
          700: '#986000',
          100: '#FFF1CC',
          dark: '#F0C674',
        },
        // Red (error, rejected, invalid)
        red: {
          700: '#B42318',
          100: '#FEE4E2',
          dark: '#E87A6E',
        },
        // Text
        'text-primary': '#162638',
        'text-primary-dark': '#F8FAFC',
        'text-secondary': '#5C6D80',
        'text-secondary-dark': '#94A3B8',
        // Focus ring
        focus: '#15803d',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'base': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'lg': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'xl': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        '2xl': ['24px', { lineHeight: '32px', fontWeight: '700' }],
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
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
