import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { router } from 'expo-router';

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
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

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
      await removeToken();
      router.replace('/');
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };
