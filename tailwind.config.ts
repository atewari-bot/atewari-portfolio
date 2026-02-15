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
        bg: '#0f1117',
        surface: '#1a1d27',
        'surface-hover': '#22263a',
        border: '#2a2e42',
        accent: '#6c8ef5',
        'accent-dim': '#3a4a8a',
        text: '#e2e6f0',
        muted: '#8891aa',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
export default config
