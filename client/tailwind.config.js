/** Palette taken from the MotoDoor pitch deck: deep garage green, teal, ember orange, paper. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#0A3A33', 700: '#0F4A41', 900: '#062622' },
        teal: { DEFAULT: '#157F72', 50: '#E7F3F1' },
        ember: { DEFAULT: '#E8703A', 50: '#FDEEE6' },
        paper: '#F3F3EE',
        ink: '#10231F',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
