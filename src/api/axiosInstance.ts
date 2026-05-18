import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';
import type { ApiResponse, TokenResponse } from '../types';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 백엔드 API 호출에 공통으로 사용할 axios 인스턴스입니다.
export const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청마다 accessToken이 있으면 Authorization 헤더에 추가합니다.
axiosInstance.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Access Token이 만료되면 Refresh Token으로 재발급을 시도한 뒤 원래 요청을 한 번 재시도합니다.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const refreshToken = getRefreshToken();

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !refreshToken ||
      originalRequest.url?.includes('/auth/reissue')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await axios.post<ApiResponse<TokenResponse>>(
        '/auth/reissue',
        { refreshToken },
        {
          baseURL: '/api',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.success) {
        clearTokens();
        return Promise.reject(error);
      }

      const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
      saveTokens(accessToken, nextRefreshToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return axiosInstance(originalRequest);
    } catch {
      clearTokens();
      return Promise.reject(error);
    }
  },
);
