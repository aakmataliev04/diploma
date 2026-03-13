import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
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
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    // ДОБАВЛЯЕМ БЛОК С ПРАВИЛАМИ СЮДА 👇
    rules: {
      // Обязывает ставить точку с запятой в конце строк (помогает избежать глупых ошибок)
      'semi': ['error', 'always'],

      // Строго требует указывать все зависимости в массиве хуков (useEffect, useMemo и т.д.)
      // Для CRM это критически важно, чтобы данные не "зависали" при обновлении.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
])