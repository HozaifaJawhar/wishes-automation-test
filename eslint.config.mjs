import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Generated output and saved sessions are never linted.
  globalIgnores([
    'node_modules/',
    'test-results/',
    'playwright-report/',
    'blob-report/',
    'playwright/',
  ]),

  // TypeScript with type-aware rules. `no-floating-promises` (in recommendedTypeChecked)
  // is the single most valuable rule for Playwright: it catches a missing `await`.
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Fixture shapes must be `type` aliases: Playwright's `test.extend<T>` needs an index
      // signature that interfaces do not provide.
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  // Playwright rules for every file that touches test, expect or page (specs and page objects).
  {
    files: ['**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-raw-locators': 'warn',
      'playwright/prefer-native-locators': 'error',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-commented-out-tests': 'warn',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/prefer-to-be': 'error',
    },
  },

  // Spec files only: structure and naming rules from CLAUDE.md.
  {
    files: ['tests/**/*.spec.ts'],
    rules: {
      'playwright/require-top-level-describe': 'error',
      'playwright/prefer-lowercase-title': ['error', { ignoreTopLevelDescribe: true }],
      'playwright/valid-title': [
        'error',
        { mustMatch: { test: ['^should ', 'Test titles must start with "should"'] } },
      ],
    },
  },

  // Plain JavaScript config files are outside the TypeScript project.
  {
    files: ['**/*.mjs'],
    extends: [js.configs.recommended],
  },

  // Disables formatting rules that would fight Prettier. Keep it last.
  prettier,
);
