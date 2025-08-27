import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import babelParser from '@babel/eslint-parser';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dev-dist/**',
      '**/.vite/**',
      '**/build/**',
      '**/coverage/**',
      'packages/ui/dist/**',
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
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // 🔧 Loosen noisy rules
      'no-unused-vars': 'warn', // not error
      'no-undef': 'warn',
      'react/react-in-jsx-scope': 'off', // React 17+
      'react/prop-types': 'off', // you may use TS or not care

      // 🔧 Prettier integration (warn instead of error)
      'prettier/prettier': 'warn',
    },
  },
];
