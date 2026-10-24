/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#f9f7ea',
        },
        ink: {
          DEFAULT: '#161616',
        },
        forest: {
          DEFAULT: '#426755',
          dark: '#345544',
          light: '#5a8570',
        },
        danger: {
          DEFAULT: '#ba1607',
        },
        primary: {
          DEFAULT: '#426755',
          dark: '#345544',
          light: '#5a8570',
        },
        surface: {
          DEFAULT: '#f9f7ea',
          muted: '#f0ecda',
          border: '#e0dcc8',
        },
        text: {
          DEFAULT: '#161616',
          muted: '#3d3d3d',
          light: '#6b6b6b',
          inverse: '#f9f7ea',
        },
        accent: {
          DEFAULT: '#426755',
          success: '#426755',
          warning: '#c05621',
          danger: '#ba1607',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}