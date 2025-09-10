import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { TamaguiProvider } from '@tamagui/core';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../config/i18n';
import { ThemeProvider, useThemeController } from '../config/theme';
import config from '../tamagui.config';

function ThemeBars() {
  const { themeName } = useThemeController();
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle(themeName === 'dark' ? 'light' : 'dark');
      // Make Android gesture/navigation bar transparent so content shows behind it
      // (iOS home indicator color can't be changed in Expo)
      try {
        // @ts-ignore - setBackgroundColor works with color names like 'transparent'
        NavigationBar.setBackgroundColorAsync('transparent');
      } catch {}
    }
  }, [themeName]);
  return <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TamaguiProvider config={config}>
          <ThemeProvider>
            <ThemeBars />
            <BottomSheetModalProvider>
              <Stack>
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="welcome"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="login"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </TamaguiProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
