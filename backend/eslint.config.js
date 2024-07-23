// eslint.config.js

/** @type {import('eslint').Linter.FlatConfig} */
const config = [
    {
      languageOptions: {
        globals: {
          browser: true,
          node: true,
          jest: true
        },
        parserOptions: {
          ecmaVersion: 2021,
          sourceType: 'module'
        }
      },
      rules: {
        'no-console': 'warn',
        'no-unused-vars': 'warn',
        'semi': ['error', 'always'],
        // Jest specific rules
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/consistent-test-it': ['error', { fn: 'test' }]
      },
      plugins: {
        jest: require('eslint-plugin-jest')
      }
    }
  ];
  
  module.exports = config;  