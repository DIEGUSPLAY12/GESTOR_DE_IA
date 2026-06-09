import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Budget status colours — also conveyed via text labels (WCAG AA)
        status: {
          ok: '#16a34a',      // green-600
          warning: '#d97706', // amber-600
          danger: '#dc2626',  // red-600
        },
      },
    },
  },
  plugins: [],
} satisfies Config
