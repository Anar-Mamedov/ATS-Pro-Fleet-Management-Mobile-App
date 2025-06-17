import { TamaguiProvider } from '@tamagui/core';
import { Stack } from 'expo-router';
import config from '../tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <Stack />
    </TamaguiProvider>
  );
}
