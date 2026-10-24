/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f', // deep navy
          dark: '#152a45',
          light: '#2c5282',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f6f8',
          border: '#e2e8f0',
        },
        text: {
          DEFAULT: '#1a202c',
          muted: '#4a5568',
          light: '#718096',
        },
        accent: {
          DEFAULT: '#2b6cb0',
          success: '#276749',
          warning: '#c05621',
          danger: '#c53030',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}
