// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const cleanedExpoConfig = expoConfig.map((config) => {
  if (!config?.settings?.['import/resolver']) {
    return config;
  }

  const resolver = config.settings['import/resolver'];
  if (!resolver?.typescript) {
    return config;
  }

  // Remove the TypeScript resolver to avoid native binding issues in some editors.
  const { typescript, ...rest } = resolver;
  return {
    ...config,
    settings: {
      ...config.settings,
      'import/resolver': rest,
    },
  };
});

module.exports = defineConfig([
  ...cleanedExpoConfig,
  {
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', '.']],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
