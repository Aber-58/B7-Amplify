/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        'primary-light': '#374151',
        'primary-dark': '#000000',
        // ScribbleMind palette
        ink: '#1F2937',
        paper: '#FCFAF2',
        chalk: '#F8F9FB',
        slate: '#0F172A',
        pos: '#3ECF8E',
        neg: '#EF476F',
        neu: '#9AA0A6',
        accent: '#6C63FF',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'display': ['Manrope', 'ui-sans-serif', 'system-ui'],
        'scribble': ['Caveat', 'ui-sans-serif'],
      },
      dropShadow: {
        scribble: '0 4px 0 rgba(0,0,0,0.08)',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.08)',
        glow: '0 0 30px rgba(108,99,255,0.25)',
      },
    },
  },
  plugins: [],
}