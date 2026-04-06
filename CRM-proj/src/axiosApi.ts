import axios from 'axios';

export const axiosApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAxiosAuthToken = (token: string | null) => {
  if (token) {
    axiosApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete axiosApi.defaults.headers.common.Authorization;
};
