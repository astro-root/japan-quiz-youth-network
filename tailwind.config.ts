import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#14213D',
        paper: '#FAF7EF',
        ink: '#1C1C1E',
        akane: '#BE2A28',
        gold: '#C9A227',
        line: '#DCD6C7',
      },
      fontFamily: {
        display: ['"Zen Kaku Gothic New"', 'sans-serif'],
        body: ['"Noto Sans JP"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
