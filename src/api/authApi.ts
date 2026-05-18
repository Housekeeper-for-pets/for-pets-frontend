import { axiosInstance } from './axiosInstance';
import { clearTokens, saveTokens } from './tokenStorage';
import type {
  ApiResponse,
  LoginRequest,
  MessageResponse,
  ReissueTokenRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
} from '../types';

// 회원가입 API를 호출합니다.
export const signup = async (request: SignupRequest) => {
  const response = await axiosInstance.post<ApiResponse<SignupResponse>>(
    '/auth/signup',
    request,
  );

  return response.data;
};

// 로그인 API를 호출하고 성공하면 토큰을 localStorage에 저장합니다.
export const login = async (request: LoginRequest) => {
  const response = await axiosInstance.post<ApiResponse<TokenResponse>>(
    '/auth/login',
    request,
  );

  if (response.data.success) {
    saveTokens(response.data.data.accessToken, response.data.data.refreshToken);
  }

  return response.data;
};

// Refresh Token으로 Access Token을 재발급받습니다.
export const reissueToken = async (request: ReissueTokenRequest) => {
  const response = await axiosInstance.post<ApiResponse<TokenResponse>>(
    '/auth/reissue',
    request,
  );

  if (response.data.success) {
    saveTokens(response.data.data.accessToken, response.data.data.refreshToken);
  }

  return response.data;
};

// 로그아웃 API를 호출한 뒤 프론트에 저장된 토큰을 제거합니다.
export const logout = async () => {
  const response = await axiosInstance.post<ApiResponse<MessageResponse>>(
    '/auth/logout',
  );

  clearTokens();

  return response.data;
};
