import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { axiosInstance } from '../config/http';

type UploadablePhoto = FormData | {
  uri: string;
  name: string;
  type: string;
};

const resolveUploadUrl = (path: string): string => {
  const base = axiosInstance.defaults.baseURL || '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!base) {
    return path;
  }
  if (base.endsWith('/') && path.startsWith('/')) {
    return `${base}${path.slice(1)}`;
  }
  if (!base.endsWith('/') && !path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
};

const extractFilePart = (payload: UploadablePhoto) => {
  if (payload instanceof FormData) {
    // React Native FormData stores data in a private `_parts` array
    const maybeParts: any = (payload as any)?._parts;
    if (Array.isArray(maybeParts)) {
      for (const part of maybeParts) {
        if (Array.isArray(part) && part[0] === 'images' && part[1]) {
          return part[1] as { uri: string; name?: string; type?: string };
        }
      }
    }
    return null;
  }
  return payload;
};

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

  // Photo list endpoint
  getPhotosByRefGroup: async (refId: number | string, refGroup: string) => {
    const response = await axiosInstance.get('/Photo/GetPhotosByRefGroup', {
      params: {
        refId,
        refGroup,
        _: Date.now(), // cache buster so freshly uploaded photos are returned immediately
      },
    });
    return response.data;
  },

  // Photo delete endpoint
  deletePhotoById: async (photoId: number) => {
    const response = await axiosInstance.get(`/Photo/DeletePhotoById?id=${photoId}`);
    return response.data;
  },

  updateUserInfo: async (userData: { isDriver: boolean; siraNo: number; kullaniciKod: string; isim: string; aktif: boolean; soyAd: string; email: string; telefon: string }) => {
    const response = await axiosInstance.post('/User/UpdateUserInfo', userData);
    return response.data;
  },

  // Photo upload endpoint
  uploadPhoto: async (payload: UploadablePhoto, refId: number, refGroup: string, isForDefault: boolean = true) => {
    const path = `/Photo/UploadPhoto?refId=${refId}&refGroup=${encodeURIComponent(refGroup)}&isForDefault=${isForDefault}`;

    if (Platform.OS === 'web') {
      let formData: FormData;
      if (payload instanceof FormData) {
        formData = payload;
      } else {
        const file = payload as { uri: string; name: string; type: string };
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData = new FormData();
        formData.append('images', blob, file.name);
      }

      const response = await axiosInstance.post(path, formData, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const filePart = extractFilePart(payload);
    if (!filePart?.uri) {
      throw new Error('Yüklenecek dosya bulunamadı (geçersiz FormData).');
    }

    const token = await AsyncStorage.getItem('token');
    const uploadUrl = resolveUploadUrl(path);

    const result = await FileSystem.uploadAsync(uploadUrl, filePart.uri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'images',
      parameters: {
        refId: String(refId),
        refGroup,
        isForDefault: String(isForDefault),
      },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (result.status >= 400) {
      let message = `Fotoğraf yüklenemedi (status ${result.status})`;
      if (result.body) {
        try {
          const parsed = JSON.parse(result.body);
          if (parsed?.message) {
            message = parsed.message;
          }
        } catch {
          // ignore JSON parse errors and keep default message
        }
      }
      throw new Error(message);
    }

    if (!result.body) {
      return {};
    }

    try {
      return JSON.parse(result.body);
    } catch {
      return { success: true };
    }
  },

  // Driver Dashboard endpoints
  getDriverDashboardCardSection: async (vehicleIds: number[]) => {
    const response = await axiosInstance.post('/DriverDashboard/GetDriverDashboardCardSection', vehicleIds);
    return response.data;
  },

  // Driver Reminder endpoints
  getDashboardReminder: async (vId: number) => {
    const response = await axiosInstance.get(`/MobileDashboard/GetDashboardReminder?vId=${vId}`);
    return response.data;
  },

  // Numerator endpoints
  getModuleCodeByCode: async (code: string) => {
    const response = await axiosInstance.get(`/Numbering/GetModuleCodeByCode?code=${code}`);
    return response.data;
  },

  // Table Code Item endpoints
  isCodeItemExist: async (tableName: string, code: string) => {
    const response = await axiosInstance.post('/TableCodeItem/IsCodeItemExist', {
      tableName,
      code,
    });
    return response.data;
  },

  // Request Notification endpoints
  addRequestItem: async (requestData: {
    talepNo: string;
    aracId: number;
    lokasyonId: number;
    aciklama: string;
    tarih: string;
    talepDurum: string;
    talepOncelik: string;
    talepTur: string;
    talepEdenId: number;
  }) => {
    const response = await axiosInstance.post('/RequestNotification/AddRequestItem', requestData);
    return response.data;
  },

  // Location endpoints
  getChildLocationListByParentId: async (parentID: number, parameter: string = '') => {
    const response = await axiosInstance.get('/Location/GetChildLocationListByParentId', {
      params: {
        parentID,
        parameter,
      },
    });
    return response.data;
  },
};
