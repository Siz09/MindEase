export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        bento: '1.5rem',
      },
      colors: {
        background: '#f8f7ff',
        'background-dark': '#1a1625',
        surface: '#ffffff',
        'surface-secondary': '#f3f1ff',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        'accent-dark': '#5b21b6',
        text: '#1f1f1f',
        'text-light': '#666666',
        border: '#e5e3ff',
      },
      boxShadow: {
        bento: '0 10px 30px rgba(124, 58, 237, 0.08)',
      },
    },
  },
  plugins: [],
};
