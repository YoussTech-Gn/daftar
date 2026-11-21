// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Explicit tsconfig: the default glob lookup breaks when the folder path contains
    // glob characters such as "(" and ")" (e.g. "New folder (2)").
    settings: {
      'import/resolver': {
        typescript: { project: 'tsconfig.json' },
      },
    },
  },
]);
