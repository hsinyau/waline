import { defineHopeConfig } from 'oxc-config-hope/oxlint';

export default defineHopeConfig(
  {
    react: true,
    vue: true,
    vitest: true,
    rules: {
      curly: ['warn', 'multi-line'],
      'no-alert': 'off',
      'no-warning-comments': 'off',
      'prefer-global-this': 'off',
      'unicorn/prefer-global-this': 'off',
      eqeqeq: 'off',
      'node/global-require': 'off',
      'node/no-process-env': 'off',
      'no-undefined': 'off',
    },
  },
  {
    files: ['src/**'],
    plugins: ['vue'],
    rules: {
      'no-shadow': 'off',
      // disabled for compatibility concern
      'prefer-named-capture-group': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'vue/max-props': ['warn', { maxProps: 5 }],
    },
  },
  {
    files: ['__tests__/**'],
    rules: {
      'vitest/expect-expect': 'off',
      'vitest/max-expects': 'off',
      'vitest/prefer-strict-equal': 'off',
      'vitest/require-mock-type-parameters': 'off',
      'vitest/require-to-throw-message': 'off',
    },
  },
);
