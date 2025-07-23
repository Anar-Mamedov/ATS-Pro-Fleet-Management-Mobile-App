import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, Text } from '@tamagui/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DriverMainPage from '../components/MainPage/DriverMainPage';
import ManagerMainPage from '../components/MainPage/ManagerMainPage';

export default function HomeTab() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDriver, setIsDriver] = useState<boolean | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      const companyInfo = await AsyncStorage.getItem('companyInfo');
      const companyKey = await AsyncStorage.getItem('companyKey');
      const loginResponse = await AsyncStorage.getItem('loginResponse');

      if (!companyInfo || !companyKey) {
        router.replace('/welcome');
        return;
      }

      if (!token || !id) {
        router.replace('/login');
        return;
      }

      // loginResponse kontrolü ve isDriver değerini belirleme
      if (loginResponse) {
        try {
          const parsedLoginResponse = JSON.parse(loginResponse);
          const driverStatus = parsedLoginResponse.isDriver === true;
          setIsDriver(driverStatus);
        } catch (parseError) {
          console.error('Error parsing loginResponse:', parseError);
          // Eğer parse edilemezse varsayılan olarak false (manager) kabul et
          setIsDriver(false);
        }
      } else {
        // loginResponse yoksa varsayılan olarak false (manager) kabul et
        setIsDriver(false);
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error checking login status:', error);
      router.replace('/welcome');
    }
  };

  if (!isLoggedIn || isDriver === null) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$background">
        <Text fontSize="$5">{t('loading')}</Text>
      </Stack>
    );
  }

  // isDriver değerine göre uygun bileşeni render et
  return isDriver ? <DriverMainPage /> : <ManagerMainPage />;
}
