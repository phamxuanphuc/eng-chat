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
    },
  },
  plugins: [],
}
