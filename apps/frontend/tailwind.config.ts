import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── ALTEN España corporate palette ───────────────────────────────────
        alten: {
          blue:       '#008BD2', // primary — buttons, links, highlights
          dark:       '#043962', // navbar, sidebar, dark backgrounds, headings
          red:        '#E30513', // errors, alerts, danger actions
          yellow:     '#FFED00', // accent only — never as text background
          hover:      '#0070C0', // hover state for primary elements
          'mid-blue': '#7ECBEE', // info badges, card backgrounds
          pale:       '#B3DBFB', // section backgrounds, table zebra
          body:       '#484848', // main body text
          mid:        '#8C8C9A', // secondary text, placeholders
          border:     '#E6E6E9', // borders, separators
          light:      '#E6E6E9', // legacy alias → same as border
          surface:    '#F4F6F9', // page background
        },
        // Budget status (kept for semantic correctness — WCAG AA via text labels)
        status: {
          ok:      '#16a34a',
          warning: '#d97706',
          danger:  '#dc2626',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
