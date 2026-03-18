import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-court', 'text-court', 'border-court',
    'bg-forest', 'text-forest', 'border-forest',
    'bg-electric', 'text-electric', 'border-electric',
    'bg-sage', 'bg-sage-mid', 'border-sage-mid',
    'text-moss', 'bg-moss',
    'bg-rally', 'text-rally',
    'bg-amber-100', 'text-amber-700', 'bg-red-100', 'text-red-700',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#EFF5E4',
          mid: '#D8EBC4',
        },
        forest:   '#0D1F0A',
        court:    '#CBFF47',
        electric: '#22C55E',
        moss:     '#6B7A5E',
        rally:    '#FF5C38',
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body:    ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
