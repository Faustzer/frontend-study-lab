import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  ignores: ['**/fixtures'],
  gitignore: true,

  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
    trailingComma: 'all',
    arrowParens: false,
    braceStyle: '1tbs',
  },

  typescript: true,
  vue: true,
  jsonc: false,
  yaml: false,
  markdown: true,

  rules: {
    'vue/custom-event-name-casing': 'off',
    'no-console': 'off',
    'vue/no-template-shadow': 'off',
    'vue/block-order': ['warn', {
      order: ['template', 'script', 'style'],
    }],
    // Disable perfectionist sort to avoid noise
    'perfectionist/sort-imports': 'off',
  },
})
