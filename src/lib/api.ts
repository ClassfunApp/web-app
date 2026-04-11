import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      const message: string = error.response?.data?.message || '';
      const lower = message.toLowerCase();

      // Contact verification required → go verify email/phone
      if (lower.includes('verify your email or phone')) {
        if (window.location.pathname !== '/verify-contact') {
          window.location.href = '/verify-contact';
        }
        return Promise.reject(error);
      }

      // KYC/business verification required → go to KYC page
      if (lower.includes('verification') || lower.includes('kyc')) {
        if (window.location.pathname !== '/verification') {
          window.location.href = '/verification';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
