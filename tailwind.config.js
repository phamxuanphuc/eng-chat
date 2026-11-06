const PALETTES = ['slate', 'indigo', 'purple', 'pink', 'emerald', 'amber', 'rose', 'red', 'blue'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const themedColors = Object.fromEntries(
  PALETTES.map((palette) => [
    palette,
    Object.fromEntries(SHADES.map((shade) => [shade, `rgb(var(--c-${palette}-${shade}) / <alpha-value>)`])),
  ])
);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: themedColors,
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        popIn: 'popIn 160ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
