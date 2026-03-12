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
        bg:              '#0d1117',   // deep blue-black — premium dark base
        surface:         '#161b22',   // card surface — subtle elevation
        'surface-hover': '#21262d',   // hovered card
        border:          '#30363d',   // crisp subtle borders
        accent:          '#4d8fd4',   // muted blue — softer, less glaring
        'accent-dim':    '#1e3a5f',   // deep blue — icon backgrounds
        text:            '#e6edf3',   // soft off-white — easy on eyes
        muted:           '#8b949e',   // warm gray muted
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
export default config
