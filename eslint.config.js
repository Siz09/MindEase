import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import babelParser from '@babel/eslint-parser';

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
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser, // ⬅️ allow document, window, console, etc.
      },
    },
    plugins: {
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-unused-vars': 'warn', // instead of error (soften noise)
      'react/react-in-jsx-scope': 'off', // not needed in React 17+
    },
  },
];
