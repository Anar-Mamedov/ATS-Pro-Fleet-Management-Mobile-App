import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// Environment variables için constants
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-type': 'application/json',
  },
});

// Sadece HTTP interceptor'lar için gereken basit token helper'ları
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('id');
    await AsyncStorage.removeItem('loginResponse');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Aynı anda birden fazla 401 yanıtı gelirse tekrar tekrar yönlendirme/alerti tetiklememek için kilit
let isHandlingUnauthorized = false;

// Request interceptor - token ekle
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor - 401 durumunda logout
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        try {
          await removeToken();
          Alert.alert('Oturum Süresi Doldu', 'Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın.', [{ text: 'Tamam' }]);
          router.replace('/login');
        } finally {
          // Küçük bir gecikmeden sonra kilidi kaldır (ardışık 401'lerde üst üste bindirmeyi önlemek için)
          setTimeout(() => {
            isHandlingUnauthorized = false;
          }, 500);
        }
      }
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };
