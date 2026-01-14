import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { apiService } from '../../../services/apiService';

export default function ManagerMainPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    try {
      const data = await apiService.testApi();
      Alert.alert(t('success'), 'API call successful!');
      console.log('API Response:', data);
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'API call failed');
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('id');
      await AsyncStorage.removeItem('loginResponse');
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/login');
    }
  };

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4" color="$color">
          👔 Yönetici Paneli
        </Text>
        <Text fontSize="$5" marginBottom="$6" textAlign="center" color="$color">
          Hoş geldiniz! Yönetici ana sayfasındasınız.
        </Text>

        {/* Yönetici özel butonları */}
        <YStack space="$3" width="100%" maxWidth={300}>
          <Button backgroundColor="$blue10" color="white" size="$4" onPress={testApiCall} disabled={loading}>
            {loading ? t('loading') : t('allReminders')}
          </Button>

          <Button backgroundColor="$green10" color="white" size="$4">
            Sürücü Yönetimi
          </Button>

          <Button backgroundColor="$orange10" color="white" size="$4">
            Raporlar
          </Button>

          <Button backgroundColor="$purple10" color="white" size="$4">
            Ayarlar
          </Button>

          <Button backgroundColor="$red10" color="white" size="$4" onPress={handleLogout}>
            {t('logout')}
          </Button>
        </YStack>
      </YStack>
    </Stack>
  );
}
