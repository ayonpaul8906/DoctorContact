import axios, { InternalAxiosRequestConfig } from 'axios';
import { Config } from './config';
import { TokenStorage } from './secure-store';

export const api = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Request Interceptor: Attach Bearer token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = inMemoryAccessToken;
    if (!token) {
      token = await TokenStorage.getAccessToken();
      if (token) {
        inMemoryAccessToken = token;
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = await TokenStorage.getRefreshToken();
        // Call refresh endpoint with refreshToken payload if present
        const refreshPayload = storedRefreshToken ? { refreshToken: storedRefreshToken } : {};
        const { data } = await axios.post(`${Config.API_URL}/auth/refresh`, refreshPayload, {
          headers: { 'Content-Type': 'application/json' },
        });

        const newAccessToken = data?.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          await TokenStorage.setAccessToken(newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed -> clear all session tokens
        setAccessToken(null);
        await TokenStorage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const uploadProfilePhoto = async (photoFile: {
  uri: string;
  name?: string;
  type?: string;
}) => {
  const formData = new FormData();
  formData.append('photo', {
    uri: photoFile.uri,
    name: photoFile.name || 'photo.jpg',
    type: photoFile.type || 'image/jpeg',
  } as any);

  try {
    const response = await api.post('/doctors/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    const response = await api.post('/users/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default api;

