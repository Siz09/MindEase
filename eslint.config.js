import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**', 
      '**/dev-dist/**',
      '**/.vite/**',
      '**/build/**',
      '**/coverage/**'
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // ⬅️ allow document, window, console, etc.
      },
    },
    plugins: {
      react,
    },
    rules: {
      'no-unused-vars': 'warn', // instead of error (soften noise)
      'react/react-in-jsx-scope': 'off', // not needed in React 17+
    },
  },
];
