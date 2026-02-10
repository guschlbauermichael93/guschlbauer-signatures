import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Guschlbauer Brand Colors
        brand: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6b978',
          400: '#f19342',
          500: '#ed751d', // Primary
          600: '#de5b13',
          700: '#b84412',
          800: '#933717',
          900: '#772f16',
          950: '#401509',
        },
        wheat: {
          50: '#fdfcf9',
          100: '#f9f6ed',
          200: '#f2ebd7',
          300: '#e8d9b8',
          400: '#dcc294',
          500: '#cfa76f',
          600: '#c19155',
          700: '#a17545',
          800: '#835f3d',
          900: '#6b4f35',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
