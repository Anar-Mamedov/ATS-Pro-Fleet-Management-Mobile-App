import 'react-native-reanimated';

import { VehicleProvider } from '@/app/context/VehicleContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { TamaguiProvider } from '@tamagui/core';
import { PortalProvider } from '@tamagui/portal';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../config/i18n';
import { ThemeProvider, useThemeController } from '../config/theme';
import config from '../tamagui.config';

function ThemeBars() {
  const { themeName } = useThemeController();
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(themeName === 'dark' ? 'light' : 'dark');
    }
  }, [themeName]);
  return <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />;
}

function UpdatePrompt() {
  const { t } = useTranslation();
  const checkingRef = useRef(false);
  const promptedRef = useRef(false);

  const checkForUpdates = useCallback(async () => {
    if (checkingRef.current || promptedRef.current) {
      return;
    }

    if (__DEV__) {
      return;
    }

    if (!Updates.isEnabled || Platform.OS === 'web') {
      return;
    }

    checkingRef.current = true;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        promptedRef.current = true;
        Alert.alert(
          t('updateAvailableTitle'),
          t('updateAvailableBody'),
          [
            {
              text: t('later'),
              style: 'cancel',
            },
            {
              text: t('updateNow'),
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (error) {
                  console.error('OTA update failed:', error);
                  promptedRef.current = false;
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error: any) {
      if (error?.code !== 'ERR_NOT_AVAILABLE_IN_DEV_CLIENT') {
        console.error('Error checking OTA update:', error);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [t]);

  useEffect(() => {
    checkForUpdates();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkForUpdates();
      }
    });

    return () => subscription.remove();
  }, [checkForUpdates]);

  return null;
}

export default function RootLayout() {
  return (
    <VehicleProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={config}>
            <PortalProvider>
              <ThemeProvider>
                <ThemeBars />
                <UpdatePrompt />
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
            </PortalProvider>
          </TamaguiProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </VehicleProvider>
  );
}
