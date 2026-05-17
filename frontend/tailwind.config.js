/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bv: {
          bg: 'var(--bv-bg)',
          'bg-deep': 'var(--bv-bg-deep)',
          surface: 'var(--bv-surface)',
          'surface-hover': 'var(--bv-surface-hover)',
          border: 'var(--bv-border)',
          accent: 'var(--bv-accent)',
          'accent-hover': 'var(--bv-accent-hover)',
          'accent-muted': 'var(--bv-accent-muted)',
          ink: 'var(--bv-ink)',
          'ink-secondary': 'var(--bv-ink-secondary)',
          'ink-muted': 'var(--bv-ink-muted)',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
