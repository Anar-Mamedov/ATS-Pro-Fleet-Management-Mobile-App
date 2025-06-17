import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

const appConfig = createTamagui(config);

export default appConfig;

export type Conf = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
