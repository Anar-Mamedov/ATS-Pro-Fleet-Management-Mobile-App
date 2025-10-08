import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: 'hsl(0, 0%, 94.1%)',
      backgroundStrong: '#F7F7F8',
    },
    dark: {
      ...config.themes.dark,
      background: '#111111',
      color1: '#212121',
      backgroundStrong: '#1C1C1E',
    },
  },
});

export default appConfig;

export type Conf = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
