/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Palette taken from the login photo: blush dusk sky, slate building, rose and amber light.
      colors: {
        canvas: {
          DEFAULT: '#f8f3f1',
          deep: '#f1e7e3',
        },
        line: {
          DEFAULT: '#ebe1dd',
          strong: '#dccfca',
        },
        ink: {
          DEFAULT: '#25222b',
          soft: '#4a4450',
          muted: '#7a717c',
          faint: '#a89ea6',
        },
        brand: {
          50: '#fbf1ee',
          100: '#f5ddd6',
          200: '#ebbcaf',
          300: '#dc9686',
          400: '#c87764',
          500: '#b05f4d',
          600: '#934c3e',
          700: '#783e34',
          800: '#5f322b',
          900: '#472621',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        pop: '0 1px 2px rgba(37,34,43,0.05), 0 8px 24px -8px rgba(37,34,43,0.14)',
      },
    },
  },
  plugins: [],
}
