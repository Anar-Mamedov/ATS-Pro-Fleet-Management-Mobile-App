import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text } from '@tamagui/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

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

      // Giriş yapılmış, tabs'a yönlendir
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error checking login status:', error);
      router.replace('/welcome');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$background">
        <Text fontSize="$5">Yükleniyor...</Text>
      </Stack>
    );
  }

  return null;
}
