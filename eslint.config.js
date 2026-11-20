import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import boundaries from 'eslint-plugin-boundaries'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      boundaries,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'features', pattern: 'src/features/*/**/*' },
        { type: 'common', pattern: 'src/common/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['app', 'features', 'common'] },
            {
              from: 'features',
              allow: ['common', ['features', { feature: '${from.feature}' }]],
            },
            { from: 'common', allow: ['common'] },
          ],
        },
      ],
      'boundaries/no-private': [
        'error',
        {
          allowUncles: false,
        },
      ],
    },
  },
])
