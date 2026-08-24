/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: 'var(--bg)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-elevated': 'var(--bg-elevated)',
          text: 'var(--text)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          border: 'var(--border)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'glass-bg': 'var(--glass-bg)',
          'glass-border': 'var(--glass-border)',
        }
      },
      boxShadow: {
        card: 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'apple-glow': '0 0 120px rgba(0, 113, 227, 0.18)',
      },
      borderRadius: {
        'xsm': '8px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '22px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'bounce-soft': 'bounceSoft 1.6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(8px)', opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
