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
    const response = await axiosInstance.post('/Login', {
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
};
