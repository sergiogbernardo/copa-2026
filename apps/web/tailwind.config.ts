import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#0b6e4f',
      },
    },
  },
  plugins: [],
} satisfies Config;
