import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['node_modules/', '.next/', 'pnpm-lock.yaml', 'commit-via-api.mjs', '/tmp/'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
]
