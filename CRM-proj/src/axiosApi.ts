import axios from 'axios';

export const axiosApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler: (() => void) | null = null;
let isHandlingUnauthorized = false;

export const setAxiosUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const setAxiosAuthToken = (token: string | null) => {
  if (token) {
    axiosApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete axiosApi.defaults.headers.common.Authorization;
};

axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? '');

    if (status === 401 && unauthorizedHandler && !isHandlingUnauthorized && !requestUrl.includes('/auth/login')) {
      isHandlingUnauthorized = true;

      try {
        unauthorizedHandler();
      } finally {
        window.setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 0);
      }
    }

    return Promise.reject(error);
  },
);
