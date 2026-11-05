/**
 * Tailwind configuration for BRANDCORE.
 * Colors mirror the tokens in docs/DESIGN.md §2 (the sole UI authority).
 * Token shades override Tailwind defaults of the same name on purpose so that
 * e.g. `text-teal-700` always resolves to the BRANDCORE value.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7FA',
        surface: '#FFFFFF',
        'surface-muted': '#EEF2F6',
        navy: { 950: '#142235', 800: '#203750' },
        slate: { 700: '#42556B', 600: '#5C6D80', 500: '#718197' },
        border: '#DCE3EA',
        teal: { 700: '#147A72', 100: '#DDF3EF' },
        amber: { 700: '#986000', 100: '#FFF1CC' },
        red: { 700: '#B42318', 100: '#FEE4E2' },
        green: { 700: '#137547', 100: '#DDF5E7' },
        'text-primary': '#162638',
        'text-secondary': '#5C6D80',
        'focus-ring': '#2563EB',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
