import axios from 'axios';
import { getAccessToken } from './tokenStorage';

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
