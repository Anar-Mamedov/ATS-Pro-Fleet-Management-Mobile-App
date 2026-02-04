import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import dayjs from '../config/dayjs';
import { axiosInstance } from '../config/http';

type UploadablePhoto =
  | FormData
  | {
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

const extractFilePart = (payload: UploadablePhoto, fieldName: string = 'images') => {
  if (payload instanceof FormData) {
    // React Native FormData stores data in a private `_parts` array
    const maybeParts: any = (payload as any)?._parts;
    if (Array.isArray(maybeParts)) {
      for (const part of maybeParts) {
        if (Array.isArray(part) && (part[0] === fieldName || part[0] === 'images' || part[0] === 'documents') && part[1]) {
          return part[1] as { uri: string; name?: string; type?: string };
        }
      }
    }
    return null;
  }
  return payload;
};

const buildDriverDashboardLimitType = (referenceDate = dayjs()) => {
  const weekStart = referenceDate.startOf('week');
  const weekEnd = referenceDate.endOf('week');
  const monthStart = referenceDate.startOf('month');
  const monthEnd = referenceDate.endOf('month');
  const yearStart = referenceDate.startOf('year');
  const yearEnd = referenceDate.endOf('year');

  return {
    haftalikBaslangicTarih: weekStart.toISOString(),
    haftalikBitisTarih: weekEnd.toISOString(),
    aylikBaslangicTarih: monthStart.toISOString(),
    aylikBitisTarih: monthEnd.toISOString(),
    yillikBaslangicTarih: yearStart.toISOString(),
    yillikBitisTarih: yearEnd.toISOString(),
  };
};

// API servis fonksiyonları
export const apiService = {
  // Company endpoints
  getCompanyInfo: async (clientIdentifier: string) => {
    const response = await axiosInstance.get(`/ClientInfo/GetClientInfo?clientIdentifier=${clientIdentifier}`);
    return response.data;
  },

  getClientAssets: async (photoId: number, fileName: string, extension: string) => {
    const response = await axiosInstance.post(
      '/ClientInfo/GetClientAssets',
      {
        photoId: photoId,
        fileName: fileName,
        extension: extension,
      },
      {
        responseType: 'arraybuffer',
      }
    );
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

  getUserEmail: async (kullaniciKod: string, userTypeId: number, companyKey: string) => {
    const response = await axiosInstance.post(
      '/ForgotPassword/GetUserEmail',
      {
        kullaniciKod,
        userTypeId,
      },
      {
        headers: {
          Authorization: companyKey,
        },
      }
    );
    return response.data;
  },

  getResetCode: async (kullaniciId: number, kullaniciEmail: string, userTypeId: number, companyKey: string) => {
    const response = await axiosInstance.post(
      '/ForgotPassword/GetResetCode',
      {
        kullaniciId,
        kullaniciEmail,
        userTypeId,
      },
      {
        headers: {
          Authorization: companyKey,
        },
      }
    );
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

  modifyUserPassword: async (passwordData: { userId: number; previousPassword: string; updatedPassword: string; userTypeId: string }) => {
    const response = await axiosInstance.post('/Profile/ModifyUserPassword', passwordData);
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
    const payload = {
      VIds: vehicleIds,
      limitType: buildDriverDashboardLimitType(),
    };
    const response = await axiosInstance.post('/DriverDashboard/GetDriverDashboardCardSection', payload);
    return response.data;
  },

  // Driver Reminder endpoints
  getDashboardReminder: async (vId: number) => {
    const response = await axiosInstance.get(`/MobileDashboard/GetDashboardReminder?vId=${vId}`);
    return response.data;
  },

  // Fuel endpoints
  getFuelListByVehicleId: async (vehicleIds: number[], diff: number, setPointId: number, parameter: string = '') => {
    const encodedParameter = encodeURIComponent(parameter);
    const response = await axiosInstance.post(`/Fuel/GetFuelListByVehicleId?diff=${diff}&setPointId=${setPointId}&parameter=${encodedParameter}`, vehicleIds);
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

  // Document endpoints
  getDocumentsByRefGroup: async (refId: number | string, refGroup: string) => {
    const response = await axiosInstance.get('/Document/GetDocumentsByRefGroup', {
      params: {
        refId,
        refGroup,
        _: Date.now(), // cache buster
      },
    });
    return response.data;
  },

  downloadDocumentById: async (fileId: number, extension: string, fileName: string) => {
    const response = await axiosInstance.post(
      '/Document/DownloadDocumentById',
      {
        fileId,
        extension,
        fileName,
      },
      {
        responseType: 'arraybuffer',
      }
    );
    return response.data;
  },

  deleteDocumentById: async (id: number) => {
    const response = await axiosInstance.get(`/Document/DeleteDocumentById?id=${id}`);
    return response.data;
  },

  uploadDocument: async (payload: UploadablePhoto, refId: number, refGroup: string) => {
    const path = `/Document/UploadDocument?refId=${refId}&refGroup=${encodeURIComponent(refGroup)}`;

    if (Platform.OS === 'web') {
      let formData: FormData;
      if (payload instanceof FormData) {
        formData = payload;
      } else {
        const file = payload as { uri: string; name: string; type: string };
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData = new FormData();
        formData.append('documents', blob, file.name);
      }

      const response = await axiosInstance.post(path, formData, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const filePart = extractFilePart(payload, 'documents');
    if (!filePart?.uri) {
      throw new Error('Yüklenecek dosya bulunamadı (geçersiz FormData).');
    }

    console.log('Upload document filePart:', filePart);

    const token = await AsyncStorage.getItem('token');
    const uploadUrl = resolveUploadUrl(path);

    console.log('Upload URL:', uploadUrl);
    console.log('File URI:', filePart.uri);

    const result = await FileSystem.uploadAsync(uploadUrl, filePart.uri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'documents',
      parameters: {
        refId: String(refId),
        refGroup,
      },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload result:', { status: result.status, body: result.body });

    if (result.status >= 400) {
      let message = `Doküman yüklenemedi (status ${result.status})`;
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

  // KmLog endpoints
  addKmLog: async (kmLogData: { kmAracId: number; tarih: string; saat: string; eskiKm: number; yeniKm: number; kaynak: string; lokasyonId: number; surucuId: number }) => {
    const response = await axiosInstance.post('/KmLog/AddKmLog', [kmLogData]);
    return response.data;
  },

  // Vehicle Fines endpoints
  getVehicleFinesListByVehicleId: async (vehicleIds: number[], diff: number, setPointId: number, parameter: string = '') => {
    const encodedParameter = encodeURIComponent(parameter);
    const response = await axiosInstance.post(`/VehicleFines/GetVehicleFinesListByVehicleId?diff=${diff}&setPointId=${setPointId}&parameter=${encodedParameter}`, vehicleIds);
    return response.data;
  },

  // Vehicle Services endpoints
  getVehicleServicesByVehicleIds: async (vehicleIds: number[], diff: number, setPointId: number, parameter: string = '') => {
    const encodedParameter = encodeURIComponent(parameter);
    const url = `/VehicleServices/GetVehicleServicesByVehicleIds?diff=${diff}&setPointId=${setPointId}&parameter=${encodedParameter}`;
    const payload = {
      vIds: vehicleIds,
      filter: {
        lokasyonIds: [],
        servisNedeniIds: [],
        servisTanimIds: [],
      },
    };
    const response = await axiosInstance.post(url, payload);
    return response.data;
  },
};
