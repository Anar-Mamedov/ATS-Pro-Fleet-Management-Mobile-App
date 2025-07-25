import AsyncStorage from '@react-native-async-storage/async-storage';
import { axiosInstance } from '../config/http';

// API servis fonksiyonları
export const apiService = {
  // Company endpoints
  getCompanyInfo: async (clientIdentifier: string) => {
    const response = await axiosInstance.get(`/ClientInfo/GetClientInfo?clientIdentifier=${clientIdentifier}`);
    return response.data;
  },

  // Auth endpoints
  login: async (kullaniciKod: string, sifre: string, firmaSifre: string) => {
    const response = await axiosInstance.post('/Login?isMobileClient=true', {
      KULLANICIKOD: kullaniciKod,
      SIFRE: sifre,
      firmaSifre: firmaSifre,
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await axiosInstance.post('/auth/register', { name, email, password });
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  // Jobs endpoints
  getJobs: async () => {
    const response = await axiosInstance.get('/jobs');
    return response.data;
  },

  getJob: async (id: string) => {
    const response = await axiosInstance.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData: any) => {
    const response = await axiosInstance.post('/jobs', jobData);
    return response.data;
  },

  // Applications endpoints
  getApplications: async () => {
    const response = await axiosInstance.get('/applications');
    return response.data;
  },

  createApplication: async (jobId: string) => {
    const response = await axiosInstance.post('/applications', { jobId });
    return response.data;
  },

  // Test endpoint
  testApi: async () => {
    const response = await axiosInstance.get('/test');
    return response.data;
  },

  // User profile endpoints
  getUserInfoById: async (id: string) => {
    let isDriver = false;
    try {
      const loginResponse = await AsyncStorage.getItem('loginResponse');
      if (loginResponse) {
        const parsedLoginResponse = JSON.parse(loginResponse);
        isDriver = parsedLoginResponse.isDriver === true;
      }
    } catch (error) {
      console.error('Error parsing loginResponse:', error);
      isDriver = false;
    }

    const response = await axiosInstance.get(`/User/GetUser?id=${id}&isDriver=${isDriver}`);
    return response.data;
  },

  downloadPhotoById: async (photoId: number, extension: string, fileName: string) => {
    const response = await axiosInstance.post(
      '/Photo/DownloadPhotoById',
      {
        photoId: photoId,
        extension: extension,
        fileName: fileName,
      },
      {
        responseType: 'arraybuffer',
      }
    );
    return response.data;
  },

  updateUserInfo: async (userData: { isDriver: boolean; siraNo: number; kullaniciKod: string; isim: string; aktif: boolean; soyAd: string; email: string; telefon: string }) => {
    const response = await axiosInstance.post('/User/UpdateUserInfo', userData);
    return response.data;
  },
};
