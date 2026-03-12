import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:              '#24283b',   // medium charcoal — clearly mid-dark, not near-black
        surface:         '#2e3348',   // card elevation — noticeably above bg
        'surface-hover': '#383e57',   // hovered card
        border:          '#454d66',   // crisp, clearly visible borders
        accent:          '#818cf8',   // indigo-400 — brighter on mid-dark bg
        'accent-dim':    '#3730a3',   // indigo-800 — icon backgrounds
        text:            '#e2e8f0',   // near-white — clear on mid-dark
        muted:           '#a8b2cc',   // noticeably bright muted — readable
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
export default config
