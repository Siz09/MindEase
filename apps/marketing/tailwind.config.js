// apps/marketing/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        bento: '1.5rem',
      },
      colors: {
        background: '#0f172a',
        surface: 'rgba(15, 23, 42, 0.5)',
        accent: '#0ea5e9',
        'accent-soft': '#ecf6ff',
      },
      boxShadow: {
        bento: '0 20px 45px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};
