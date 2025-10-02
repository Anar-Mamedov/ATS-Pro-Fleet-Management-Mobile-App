module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui', '@tamagui/core'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
          },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
      ],
      // Reanimated plugin must be listed last (includes worklets automatically)
      'react-native-reanimated/plugin',
    ],
  };
};
