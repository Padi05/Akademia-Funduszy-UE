import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4e3',
          100: '#fce9c7',
          200: '#f9d38f',
          300: '#f6bd57',
          400: '#f3a71f',
          500: '#d8950e',
          600: '#b87a0b',
          700: '#985f08',
          800: '#784406',
          900: '#582904',
        },
        gold: {
          50: '#fffef5',
          100: '#fffceb',
          200: '#fff7d1',
          300: '#fff2b7',
          400: '#ffed9d',
          500: '#ffd700',
          600: '#e6c200',
          700: '#ccad00',
          800: '#b39800',
          900: '#998300',
          950: '#7a6a00',
        },
        luxury: {
          purple: '#4a148c',
          darkPurple: '#2d1045',
          navy: '#0a0e27',
          darkNavy: '#050711',
          emerald: '#10b981',
          darkEmerald: '#047857',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
}
export default config

