import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tailwindPlugin from 'eslint-plugin-tailwindcss';

export default [
  {
    ignores: [
      '**/node_modules',
      'dist/',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
    ],
  },

  // ── Core TypeScript / React rules ────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        globalThis: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react: reactPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      ...eslintConfigPrettier.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/no-danger': 'error',
      'react/jsx-props-no-spreading': 'warn',
      'react-hooks/exhaustive-deps': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-empty': 'error',
      'no-constant-condition': 'error',
      'no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0 }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  // ── Import plugin (TypeScript-aware) ─────────────────────────────────────
  {
    ...importPlugin.flatConfigs.recommended,
    files: ['**/*.{ts,tsx,js,jsx}'],
  },
  {
    ...importPlugin.flatConfigs.typescript,
    files: ['**/*.{ts,tsx,js,jsx}'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'off',
    },
  },

  // ── Vitest globals for spec files ────────────────────────────────────────
  {
    files: ['**/*.{spec,test}.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },

  // ── Tailwind CSS ─────────────────────────────────────────────────────────
  ...tailwindPlugin.configs['flat/recommended'],
];
