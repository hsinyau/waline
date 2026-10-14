export default {
  cooldown: (pkg) => {
    if (
      [
        '@mr-hope/',
        '@oxfmt/',
        '@oxlint/',
        '@oxlint-tsgolint/',
        '@vitest/',
        '@vue/',
        '@waline/',
      ].some((prefix) => pkg.startsWith(prefix)) ||
      [
        'oxc-config-hope',
        'oxfmt',
        'oxlint',
        'oxlint-tsgolint',
        'stylelint-config-hope',
        'tsdown',
        'vitest',
        'vue',
      ].includes(pkg)
    ) {
      return 0;
    }

    return 1;
  },
  peer: true,
  upgrade: true,
  timeout: 360000,
  target: (name) => {
    if (name === '@types/node') return 'minor';

    return 'latest';
  },
};
