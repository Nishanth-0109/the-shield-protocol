import axios, { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('sp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
