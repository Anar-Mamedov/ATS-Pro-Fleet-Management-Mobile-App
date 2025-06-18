import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@tamagui/button';
import { Stack, Text } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { apiService } from '../../services/apiService';

export default function HomeTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      const companyInfo = await AsyncStorage.getItem('companyInfo');
      const companyKey = await AsyncStorage.getItem('companyKey');

      if (!companyInfo || !companyKey) {
        router.replace('/welcome');
        return;
      }

      if (!token || !id) {
        router.replace('/login');
        return;
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error checking login status:', error);
      router.replace('/welcome');
    }
  };

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
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/login');
    }
  };

  if (!isLoggedIn) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$background">
        <Text fontSize="$5">{t('loading')}</Text>
      </Stack>
    );
  }

  return (
    <Stack flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          ATS Pro Mobile
        </Text>
        <Text fontSize="$5" marginBottom="$6" textAlign="center">
          {t('home')}
        </Text>

        <Button backgroundColor="#007AFF" color="white" size="$4" marginBottom="$4" onPress={testApiCall} disabled={loading}>
          {loading ? t('loading') : 'API Test'}
        </Button>

        <Button backgroundColor="#FF3B30" color="white" size="$4" onPress={handleLogout}>
          {t('logout')}
        </Button>
      </YStack>
    </Stack>
  );
}
