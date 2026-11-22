import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const apiBaseUrl = configuredApiUrl
  ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('motodoor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
export default api;
