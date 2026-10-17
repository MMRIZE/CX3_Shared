import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { js },
    extends: ['js/recommended', stylistic.configs.recommended],
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
])
